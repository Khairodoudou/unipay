"use server";

/**
 * lib/workflow/workflow-actions.ts
 * Server Actions exposées aux pages — toutes passent par le Workflow Engine.
 * Ne jamais coder de logique de transition directement ici.
 */

import { executeTransition, WorkflowResult } from "./workflow-engine";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { revalidatePath } from "next/cache";
import { markNotificationReadSchema } from "./schemas";

// ── Agent RH ──────────────────────────────────────────────────────────────────

/** Agent soumet le batch au Chef */
export async function submitBatchToChefAction(batchId: string): Promise<WorkflowResult> {
  return executeTransition({ batchId, action: "SUBMIT_TO_CHEF" });
}

// ── Chef de Service ───────────────────────────────────────────────────────────

/** Chef approuve le batch */
export async function approveByChefAction(
  batchId: string,
  notes?: string
): Promise<WorkflowResult> {
  return executeTransition({ batchId, action: "APPROVE_CHEF", reason: notes });
}

/** Chef retourne le batch pour correction */
export async function returnByChefAction(
  batchId: string,
  reason: string
): Promise<WorkflowResult> {
  return executeTransition({ batchId, action: "RETURN_BY_CHEF", reason });
}

// ── Directeur ─────────────────────────────────────────────────────────────────

/** Directeur prend le batch en revue */
export async function takeDirectorReviewAction(batchId: string): Promise<WorkflowResult> {
  return executeTransition({ batchId, action: "TAKE_DIRECTOR_REVIEW" });
}

/** Directeur approuve */
export async function approveByDirectorAction(
  batchId: string,
  notes?: string
): Promise<WorkflowResult> {
  const currentBatch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    select: { status: true },
  });
  if (currentBatch?.status === "APPROVED_BY_CHEF") {
    const takeRes = await takeDirectorReviewAction(batchId);
    if (!takeRes.success) return takeRes;
  }
  return executeTransition({ batchId, action: "APPROVE_DIRECTOR", reason: notes });
}

/** Directeur retourne pour correction */
export async function returnByDirectorAction(
  batchId: string,
  reason: string
): Promise<WorkflowResult> {
  const currentBatch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    select: { status: true },
  });
  if (currentBatch?.status === "APPROVED_BY_CHEF") {
    const takeRes = await takeDirectorReviewAction(batchId);
    if (!takeRes.success) return takeRes;
  }
  return executeTransition({ batchId, action: "RETURN_BY_DIRECTOR", reason });
}

// ── Comptable ─────────────────────────────────────────────────────────────────

/** Comptable prend le batch en revue */
export async function takeAccountingReviewAction(batchId: string): Promise<WorkflowResult> {
  return executeTransition({ batchId, action: "TAKE_ACCOUNTING_REVIEW" });
}

/** Comptable valide */
export async function validateAccountingAction(
  batchId: string,
  notes?: string
): Promise<WorkflowResult> {
  const currentBatch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    select: { status: true },
  });
  if (currentBatch?.status === "APPROVED_BY_DIRECTOR") {
    const takeRes = await takeAccountingReviewAction(batchId);
    if (!takeRes.success) return takeRes;
  }
  return executeTransition({ batchId, action: "VALIDATE_ACCOUNTING", reason: notes });
}

/** Comptable retourne pour correction */
export async function returnByAccountingAction(
  batchId: string,
  reason: string
): Promise<WorkflowResult> {
  const currentBatch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    select: { status: true },
  });
  if (currentBatch?.status === "APPROVED_BY_DIRECTOR") {
    const takeRes = await takeAccountingReviewAction(batchId);
    if (!takeRes.success) return takeRes;
  }
  return executeTransition({ batchId, action: "RETURN_BY_ACCOUNTING", reason });
}

// ── Contrôleur Financier ──────────────────────────────────────────────────────

/** Contrôleur prend le batch en revue */
export async function takeFinancialControlAction(batchId: string): Promise<WorkflowResult> {
  return executeTransition({ batchId, action: "TAKE_FINANCIAL_CONTROL" });
}

/** Contrôleur accorde le visa financier → AUTHORIZED */
export async function grantFinancialVisaAction(
  batchId: string,
  notes?: string
): Promise<WorkflowResult> {
  const currentBatch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    select: { status: true },
  });
  if (currentBatch?.status === "ACCOUNTING_VALIDATED") {
    const takeRes = await takeFinancialControlAction(batchId);
    if (!takeRes.success) return takeRes;
  }
  return executeTransition({ batchId, action: "GRANT_FINANCIAL_VISA", reason: notes });
}

/** Contrôleur retourne pour correction */
export async function returnByFinancialAction(
  batchId: string,
  reason: string
): Promise<WorkflowResult> {
  const currentBatch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    select: { status: true },
  });
  if (currentBatch?.status === "ACCOUNTING_VALIDATED") {
    const takeRes = await takeFinancialControlAction(batchId);
    if (!takeRes.success) return takeRes;
  }
  return executeTransition({ batchId, action: "RETURN_BY_FINANCIAL", reason });
}

// ── Notifications ─────────────────────────────────────────────────────────────

/** Marquer une notification comme lue */
export async function markNotificationReadAction(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "غير مصرح." };

  const parsed = markNotificationReadSchema.safeParse({ notificationId });
  if (!parsed.success) return { success: false, error: "معرّف الإشعار غير صالح." };

  try {
    // Vérifier que la notification appartient bien à l'utilisateur
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notif || notif.userId !== user.id) {
      return { success: false, error: "الإشعار غير موجود أو لا ينتمي إليك." };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "فشل تحديث الإشعار." };
  }
}

/** Marquer toutes les notifications de l'utilisateur comme lues */
export async function markAllNotificationsReadAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "غير مصرح." };

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "فشل تحديث الإشعارات." };
  }
}

/** Récupérer les notifications non lues de l'utilisateur */
export async function getUnreadNotificationsAction(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    type: string;
    titleAr: string;
    messageAr: string;
    link: string | null;
    createdAt: Date;
  }>;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "غير مصرح." };

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        titleAr: true,
        messageAr: true,
        link: true,
        createdAt: true,
      },
    });
    return { success: true, data: notifications };
  } catch {
    return { success: false, error: "فشل تحميل الإشعارات." };
  }
}

// ── Versioning & Correction ───────────────────────────────────────────────────

/**
 * Crée une nouvelle version (ex: v2) d'un batch retourné pour correction (RETURNED_FOR_CORRECTION).
 * RÈGLE D'OR : La version précédente (v1) reste intacte et gelée dans l'historique.
 * La nouvelle version repart au statut DRAFT et doit être recalculée puis auditée.
 */
export async function createBatchCorrectionVersionAction(
  batchId: string
): Promise<{ success: boolean; data?: { newBatchId: string; versionNumber: number }; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول للقيام بهذه العملية." };
  if (!user.isActive) return { success: false, error: "الحساب غير نشط." };

  // Seul l'Agent RH a le droit de préparer et corriger les lots de paie
  if (user.roleCode !== "AGENT_RH") {
    return { success: false, error: "فقط عون الموارد البشرية (AGENT_RH) مخول بإنشاء نسخة مصححة." };
  }

  const batch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    include: {
      period: true,
      employees: true,
      attendanceRecords: true,
      lineItems: true,
    },
  });

  if (!batch) return { success: false, error: "الدفعة غير موجودة." };

  // Vérification de la portée organisationnelle
  if (batch.organizationId && batch.organizationId !== user.organizationId) {
    return { success: false, error: "ليس لديك صلاحية الوصول إلى هذه الدفعة (نطاق مختلف)." };
  }

  // Vérification stricte du statut : seul un batch RETURNED_FOR_CORRECTION peut être versionné pour correction
  if (batch.status !== "RETURNED_FOR_CORRECTION") {
    return {
      success: false,
      error: `لا يمكن إنشاء نسخة للتصحيح إلا لدفعة في حالة "معاد للتصحيح". الحالة الحالية: ${batch.status}`,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Trouver la version maximale actuelle pour cette période
      const highestVersionBatch = await tx.payrollBatch.findFirst({
        where: { periodId: batch.periodId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      const nextVersion = Math.max(batch.versionNumber, highestVersionBatch?.versionNumber ?? 0) + 1;
      const cleanLabel = (batch.label || `دفعة ${batch.period.label}`).replace(/\s*\(v\d+\)$/i, "");
      const newLabel = `${cleanLabel} (v${nextVersion})`;

      // 1. Création du nouveau PayrollBatch à l'état DRAFT
      const newBatch = await tx.payrollBatch.create({
        data: {
          periodId:       batch.periodId,
          versionNumber:  nextVersion,
          label:          newLabel,
          notes:          `نسخة مصححة ناتجة عن إعادة الدفعة v${batch.versionNumber} للتصحيح.`,
          status:         "DRAFT",
          organizationId: batch.organizationId,
          createdBy:      user.id,
        },
      });

      // 2. Cloner les associations d'employés
      if (batch.employees.length > 0) {
        await tx.batchEmployee.createMany({
          data: batch.employees.map((be) => ({
            batchId:    newBatch.id,
            employeeId: be.employeeId,
            addedBy:    user.id,
          })),
        });
      }

      // 3. Cloner les feuilles de présence
      if (batch.attendanceRecords.length > 0) {
        await tx.attendanceRecord.createMany({
          data: batch.attendanceRecords.map((ar) => ({
            batchId:             newBatch.id,
            employeeId:          ar.employeeId,
            workingDays:         ar.workingDays,
            presentDays:         ar.presentDays,
            absentDays:          ar.absentDays,
            sickDays:            ar.sickDays,
            vacationDays:        ar.vacationDays,
            lateMinutes:         ar.lateMinutes,
            notes:               ar.notes,
            createdBy:           user.id,
          })),
        });
      }

      // 4. Cloner les primes et retenues
      if (batch.lineItems.length > 0) {
        await tx.payrollLineItem.createMany({
          data: batch.lineItems.map((li) => ({
            batchId:    newBatch.id,
            employeeId: li.employeeId,
            type:       li.type,
            code:       li.code,
            labelAr:    li.labelAr,
            amount:     li.amount,
            isManual:   li.isManual,
            sourceRule: li.sourceRule,
            notes:      li.notes,
            createdBy:  user.id,
          })),
        });
      }

      // 5. Enregistrer l'action Workflow sur le nouveau lot
      await tx.workflowAction.create({
        data: {
          batchId:    newBatch.id,
          actorId:    user.id,
          action:     "CREATE_CORRECTION_VERSION",
          fromStatus: "RETURNED_FOR_CORRECTION",
          toStatus:   "DRAFT",
          reason:     `إنشاء النسخة v${nextVersion} لتصحيح الدفعة السابقة v${batch.versionNumber}.`,
          metadata:   JSON.stringify({
            previousBatchId: batch.id,
            previousVersion: batch.versionNumber,
            newVersion:      nextVersion,
          }),
        },
      });

      // 6. Enregistrer dans l'AuditLog
      await tx.auditLog.create({
        data: {
          userId:       user.id,
          action:       "PAYROLL_CORRECTED",
          resourceType: "PAYROLL_BATCH",
          resourceId:   newBatch.id,
          details:      JSON.stringify({
            previousBatchId: batch.id,
            previousVersion: batch.versionNumber,
            newVersion:      nextVersion,
          }),
        },
      });

      return { newBatchId: newBatch.id, versionNumber: nextVersion };
    });

    revalidatePath(`/agent/payroll-periods/${batch.periodId}`);
    revalidatePath(`/agent/batches/${batch.id}`);
    revalidatePath(`/agent/batches/${result.newBatchId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error("[CREATE_CORRECTION_VERSION_ERROR]", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع أثناء إنشاء النسخة الجديدة." };
  }
}

