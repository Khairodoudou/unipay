import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/rbac/guards";
import { getEmployeePayslipDetail } from "@/lib/employe/employe-service";
import { generatePayslipPdfBuffer } from "@/lib/employe/pdf-service";
import { recordAuditLog } from "@/lib/audit/logger";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Contrôle d'authentification serveur
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Contrôle de rôle EMPLOYE
  if (user.roleCode !== "EMPLOYE") {
    return new Response(JSON.stringify({ error: "Accès refusé" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: recordId } = await params;

  if (!recordId) {
    return new Response(JSON.stringify({ error: "Identifiant manquant" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 3. Récupération avec vérification d'ownership et de statut AUTHORIZED
    const payslipDetail = await getEmployeePayslipDetail(recordId, user);

    if (!payslipDetail) {
      // 404 sécurisé : ne révèle pas l'existence d'un bulletin non autorisé ou tiers
      return new Response(
        JSON.stringify({ error: "كشف الراتب غير متاح أو غير موجود" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Génération du flux binaire PDF
    const pdfBuffer = await generatePayslipPdfBuffer(payslipDetail);

    // 5. Journalisation d'audit assainie (aucune donnée sensible)
    await recordAuditLog({
      userId: user.id,
      action: "PAYSLIP_DOWNLOADED",
      resourceType: "PAYROLL_RECORD",
      resourceId: payslipDetail.id,
      details: JSON.stringify({
        period: payslipDetail.periodLabel,
        year: payslipDetail.year,
        month: payslipDetail.month,
      }),
    }).catch(() => {});

    const filename = `bulletin_paie_${payslipDetail.employee.matricule}_${payslipDetail.year}_${String(
      payslipDetail.month
    ).padStart(2, "0")}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("[PAYSLIP_PDF_ERROR]", error);
    return new Response(
      JSON.stringify({ error: "فشل إنشاء كشف الراتب بصيغة PDF" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
