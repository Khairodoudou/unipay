"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";
import {
  batchAuditRunSchema,
  reviewFindingSchema,
  confirmFindingSchema,
  falsePositiveSchema,
  resolveFindingSchema,
  aiAnalysisRequestSchema,
} from "./schemas";
import { executeAuditRules } from "./smart-audit-engine";
import { analyzeFindingWithAI, AISmartAuditResult } from "@/lib/ai/smart-audit";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Garde RBAC spécifique : Seuls AGENT_RH et ADMIN sont habilités au Smart Audit
 */
async function verifyAgentCaller() {
  const caller = await getCurrentUser();
  if (!caller || !caller.isActive) {
    throw new Error("غير مصرح: يجب تسجيل الدخول بحساب نشط.");
  }
  if (!["ADMIN", "AGENT_RH"].includes(caller.roleCode)) {
    throw new Error("غير مصرح: هذه العملية مخصصة حصراً لعون الموارد البشرية ومدير النظام.");
  }
  return caller;
}

/**
 * Lance le moteur de règles Smart Audit sur un Payroll Batch
 */
export async function runBatchSmartAuditAction(
  batchId: string
): Promise<ActionResult<{ totalGenerated: number; critical: number; warning: number }>> {
  try {
    const caller = await verifyAgentCaller();

    const parsed = batchAuditRunSchema.safeParse({ batchId });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات غير صالحة" };
    }

    const batch = await prisma.payrollBatch.findUnique({
      where: { id: batchId },
      include: { period: true },
    });
    if (!batch) {
      return { success: false, error: "دفعة الأجر غير موجودة." };
    }

    // Tracer le démarrage de l'audit
    await recordAuditLog({
      userId: caller.id,
      action: "AUDIT_STARTED",
      resourceType: "PAYROLL_BATCH",
      resourceId: batchId,
      details: {
        batchVersion: batch.versionNumber,
        periodLabel: batch.period.label,
      },
    });

    const result = await executeAuditRules(batchId);

    // Tracer la création des anomalies
    await recordAuditLog({
      userId: caller.id,
      action: "FINDING_CREATED",
      resourceType: "PAYROLL_BATCH",
      resourceId: batchId,
      details: {
        totalGenerated: result.totalGenerated,
        critical: result.criticalCount,
        high: result.highCount,
        warning: result.warningCount,
      },
    });

    revalidatePath(`/agent/batches/${batchId}`);
    revalidatePath(`/agent/batches/${batchId}/audit`);

    return {
      success: true,
      data: {
        totalGenerated: result.totalGenerated,
        critical: result.criticalCount,
        warning: result.warningCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء تشغيل التدقيق الذكي",
    };
  }
}

/**
 * Examiner une anomalie (Statut: REVIEWED)
 */
export async function reviewFindingAction(
  input: FormData | { findingId: string; note?: string }
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const raw =
      input instanceof FormData
        ? {
            findingId: input.get("findingId"),
            note: input.get("note") || undefined,
          }
        : input;

    const parsed = reviewFindingSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات غير صالحة" };
    }

    const { findingId, note } = parsed.data;

    const finding = await prisma.auditFinding.findUnique({
      where: { id: findingId },
    });
    if (!finding) return { success: false, error: "الملاحظة غير موجودة." };

    await prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        status: "REVIEWED",
        resolutionNote: note || finding.resolutionNote,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "FINDING_REVIEWED",
      resourceType: "AUDIT_FINDING",
      resourceId: findingId,
      details: {
        batchId: finding.batchId,
        note: note || "تمت المعاينة بدون ملاحظات إضافية",
      },
    });

    revalidatePath(`/agent/batches/${finding.batchId}/audit`);
    revalidatePath(`/agent/batches/${finding.batchId}/audit/${findingId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء فحص الملاحظة",
    };
  }
}

/**
 * Confirmer une anomalie comme réelle (Statut: CONFIRMED)
 */
export async function confirmFindingAction(
  input: FormData | { findingId: string; note?: string }
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const raw =
      input instanceof FormData
        ? {
            findingId: input.get("findingId"),
            note: input.get("note") || undefined,
          }
        : input;

    const parsed = confirmFindingSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات غير صالحة" };
    }

    const { findingId, note } = parsed.data;

    const finding = await prisma.auditFinding.findUnique({
      where: { id: findingId },
    });
    if (!finding) return { success: false, error: "الملاحظة غير موجودة." };

    await prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        status: "CONFIRMED",
        resolutionNote: note || finding.resolutionNote,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "FINDING_CONFIRMED",
      resourceType: "AUDIT_FINDING",
      resourceId: findingId,
      details: {
        batchId: finding.batchId,
        note: note || "تم تأكيد وجود الخلل",
      },
    });

    revalidatePath(`/agent/batches/${finding.batchId}/audit`);
    revalidatePath(`/agent/batches/${finding.batchId}/audit/${findingId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تأكيد الملاحظة",
    };
  }
}

/**
 * Classer une anomalie comme faux positif avec justification obligatoire (Statut: FALSE_POSITIVE)
 */
export async function markFalsePositiveAction(
  input: FormData | { findingId: string; note: string }
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const raw =
      input instanceof FormData
        ? {
            findingId: input.get("findingId"),
            note: input.get("note"),
          }
        : input;

    const parsed = falsePositiveSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات غير صالحة" };
    }

    const { findingId, note } = parsed.data;

    const finding = await prisma.auditFinding.findUnique({
      where: { id: findingId },
    });
    if (!finding) return { success: false, error: "الملاحظة غير موجودة." };

    await prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        status: "FALSE_POSITIVE",
        resolvedAt: new Date(),
        resolvedBy: caller.id,
        resolutionNote: note,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "FINDING_FALSE_POSITIVE",
      resourceType: "AUDIT_FINDING",
      resourceId: findingId,
      details: {
        batchId: finding.batchId,
        justification: note,
      },
    });

    revalidatePath(`/agent/batches/${finding.batchId}/audit`);
    revalidatePath(`/agent/batches/${finding.batchId}/audit/${findingId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الإنذار كخاطئ",
    };
  }
}

/**
 * Marquer une anomalie comme résolue après correction (Statut: RESOLVED)
 */
export async function resolveFindingAction(
  input: FormData | { findingId: string; resolutionNote: string }
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const raw =
      input instanceof FormData
        ? {
            findingId: input.get("findingId"),
            resolutionNote: input.get("resolutionNote"),
          }
        : input;

    const parsed = resolveFindingSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات غير صالحة" };
    }

    const { findingId, resolutionNote } = parsed.data;

    const finding = await prisma.auditFinding.findUnique({
      where: { id: findingId },
    });
    if (!finding) return { success: false, error: "الملاحظة غير موجودة." };

    await prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: caller.id,
        resolutionNote,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "FINDING_RESOLVED",
      resourceType: "AUDIT_FINDING",
      resourceId: findingId,
      details: {
        batchId: finding.batchId,
        resolutionNote,
      },
    });

    revalidatePath(`/agent/batches/${finding.batchId}/audit`);
    revalidatePath(`/agent/batches/${finding.batchId}/audit/${findingId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل تسوية الملاحظة",
    };
  }
}

/**
 * Server Action déclenché par le bouton "Analyser avec l'IA"
 */
export async function analyzeFindingWithAIAction(
  findingId: string
): Promise<AISmartAuditResult> {
  try {
    const caller = await verifyAgentCaller();

    const parsed = aiAnalysisRequestSchema.safeParse({ findingId });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "معرف غير صالح" };
    }

    const result = await analyzeFindingWithAI(findingId, caller.id);

    if (result.success) {
      const finding = await prisma.auditFinding.findUnique({
        where: { id: findingId },
        select: { batchId: true },
      });
      if (finding) {
        revalidatePath(`/agent/batches/${finding.batchId}/audit/${findingId}`);
      }
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء معالجة الذكاء الاصطناعي",
    };
  }
}
