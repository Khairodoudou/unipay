"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";
import { createPayrollRuleSchema, createRuleVersionSchema } from "./schemas";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

async function verifyAdminCaller() {
  const caller = await getCurrentUser();
  if (!caller || !caller.isActive || caller.roleCode !== "ADMIN") {
    throw new Error("غير مصرح لك بتنفيذ هذه العملية الإدارية.");
  }
  return caller;
}

/**
 * Server Action : Création d'une nouvelle règle de paie configurable
 * Infrastructure uniquement — aucune valeur fiscale/sociale déclarée légalement conforme
 */
export async function createPayrollRuleAction(
  formData: FormData
): Promise<ActionResult<{ ruleId: string }>> {
  try {
    const caller = await verifyAdminCaller();

    const rawData = {
      code: formData.get("code")?.toString()?.trim()?.toUpperCase() || "",
      nameAr: formData.get("nameAr")?.toString()?.trim() || "",
      category: formData.get("category")?.toString()?.trim() || "",
      descriptionAr: formData.get("descriptionAr")?.toString()?.trim() || undefined,
      initialValue: formData.get("initialValue")?.toString()?.trim() || "",
      unit: formData.get("unit")?.toString()?.trim() || "",
      effectiveFrom: formData.get("effectiveFrom")?.toString()?.trim() || "",
      notes: formData.get("notes")?.toString()?.trim() || undefined,
    };

    const parsed = createPayrollRuleSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "بيانات الإدخال غير صالحة.";
      return { success: false, error: firstError };
    }

    const { code, nameAr, category, descriptionAr, initialValue, unit, effectiveFrom, notes } =
      parsed.data;

    // Vérification de l'unicité du code
    const existing = await prisma.payrollRule.findUnique({
      where: { code },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: `رمز القاعدة "${code}" مستخدم بالفعل. اختر رمزاً فريداً.` };
    }

    // Créer la règle avec sa première version (transaction atomique)
    const rule = await prisma.$transaction(async (tx) => {
      const newRule = await tx.payrollRule.create({
        data: {
          code,
          nameAr,
          category,
          descriptionAr: descriptionAr || null,
          isActive: true,
        },
      });

      await tx.payrollRuleVersion.create({
        data: {
          ruleId: newRule.id,
          versionNumber: 1,
          value: initialValue,
          unit,
          effectiveFrom: new Date(effectiveFrom),
          effectiveTo: null,
          notes: notes || null,
          createdBy: caller.id,
        },
      });

      return newRule;
    });

    await recordAuditLog({
      userId: caller.id,
      action: "PAYROLL_RULE_CREATED",
      resourceType: "PAYROLL_RULE",
      resourceId: rule.id,
      details: {
        code: rule.code,
        nameAr: rule.nameAr,
        category: rule.category,
        initialValue,
        unit,
        effectiveFrom,
      },
    });

    revalidatePath("/admin/payroll-rules");
    revalidatePath("/admin/dashboard");

    return { success: true, data: { ruleId: rule.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء إنشاء القاعدة.",
    };
  }
}

/**
 * Server Action : Ajout d'une nouvelle version à une règle existante
 */
export async function addPayrollRuleVersionAction(
  formData: FormData
): Promise<ActionResult<{ versionId: string }>> {
  try {
    const caller = await verifyAdminCaller();

    const rawData = {
      ruleId: formData.get("ruleId")?.toString()?.trim() || "",
      value: formData.get("value")?.toString()?.trim() || "",
      unit: formData.get("unit")?.toString()?.trim() || "",
      effectiveFrom: formData.get("effectiveFrom")?.toString()?.trim() || "",
      effectiveTo: formData.get("effectiveTo")?.toString()?.trim() || "",
      notes: formData.get("notes")?.toString()?.trim() || undefined,
    };

    const parsed = createRuleVersionSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "بيانات الإصدار غير صالحة.";
      return { success: false, error: firstError };
    }

    const { ruleId, value, unit, effectiveFrom, effectiveTo, notes } = parsed.data;

    // Vérifier l'existence de la règle
    const rule = await prisma.payrollRule.findUnique({
      where: { id: ruleId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: { versionNumber: true },
        },
      },
    });

    if (!rule) {
      return { success: false, error: "القاعدة المحددة غير موجودة." };
    }

    const nextVersionNumber = (rule.versions[0]?.versionNumber ?? 0) + 1;

    const newVersion = await prisma.payrollRuleVersion.create({
      data: {
        ruleId,
        versionNumber: nextVersionNumber,
        value,
        unit,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        notes: notes || null,
        createdBy: caller.id,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "PAYROLL_RULE_VERSION_ADDED",
      resourceType: "PAYROLL_RULE",
      resourceId: ruleId,
      details: {
        ruleCode: rule.code,
        versionNumber: nextVersionNumber,
        value,
        unit,
        effectiveFrom,
        effectiveTo: effectiveTo || null,
      },
    });

    revalidatePath("/admin/payroll-rules");

    return { success: true, data: { versionId: newVersion.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الإصدار.",
    };
  }
}

/**
 * Server Action : Activer / Désactiver une règle de paie
 */
export async function togglePayrollRuleStatusAction(
  ruleId: string,
  targetStatus: boolean
): Promise<ActionResult> {
  try {
    const caller = await verifyAdminCaller();

    const rule = await prisma.payrollRule.findUnique({
      where: { id: ruleId },
      select: { id: true, code: true, nameAr: true, isActive: true },
    });

    if (!rule) {
      return { success: false, error: "القاعدة المحددة غير موجودة." };
    }

    await prisma.payrollRule.update({
      where: { id: ruleId },
      data: { isActive: targetStatus },
    });

    await recordAuditLog({
      userId: caller.id,
      action: targetStatus ? "PAYROLL_RULE_ACTIVATED" : "PAYROLL_RULE_DEACTIVATED",
      resourceType: "PAYROLL_RULE",
      resourceId: ruleId,
      details: {
        code: rule.code,
        nameAr: rule.nameAr,
        previousStatus: rule.isActive,
        newStatus: targetStatus,
      },
    });

    revalidatePath("/admin/payroll-rules");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تعديل حالة القاعدة.",
    };
  }
}
