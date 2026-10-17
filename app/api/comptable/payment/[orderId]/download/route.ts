/**
 * app/api/comptable/payment/[orderId]/download/route.ts
 * Route GET sécurisée pour le téléchargement du fichier technique générique.
 *
 * Sécurité :
 * - Authentification obligatoire (session)
 * - Rôle COMPTABLE ou ADMIN uniquement
 * - Vérification de l'appartenance organisationnelle
 * - Le fichier est regénéré côté serveur — jamais servi depuis /public
 * - L'en-tête Content-Disposition force le téléchargement
 * - X-File-Hash et X-Disclaimer headers inclus
 */

import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { generateBankFile } from "@/lib/payment/bank-file-service";
import { recordAuditLog } from "@/lib/audit/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("يجب تسجيل الدخول للوصول إلى هذا المورد.", { status: 401 });
  }
  if (!user.isActive) {
    return new NextResponse("الحساب غير نشط.", { status: 403 });
  }
  if (!["COMPTABLE"].includes(user.roleCode)) {
    return new NextResponse("غير مصرح لك بتحميل ملفات الدفع.", { status: 403 });
  }
  if (!user.permissions.includes("payment.process") && !user.permissions.includes("payment.read")) {
    return new NextResponse("ليس لديك الصلاحية اللازمة.", { status: 403 });
  }

  const { orderId } = await params;

  // ── Validation de l'ordre ─────────────────────────────────────────────────
  const order = await prisma.paymentOrder.findUnique({
    where: { id: orderId },
    include: { batch: { select: { organizationId: true, status: true } } },
  });

  if (!order) {
    return new NextResponse("أمر الدفع غير موجود.", { status: 404 });
  }

  // Vérification organisationnelle (multi-tenancy)
  if (
    order.batch.organizationId &&
    order.batch.organizationId !== user.organizationId
  ) {
    return new NextResponse("لا يمكن الوصول إلى ملف هذه المؤسسة.", { status: 403 });
  }

  // Vérifier que l'ordre est en cours de traitement ou payé (pas PREPARED)
  if (!["PROCESSING", "PAID", "CLOSED", "RECONCILED"].includes(order.status)) {
    return new NextResponse(
      `لا يمكن تحميل الملف لأمر في الوضعية: ${order.status}.`,
      { status: 400 }
    );
  }

  // ── Génération du fichier ─────────────────────────────────────────────────
  try {
    const fileResult = await generateBankFile(orderId, user.organizationId);

    // Audit du téléchargement
    await recordAuditLog({
      userId:       user.id,
      action:       "PAYMENT_FILE_GENERATED",
      resourceType: "PAYMENT_ORDER",
      resourceId:   orderId,
      details: {
        fileName:   fileResult.fileName,
        fileHash:   fileResult.fileHash,
        fileSize:   fileResult.fileSize,
        rowCount:   fileResult.rowCount,
        actorRole:  user.roleCode,
      },
    }).catch(() => {});

    const csvBuffer = Buffer.from(fileResult.content, "utf8");

    return new NextResponse(csvBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileResult.fileName}"`,
        "Content-Length":      String(csvBuffer.length),
        "Cache-Control":       "no-store, no-cache, private",
        "X-File-Hash":         fileResult.fileHash,
        "X-Row-Count":         String(fileResult.rowCount),
        "X-Disclaimer":        "UNI-PAY Generic Technical Export — Not an official bank format",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ في توليد الملف.";
    return new NextResponse(msg, { status: 500 });
  }
}
