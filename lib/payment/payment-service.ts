/**
 * lib/payment/payment-service.ts
 * Service central du module de paiement Phase 8 — أكاديميا شفاف.
 *
 * RÈGLES ABSOLUES :
 * 1. Toutes les données viennent de la DB (jamais du client).
 * 2. Les totaux sont recalculés côté serveur.
 * 3. Le RIB vient de Employee.rib (DB) — jamais du frontend.
 * 4. Chaque opération est atomique (prisma.$transaction).
 * 5. Protection anti-concurrence par updateMany conditionnel.
 * 6. أكاديميا شفاف ne prétend effectuer aucun virement bancaire réel.
 */

import { Decimal } from "@prisma/client/runtime/library";
import { randomBytes } from "crypto";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import type { UserSessionData } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import { createWorkflowNotifications } from "@/lib/workflow/notifications";
import { validatePaymentPreflight, maskRib } from "./payment-validation";
import { generateAndPersistBankFile } from "./bank-file-service";

export interface PaymentServiceResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

// ── Générateurs de références ─────────────────────────────────────────────────

function generateOrderReference(): string {
  const now = new Date();
  const yy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `OP-${yy}${mm}-${rand}`;
}

function generateTransactionReference(orderRef: string, index: number): string {
  return `TX-${orderRef.replace("OP-", "")}-${String(index + 1).padStart(4, "0")}`;
}

async function resolveCaller(testUser?: UserSessionData | null): Promise<UserSessionData | null> {
  if (testUser !== undefined) return testUser;
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

// ── 1. START_PAYMENT_PROCESSING ───────────────────────────────────────────────

/**
 * AUTHORIZED → PAYMENT_PROCESSING
 *
 * Opérations atomiques :
 * 1. Validation pré-paiement complète (pre-flight)
 * 2. Création PaymentOrder (PREPARED → PROCESSING)
 * 3. Création PaymentTransactions (PENDING)
 * 4. Génération du fichier technique générique + SHA-256
 * 5. Mise à jour atomique du batch (updateMany — anti-concurrence)
 * 6. WorkflowAction + AuditLog + Notifications
 */
export async function startPaymentProcessingService(
  batchId: string,
  testUser?: UserSessionData | null
): Promise<PaymentServiceResult> {
  // ── A. Auth ────────────────────────────────────────────────────────────────
  const user = await resolveCaller(testUser);
  if (!user) return { success: false, error: "يجب تسجيل الدخول للقيام بهذه العملية." };
  if (!user.isActive) return { success: false, error: "الحساب غير نشط." };
  if (user.roleCode !== "COMPTABLE") {
    return { success: false, error: "هذه العملية محجوزة للمحاسب المالي فقط." };
  }
  if (!user.permissions.includes("payment.process")) {
    return { success: false, error: "ليس لديك صلاحية payment.process." };
  }

  // ── B. Validation pré-paiement (hors transaction pour rapidité de retour) ─
  const preflight = await validatePaymentPreflight(batchId, user.organizationId);
  if (!preflight.valid) {
    return {
      success: false,
      error: `فشل التحقق المسبق للدفع: ${preflight.errors.join(" | ")}`,
      data: { preflight },
    };
  }

  // ── C. Transaction atomique principale ────────────────────────────────────
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Anti-concurrence : updateMany conditionnel
      const updated = await tx.payrollBatch.updateMany({
        where: { id: batchId, status: "AUTHORIZED" },
        data: { status: "PAYMENT_PROCESSING", updatedAt: new Date() },
      });

      if (updated.count === 0) {
        throw new Error(
          "تعذّر تحديث الدفعة: إما أن الحالة تغيّرت (تعارض متزامن) أو الدفعة غير موجودة."
        );
      }

      // Recharger le batch depuis la DB pour les données réelles
      const batch = await tx.payrollBatch.findUnique({
        where: { id: batchId },
        include: {
          records: {
            include: {
              employee: {
                select: { id: true, matricule: true, firstName: true, lastName: true, rib: true },
              },
            },
          },
          period: { select: { label: true, year: true, month: true } },
        },
      });

      if (!batch) throw new Error("الدفعة غير موجودة بعد التحديث.");

      // Recalculer le total côté serveur (jamais depuis le client)
      let serverTotal = new Decimal(0);
      for (const rec of batch.records) {
        serverTotal = serverTotal.plus(rec.netAmount as Decimal);
      }

      const orderRef = generateOrderReference();

      // Créer le PaymentOrder
      const paymentOrder = await tx.paymentOrder.create({
        data: {
          reference:          orderRef,
          batchId:            batchId,
          status:             "PROCESSING",
          totalAmount:        serverTotal,
          employeeCount:      batch.records.length,
          currency:           "DZD",
          bankFormat:         "GENERIC_BANK_TRANSFER",
          confirmationMethod: "MANUAL_CONTROLLED",
          createdById:        user.id,
          processingStartedAt: new Date(),
        },
      });

      // Créer les PaymentTransactions (RIB lu depuis DB, jamais masqué ici, stocké masqué)
      // et SNAPSHOT IMMUTABLE scellé pour garantir l'intégrité financière
      const txData = batch.records.map((rec, idx) => {
        const emp = rec.employee;
        const ribRaw = emp.rib?.trim() ?? "";
        if (!ribRaw) throw new Error(`الموظف ${rec.snapshotMatricule} لا يملك RIB.`);
        return {
          paymentOrderId:    paymentOrder.id,
          employeeId:        emp.id,
          payrollRecordId:   rec.id,
          reference:         generateTransactionReference(orderRef, idx),
          amount:            rec.netAmount as Decimal,
          ribMasked:         maskRib(ribRaw), // uniquement masqué pour l'affichage/audit
          snapshotMatricule: emp.matricule,
          snapshotName:      `${emp.firstName} ${emp.lastName}`.trim(),
          ribSnapshot:       ribRaw, // scellé de manière immuable pour l'export bancaire
          currency:          "DZD",
          status:            "PENDING",
        };
      });

      await tx.paymentTransaction.createMany({ data: txData });

      // WorkflowAction
      const batchLabel = batch.label ?? batch.period?.label ?? batchId;
      await tx.workflowAction.create({
        data: {
          batchId,
          actorId:    user.id,
          action:     "START_PAYMENT_PROCESSING",
          fromStatus: "AUTHORIZED",
          toStatus:   "PAYMENT_PROCESSING",
          metadata:   JSON.stringify({
            paymentOrderRef: orderRef,
            totalAmount:     Number(serverTotal),
            employeeCount:   batch.records.length,
            actorRole:       user.roleCode,
          }),
        },
      });

      // AuditLog (sans RIB complet)
      await tx.auditLog.create({
        data: {
          userId:       user.id,
          action:       "PAYMENT_PROCESSING_STARTED",
          resourceType: "PAYMENT_ORDER",
          resourceId:   paymentOrder.id,
          details:      JSON.stringify({
            batchId,
            orderRef,
            totalAmount:   Number(serverTotal),
            employeeCount: batch.records.length,
            actorRole:     user.roleCode,
          }),
        },
      });

      // Notifications
      await createWorkflowNotifications({
        action:     "START_PAYMENT_PROCESSING",
        batchId,
        batchLabel,
        orgId:      batch.organizationId ?? user.organizationId,
        actorId:    user.id,
        tx,
      });

      return { paymentOrder, batch, batchLabel, serverTotal };
    });

    // ── D. Générer le fichier bancaire après la transaction (lecture seule) ──
    try {
      await generateAndPersistBankFile(result.paymentOrder.id, user.organizationId);
    } catch (fileErr) {
      console.warn("[PAYMENT_FILE_WARNING] Fichier non généré immédiatement:", fileErr);
      // La génération différée est acceptable — l'ordre est PROCESSING
    }

    // ── E. AuditLog création ordre (hors transaction) ──────────────────────
    await recordAuditLog({
      userId:       user.id,
      action:       "PAYMENT_ORDER_CREATED",
      resourceType: "PAYMENT_ORDER",
      resourceId:   result.paymentOrder.id,
      details: {
        batchId,
        orderRef:     result.paymentOrder.reference,
        totalAmount:  Number(result.serverTotal),
        employeeCount: result.batch.records.length,
      },
    }).catch(() => {});

    return {
      success: true,
      data: {
        paymentOrderId: result.paymentOrder.id,
        reference:      result.paymentOrder.reference,
        totalAmount:    Number(result.serverTotal),
        employeeCount:  result.batch.records.length,
        batchLabel:     result.batchLabel,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    console.error("[PAYMENT_SERVICE_ERROR]", message);
    return { success: false, error: message };
  }
}

// ── 2. CONFIRM_PAYMENT ────────────────────────────────────────────────────────

/**
 * PAYMENT_PROCESSING → PAID
 * Confirmation contrôlée — MANUAL_CONTROLLED (aucune banque réelle).
 */
export async function confirmPaymentService(
  batchId: string,
  confirmationRef: string,
  notes?: string,
  testUser?: UserSessionData | null
): Promise<PaymentServiceResult> {
  const user = await resolveCaller(testUser);
  if (!user) return { success: false, error: "يجب تسجيل الدخول." };
  if (!user.isActive) return { success: false, error: "الحساب غير نشط." };
  if (user.roleCode !== "COMPTABLE") {
    return { success: false, error: "هذه العملية محجوزة للمحاسب المالي فقط." };
  }
  if (!user.permissions.includes("payment.confirm")) {
    return { success: false, error: "ليس لديك صلاحية payment.confirm." };
  }
  if (!confirmationRef || confirmationRef.trim().length < 3) {
    return { success: false, error: "مرجع التأكيد مطلوب (3 أحرف كحد أدنى)." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Anti-concurrence
      const updated = await tx.payrollBatch.updateMany({
        where: { id: batchId, status: "PAYMENT_PROCESSING" },
        data: { status: "PAID", updatedAt: new Date() },
      });

      if (updated.count === 0) {
        throw new Error("تعذّر تأكيد الدفع: الدفعة ليست في حالة PAYMENT_PROCESSING (تعارض متزامن).");
      }

      // Récupérer PaymentOrder
      const order = await tx.paymentOrder.findUnique({
        where: { batchId },
        include: {
          batch: { include: { period: { select: { label: true } } } },
          transactions: true,
        },
      });

      if (!order) throw new Error("أمر الدفع غير موجود.");

      // Vérifications pré-confirmation
      if (order.status !== "PROCESSING") {
        throw new Error(`أمر الدفع في الوضعية: ${order.status} — لا يمكن التأكيد.`);
      }

      if (order.transactions.length === 0) {
        throw new Error("أمر الدفع لا يحتوي على أي حركات دفع.");
      }

      // Vérifier qu'aucune transaction n'est en statut FAILED
      const hasFailedTx = order.transactions.some(t => t.status === "FAILED");
      if (hasFailedTx) {
        throw new Error("لا يمكن تأكيد الدفع: توجد حركات دفع فاشلة (FAILED). يجب حل الإشكالات قبل التأكيد.");
      }

      // Vérification de l'organisation
      if (order.batch.organizationId && order.batch.organizationId !== user.organizationId) {
        throw new Error("ليس لديك صلاحية تأكيد هذا الدفع.");
      }

      // Vérifier la cohérence du total (recalcul serveur avec Decimal)
      let serverTotal = new Decimal(0);
      for (const ptx of order.transactions) {
        serverTotal = serverTotal.plus(ptx.amount as Decimal);
      }

      const orderTotalDecimal = new Decimal(order.totalAmount);
      if (!serverTotal.equals(orderTotalDecimal)) {
        throw new Error(
          `تعارض في المبالغ: المجموع المحسوب ${serverTotal.toFixed(2)} يختلف عن المسجل ${orderTotalDecimal.toFixed(2)}.`
        );
      }

      // Mettre à jour PaymentOrder → PAID
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          status:          "PAID",
          confirmedById:   user.id,
          confirmationRef: confirmationRef.trim(),
          paidAt:          new Date(),
          updatedAt:       new Date(),
          ...(notes ? { reconciliationNotes: notes } : {}),
        },
      });

      // Mettre à jour toutes les transactions PENDING → PAID
      await tx.paymentTransaction.updateMany({
        where: { paymentOrderId: order.id, status: "PENDING" },
        data: { status: "PAID", confirmedAt: new Date(), updatedAt: new Date() },
      });

      const batchLabel = order.batch.label ?? order.batch.period?.label ?? batchId;

      // WorkflowAction
      await tx.workflowAction.create({
        data: {
          batchId,
          actorId:    user.id,
          action:     "CONFIRM_PAYMENT",
          fromStatus: "PAYMENT_PROCESSING",
          toStatus:   "PAID",
          metadata:   JSON.stringify({
            paymentOrderRef:    order.reference,
            confirmationRef:    confirmationRef.trim(),
            confirmationMethod: "MANUAL_CONTROLLED",
            actorRole:          user.roleCode,
          }),
        },
      });

      // AuditLog
      await tx.auditLog.create({
        data: {
          userId:       user.id,
          action:       "PAYMENT_CONFIRMED",
          resourceType: "PAYMENT_ORDER",
          resourceId:   order.id,
          details:      JSON.stringify({
            batchId,
            orderRef:        order.reference,
            confirmationRef: confirmationRef.trim(),
            confirmationMethod: "MANUAL_CONTROLLED",
            totalAmount:     Number(serverTotal),
          }),
        },
      });

      // Notifications
      await createWorkflowNotifications({
        action:     "CONFIRM_PAYMENT",
        batchId,
        batchLabel,
        orgId:      order.batch.organizationId ?? user.organizationId,
        actorId:    user.id,
        tx,
      });

      return { orderId: order.id, orderRef: order.reference, batchLabel };
    });

    // AuditLog PAYMENT_MARKED_PAID (hors transaction)
    await recordAuditLog({
      userId:       user.id,
      action:       "PAYMENT_MARKED_PAID",
      resourceType: "PAYROLL_BATCH",
      resourceId:   batchId,
      details: { confirmationRef: confirmationRef.trim() },
    }).catch(() => {});

    return {
      success: true,
      data: {
        paymentOrderId: result.orderId,
        reference:      result.orderRef,
        batchLabel:     result.batchLabel,
        confirmationRef,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return { success: false, error: message };
  }
}

// ── 3. FAIL_PAYMENT & RETRY ──────────────────────────────────────────────────

/**
 * Marque un PaymentOrder comme FAILED en cas de rejet bancaire ou d'anomalie critique.
 * PROCESSING → FAILED
 */
export async function markPaymentOrderFailedService(
  batchId: string,
  failureReason: string,
  testUser?: UserSessionData | null
): Promise<PaymentServiceResult> {
  const user = await resolveCaller(testUser);
  if (!user) return { success: false, error: "يجب تسجيل الدخول." };
  if (!user.isActive) return { success: false, error: "الحساب غير نشط." };
  if (user.roleCode !== "COMPTABLE") {
    return { success: false, error: "هذه العملية محجوزة للمحاسب المالي فقط." };
  }
  if (!user.permissions.includes("payment.process")) {
    return { success: false, error: "ليس لديك صلاحية payment.process." };
  }
  const cleanReason = failureReason?.trim();
  if (!cleanReason || cleanReason.length < 3) {
    return { success: false, error: "سبب الفشل مطلوب (3 أحرف على الأقل)." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier que le batch est bien en cours
      const batch = await tx.payrollBatch.findUnique({
        where: { id: batchId },
        select: { id: true, status: true, organizationId: true, label: true },
      });
      if (!batch) throw new Error("الدفعة غير موجودة.");
      if (batch.status !== "PAYMENT_PROCESSING") {
        throw new Error(`الدفعة في الوضعية: ${batch.status} — لا يمكن تسجيل الفشل إلا أثناء المعالجة.`);
      }
      if (batch.organizationId && batch.organizationId !== user.organizationId) {
        throw new Error("ليس لديك صلاحية على هذه الدفعة.");
      }

      // Verrouillage anti-concurrence sur PaymentOrder PROCESSING
      const updatedOrder = await tx.paymentOrder.updateMany({
        where: { batchId, status: "PROCESSING" },
        data: {
          status:        "FAILED",
          failureReason: cleanReason,
          updatedAt:     new Date(),
        },
      });

      if (updatedOrder.count === 0) {
        throw new Error("تعذّر تسجيل الفشل: أمر الدفع ليس في حالة PROCESSING (تعارض متزامن).");
      }

      const order = await tx.paymentOrder.findUniqueOrThrow({
        where: { batchId },
      });

      // Mettre à jour les transactions PENDING vers FAILED
      await tx.paymentTransaction.updateMany({
        where: { paymentOrderId: order.id, status: "PENDING" },
        data: {
          status:        "FAILED",
          failureReason: cleanReason,
          updatedAt:     new Date(),
        },
      });

      // AuditLog
      await tx.auditLog.create({
        data: {
          userId:       user.id,
          action:       "PAYMENT_FAILED",
          resourceType: "PAYMENT_ORDER",
          resourceId:   order.id,
          details:      JSON.stringify({
            batchId,
            orderRef:      order.reference,
            failureReason: cleanReason,
            actorRole:     user.roleCode,
          }),
        },
      });

      return { order, batch };
    });

    return {
      success: true,
      data: {
        paymentOrderId: result.order.id,
        reference:      result.order.reference,
        status:         "FAILED",
        failureReason:  cleanReason,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return { success: false, error: message };
  }
}

/**
 * Réessaye l'exécution d'un ordre de paiement FAILED.
 * FAILED → PROCESSING (recyclage in-place du même PaymentOrder : zéro doublon, anti-concurrence stricte).
 */
export async function retryPaymentProcessingService(
  batchId: string,
  testUser?: UserSessionData | null
): Promise<PaymentServiceResult> {
  const user = await resolveCaller(testUser);
  if (!user) return { success: false, error: "يجب تسجيل الدخول." };
  if (!user.isActive) return { success: false, error: "الحساب غير نشط." };
  if (user.roleCode !== "COMPTABLE") {
    return { success: false, error: "هذه العملية محجوزة للمحاسب المالي فقط." };
  }
  if (!user.permissions.includes("payment.process")) {
    return { success: false, error: "ليس لديك صلاحية payment.process." };
  }

  // Pre-flight autorisant un ordre FAILED
  const preflight = await validatePaymentPreflight(batchId, user.organizationId, {
    allowFailedRetry: true,
  });
  if (!preflight.valid) {
    return {
      success: false,
      error: `فشل التحقق المسبق لإعادة المحاولة: ${preflight.errors.join(" | ")}`,
      data: { preflight },
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Anti-concurrence stricte : seul un PaymentOrder FAILED peut être retenté
      const updatedOrder = await tx.paymentOrder.updateMany({
        where: { batchId, status: "FAILED" },
        data: {
          status:              "PROCESSING",
          failureReason:       null,
          processingStartedAt: new Date(),
          updatedAt:           new Date(),
        },
      });

      if (updatedOrder.count === 0) {
        throw new Error(
          "تعذّر إعادة المحاولة: أمر الدفع ليس في حالة FAILED (تعارض متزامن أو حالة غير مؤهلة)."
        );
      }

      const order = await tx.paymentOrder.findUniqueOrThrow({
        where: { batchId },
        include: {
          batch: {
            include: {
              records: {
                include: {
                  employee: {
                    select: { id: true, matricule: true, firstName: true, lastName: true, rib: true },
                  },
                },
              },
            },
          },
        },
      });

      // Recalculer le total avec Decimal
      let serverTotal = new Decimal(0);
      for (const rec of order.batch.records) {
        serverTotal = serverTotal.plus(rec.netAmount as Decimal);
      }

      // Mettre à jour les métadonnées de l'ordre
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          totalAmount:   serverTotal,
          employeeCount: order.batch.records.length,
          updatedAt:     new Date(),
        },
      });

      // Réinitialiser les transactions existantes FAILED ➔ PENDING avec snapshots actualisés
      for (const rec of order.batch.records) {
        const emp = rec.employee;
        const ribRaw = emp.rib?.trim() ?? "";
        await tx.paymentTransaction.updateMany({
          where: { paymentOrderId: order.id, payrollRecordId: rec.id },
          data: {
            status:            "PENDING",
            failureReason:     null,
            amount:            rec.netAmount as Decimal,
            ribMasked:         maskRib(ribRaw),
            snapshotMatricule: emp.matricule,
            snapshotName:      `${emp.firstName} ${emp.lastName}`.trim(),
            ribSnapshot:       ribRaw,
            updatedAt:         new Date(),
          },
        });
      }

      // AuditLog
      await tx.auditLog.create({
        data: {
          userId:       user.id,
          action:       "PAYMENT_PROCESSING_RETRIED",
          resourceType: "PAYMENT_ORDER",
          resourceId:   order.id,
          details:      JSON.stringify({
            batchId,
            orderRef:      order.reference,
            totalAmount:   Number(serverTotal),
            employeeCount: order.batch.records.length,
            actorRole:     user.roleCode,
          }),
        },
      });

      return { order, serverTotal, recordCount: order.batch.records.length };
    });

    // Régénérer et persister le fichier technique
    try {
      await generateAndPersistBankFile(result.order.id, user.organizationId);
    } catch (fErr) {
      console.warn("[PAYMENT_RETRY_FILE_WARNING]", fErr);
    }

    return {
      success: true,
      data: {
        paymentOrderId: result.order.id,
        reference:      result.order.reference,
        status:         "PROCESSING",
        totalAmount:    Number(result.serverTotal),
        employeeCount:  result.recordCount,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return { success: false, error: message };
  }
}

// ── 4. CLOSE_BATCH ────────────────────────────────────────────────────────────

/**
 * PAID ou RECONCILED → CLOSED
 * Clôture définitive — immuable après cette transition.
 */
export async function closeBatchService(
  batchId: string,
  notes?: string,
  testUser?: UserSessionData | null
): Promise<PaymentServiceResult> {
  const user = await resolveCaller(testUser);
  if (!user) return { success: false, error: "يجب تسجيل الدخول." };
  if (!user.isActive) return { success: false, error: "الحساب غير نشط." };
  if (!["COMPTABLE", "DIRECTEUR"].includes(user.roleCode)) {
    return { success: false, error: "هذه العملية محجوزة للمحاسب أو المدير." };
  }
  if (!user.permissions.includes("payment.close")) {
    return { success: false, error: "ليس لديك صلاحية payment.close." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Anti-concurrence
      const updated = await tx.payrollBatch.updateMany({
        where: { id: batchId, status: "PAID" },
        data: { status: "CLOSED", updatedAt: new Date() },
      });

      if (updated.count === 0) {
        throw new Error("تعذّر إقفال الدفعة: الدفعة ليست في حالة PAID (تعارض متزامن).");
      }

      const order = await tx.paymentOrder.findUnique({
        where: { batchId },
        include: {
          batch: { include: { period: { select: { label: true } } } },
          transactions: true,
        },
      });

      if (!order) throw new Error("أمر الدفع غير موجود.");

      // La machine d'état autorise l'échelonnage depuis PAID ou RECONCILED
      if (!["PAID", "RECONCILED"].includes(order.status)) {
        throw new Error(`أمر الدفع في الوضعية: ${order.status} — لا يمكن الإقفال إلا بعد الدفع أو المطابقة.`);
      }

      if (order.batch.organizationId && order.batch.organizationId !== user.organizationId) {
        throw new Error("ليس لديك صلاحية إقفال هذه الدفعة.");
      }

      // Vérifier que toutes les transactions sont résolues (aucune PENDING)
      const pendingCount = order.transactions.filter(t => t.status === "PENDING").length;
      if (pendingCount > 0) {
        throw new Error(`لا يمكن الإقفال: ${pendingCount} حركة دفع لا تزال في حالة PENDING.`);
      }

      // Vérifier qu'aucune transaction n'est en échec non résolu
      const failedCount = order.transactions.filter(t => t.status === "FAILED").length;
      if (failedCount > 0) {
        throw new Error(`لا يمكن الإقفال: ${failedCount} حركة دفع في حالة فشل (FAILED) غير محسومة.`);
      }

      // Mettre à jour PaymentOrder → CLOSED
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          status:    "CLOSED",
          closedAt:  new Date(),
          updatedAt: new Date(),
          ...(notes ? { reconciliationNotes: notes } : {}),
        },
      });

      const batchLabel = order.batch.label ?? order.batch.period?.label ?? batchId;

      // WorkflowAction
      await tx.workflowAction.create({
        data: {
          batchId,
          actorId:    user.id,
          action:     "CLOSE_BATCH",
          fromStatus: "PAID",
          toStatus:   "CLOSED",
          metadata:   JSON.stringify({
            paymentOrderRef: order.reference,
            actorRole:       user.roleCode,
          }),
        },
      });

      // AuditLog
      await tx.auditLog.create({
        data: {
          userId:       user.id,
          action:       "PAYMENT_BATCH_CLOSED",
          resourceType: "PAYROLL_BATCH",
          resourceId:   batchId,
          details:      JSON.stringify({
            batchId,
            orderRef:    order.reference,
            closedAt:    new Date().toISOString(),
            actorRole:   user.roleCode,
          }),
        },
      });

      // Notifications
      await createWorkflowNotifications({
        action:     "CLOSE_BATCH",
        batchId,
        batchLabel,
        orgId:      order.batch.organizationId ?? user.organizationId,
        actorId:    user.id,
        tx,
      });

      return { orderId: order.id, orderRef: order.reference, batchLabel };
    });

    return {
      success: true,
      data: {
        paymentOrderId: result.orderId,
        reference:      result.orderRef,
        batchLabel:     result.batchLabel,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return { success: false, error: message };
  }
}

// ── 4. Vérification immutabilité CLOSED ───────────────────────────────────────

/**
 * Vérifie que le batch est CLOSED et bloque toute mutation.
 * À appeler dans toutes les Server Actions qui modifient des PayrollRecords/LineItems.
 */
export async function assertBatchNotClosed(batchId: string): Promise<void> {
  const batch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    select: { status: true },
  });
  if (batch?.status === "CLOSED") {
    throw new Error(
      "الدفعة مُقفلة ولا يمكن تعديلها. أي تصحيح يستوجب إنشاء نسخة جديدة."
    );
  }
  if (batch?.status === "PAID") {
    throw new Error(
      "الدفعة في حالة PAID ولا يمكن تعديل بياناتها. انتظر الإقفال أو أنشئ نسخة جديدة."
    );
  }
}
