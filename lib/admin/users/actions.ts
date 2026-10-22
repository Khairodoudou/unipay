"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";
import { invalidateAllUserSessions } from "@/lib/auth/session";
import {
  userCreateSchema,
  userUpdateSchema,
  userResetPasswordSchema,
} from "./schemas";

const BCRYPT_ROUNDS = 12;

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Vérifie les autorisations de l'administrateur exécutant l'action.
 */
async function verifyAdminCaller(requiredPermission?: string) {
  const caller = await getCurrentUser();
  if (!caller) {
    throw new Error("جلسة العمل غير صالحة أو منتهية. يرجى تسجيل الدخول مجدداً.");
  }
  if (!caller.isActive) {
    throw new Error("هذا الحساب معطّل ولا يمكنه تنفيذ أي عملية.");
  }
  if (caller.roleCode !== "ADMIN" && caller.roleCode !== "SUPER_ADMIN") {
    throw new Error("غير مصرح لك بتنفيذ هذه العملية الإدارية.");
  }
  if (requiredPermission && !caller.permissions.includes(requiredPermission)) {
    throw new Error(`ينقصك إذن الوصول الإداري المطلوب (${requiredPermission}).`);
  }
  return caller;
}

/**
 * Server Action : Création d'un nouvel utilisateur
 */
export async function createUserAction(
  formData: FormData
): Promise<ActionResult<{ userId: string }>> {
  try {
    const caller = await verifyAdminCaller("users.create");

    const rawData = {
      firstName: formData.get("firstName")?.toString()?.trim() || "",
      lastName: formData.get("lastName")?.toString()?.trim() || "",
      email: formData.get("email")?.toString()?.trim()?.toLowerCase() || "",
      roleId: formData.get("roleId")?.toString()?.trim() || "",
      organizationId: formData.get("organizationId")?.toString()?.trim() || "",
      password: formData.get("password")?.toString() || "",
      isActive: formData.get("isActive") === "false" ? false : true,
    };

    const parsed = userCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "بيانات الإدخال غير صالحة.";
      return { success: false, error: firstError };
    }

    const { firstName, lastName, email, roleId, organizationId, password, isActive } =
      parsed.data;

    // Vérifier l'unicité de l'email
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return {
        success: false,
        error: "البريد الإلكتروني مستخدم بالفعل لحساب آخر في المنصة.",
      };
    }

    // Règle d'isolation : pour un ADMIN local, l'utilisateur est STRICTEMENT créé dans sa propre université
    const effectiveOrgId = caller.roleCode === "SUPER_ADMIN"
      ? (organizationId || null)
      : caller.organizationId;

    if (caller.roleCode !== "SUPER_ADMIN" && !effectiveOrgId) {
      return { success: false, error: "المؤسسة الجامعية للمستخدم مطلوبة." };
    }

    // Vérifier l'existence du rôle et de l'organisation
    const [role, org] = await Promise.all([
      prisma.role.findUnique({ where: { id: roleId }, select: { id: true, code: true, nameAr: true } }),
      effectiveOrgId ? prisma.organization.findUnique({ where: { id: effectiveOrgId }, select: { id: true, name: true } }) : null,
    ]);

    if (!role) {
      return { success: false, error: "الدور الوظيفي المحدد غير موجود." };
    }

    if (role.code === "SUPER_ADMIN" && caller.roleCode !== "SUPER_ADMIN") {
      return { success: false, error: "لا يمكن تعيين دور مدير وطني عام إلا بواسطة مدير وطني عام." };
    }

    if (effectiveOrgId && !org) {
      return { success: false, error: "المؤسسة المحددة غير موجودة." };
    }

    // Hachage sécurisé du mot de passe (bcrypt)
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        roleId,
        organizationId: effectiveOrgId,
        isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Journalisation d'audit (sans aucun mot de passe ou hash)
    await recordAuditLog({
      userId: caller.id,
      action: "USER_CREATED",
      resourceType: "USER",
      resourceId: newUser.id,
      details: {
        targetEmail: newUser.email,
        targetName: `${newUser.firstName} ${newUser.lastName}`,
        roleCode: role.code,
        organizationName: org?.name || "المنصة المركزية الوطنية",
        isActive: newUser.isActive,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");

    return { success: true, data: { userId: newUser.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء إنشاء الحساب.",
    };
  }
}

/**
 * Server Action : Mise à jour des informations d'un utilisateur
 */
export async function updateUserAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await verifyAdminCaller("users.update");

    const rawData = {
      userId: formData.get("userId")?.toString()?.trim() || "",
      firstName: formData.get("firstName")?.toString()?.trim() || "",
      lastName: formData.get("lastName")?.toString()?.trim() || "",
      email: formData.get("email")?.toString()?.trim()?.toLowerCase() || "",
      roleId: formData.get("roleId")?.toString()?.trim() || "",
      organizationId: formData.get("organizationId")?.toString()?.trim() || "",
      isActive: formData.get("isActive") === "true",
    };

    const parsed = userUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "بيانات التحديث غير صالحة.";
      return { success: false, error: firstError };
    }

    const { userId, firstName, lastName, email, roleId, organizationId, isActive } =
      parsed.data;

    // Récupérer l'utilisateur actuel avec son rôle
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        organization: true,
      },
    });

    if (!targetUser) {
      return { success: false, error: "المستخدم المراد تعديله غير موجود." };
    }

    // Contrôle d'isolation de tenant
    if (caller.roleCode !== "SUPER_ADMIN" && targetUser.organizationId !== caller.organizationId) {
      return { success: false, error: "عملية مرفوضة: لا تملك صلاحية تعديل مستخدم تابع لجامعة أخرى." };
    }

    // Vérifier l'unicité de l'email si modifié
    if (email !== targetUser.email) {
      const emailOccupied = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (emailOccupied) {
        return { success: false, error: "البريد الإلكتروني المدخل مستخدم لحساب آخر." };
      }
    }

    // Vérifier le nouveau rôle
    const newRole = await prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!newRole) {
      return { success: false, error: "الدور الوظيفي المحدد غير موجود." };
    }

    if (newRole.code === "SUPER_ADMIN" && caller.roleCode !== "SUPER_ADMIN") {
      return { success: false, error: "لا يمكن ترقية مستخدم لدور مدير وطني عام إلا بواسطة مدير وطني عام." };
    }

    // RÈGLE CRITIQUE : Protection du dernier ADMIN actif par université
    const isCurrentlyActiveAdmin =
      targetUser.role.code === "ADMIN" && targetUser.isActive;
    const willRemainActiveAdmin =
      newRole.code === "ADMIN" && isActive === true;

    if (isCurrentlyActiveAdmin && !willRemainActiveAdmin) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: { code: "ADMIN" },
          isActive: true,
          organizationId: targetUser.organizationId,
        },
      });

      if (activeAdminCount <= 1) {
        return {
          success: false,
          error:
            "عملية مرفوضة: لا يمكن تغيير دور أو تعطيل آخر مدير نشط لهذه الجامعة لضمان استمرارية الإدارة.",
        };
      }
    }

    const effectiveOrgId = caller.roleCode === "SUPER_ADMIN"
      ? (organizationId || null)
      : targetUser.organizationId;

    // Mise à jour en base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        roleId,
        organizationId: effectiveOrgId,
        isActive,
      },
      include: {
        role: true,
      },
    });

    // Si le compte a été désactivé, révoquer immédiatement toutes ses sessions
    if (!isActive) {
      await invalidateAllUserSessions(userId);
    }

    // Audit log
    await recordAuditLog({
      userId: caller.id,
      action:
        targetUser.role.code !== newRole.code
          ? "USER_ROLE_CHANGED"
          : "USER_UPDATED",
      resourceType: "USER",
      resourceId: userId,
      details: {
        targetEmail: updatedUser.email,
        roleBefore: targetUser.role.code,
        roleAfter: updatedUser.role.code,
        statusBefore: targetUser.isActive,
        statusAfter: updatedUser.isActive,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث بيانات المستخدم.",
    };
  }
}

/**
 * Server Action : Activation / Désactivation rapide d'un utilisateur
 */
export async function toggleUserStatusAction(
  userId: string,
  targetStatus: boolean
): Promise<ActionResult> {
  try {
    const caller = await verifyAdminCaller("users.disable");

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!targetUser) {
      return { success: false, error: "المستخدم غير موجود." };
    }

    // Contrôle d'isolation de tenant
    if (caller.roleCode !== "SUPER_ADMIN" && targetUser.organizationId !== caller.organizationId) {
      return { success: false, error: "عملية مرفوضة: لا تملك صلاحية تعديل مستخدم تابع لجامعة أخرى." };
    }

    // RÈGLE CRITIQUE : Protection du dernier ADMIN actif au niveau de l'université
    if (targetUser.role.code === "ADMIN" && !targetStatus) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: { code: "ADMIN" },
          isActive: true,
          organizationId: targetUser.organizationId,
        },
      });

      if (activeAdminCount <= 1) {
        return {
          success: false,
          error:
            "عملية مرفوضة: لا يمكن تعطيل آخر مدير نظام نشط لهذه الجامعة لضمان استمرارية الإدارة.",
        };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: targetStatus },
    });

    // Si désactivé, invalider toutes ses sessions immédiatement
    if (!targetStatus) {
      await invalidateAllUserSessions(userId);
    }

    await recordAuditLog({
      userId: caller.id,
      action: targetStatus ? "USER_ENABLED" : "USER_DISABLED",
      resourceType: "USER",
      resourceId: userId,
      details: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role.code,
        newStatus: targetStatus,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تعديل حالة الحساب.",
    };
  }
}

/**
 * Server Action : Réinitialisation sécurisée du mot de passe d'un utilisateur
 */
export async function resetUserPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await verifyAdminCaller("users.update");

    const rawData = {
      userId: formData.get("userId")?.toString()?.trim() || "",
      newPassword: formData.get("newPassword")?.toString() || "",
    };

    const parsed = userResetPasswordSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "كلمة المرور غير مطابقة للمواصفات الأمنية.",
      };
    }

    const { userId, newPassword } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, organizationId: true },
    });

    if (!targetUser) {
      return { success: false, error: "المستخدم غير موجود." };
    }

    if (caller.roleCode !== "SUPER_ADMIN" && targetUser.organizationId !== caller.organizationId) {
      return { success: false, error: "غير مصرح لك بتعيين كلمة مرور مستخدم في مؤسسة أخرى." };
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalider les sessions en cours pour forcer une nouvelle connexion avec le nouveau mot de passe
    await invalidateAllUserSessions(userId);

    // Audit log (strictement sans le mot de passe ni son hash)
    await recordAuditLog({
      userId: caller.id,
      action: "USER_PASSWORD_RESET",
      resourceType: "USER",
      resourceId: userId,
      details: {
        targetEmail: targetUser.email,
        note: "Réinitialisation effectuée par l'administrateur",
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تعيين كلمة المرور.",
    };
  }
}

/**
 * Server Action : Suppression définitive d'un utilisateur avec protections critiques
 */
export async function deleteUserAction(
  userId: string
): Promise<ActionResult> {
  try {
    const caller = await verifyAdminCaller("users.disable");

    if (!userId || typeof userId !== "string") {
      return { success: false, error: "معرّف المستخدم غير صالح." };
    }

    // Protection 1 : Interdiction de supprimer son propre compte
    if (caller.id === userId) {
      return {
        success: false,
        error: "عملية مرفوضة: لا يمكنك حذف حسابك الشخصي الذي تستخدمه حالياً.",
      };
    }

    // Récupérer l'utilisateur avec ses dépendances critiques
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        workflowActions: { select: { id: true }, take: 1 },
      },
    });

    if (!targetUser) {
      return { success: false, error: "المستخدم غير موجود أو تم حذفه مسبقاً." };
    }

    // Contrôle d'isolation de tenant
    if (caller.roleCode !== "SUPER_ADMIN" && targetUser.organizationId !== caller.organizationId) {
      return { success: false, error: "عملية مرفوضة: لا يمكنك حذف مستخدم تابع لجامعة أخرى." };
    }

    // Protection 2 : Protection du dernier ADMIN actif par université
    if (targetUser.role.code === "ADMIN" && targetUser.isActive) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: { code: "ADMIN" },
          isActive: true,
          organizationId: targetUser.organizationId,
        },
      });

      if (activeAdminCount <= 1) {
        return {
          success: false,
          error:
            "عملية مرفوضة: لا يمكن حذف آخر مدير نشط لهذه الجامعة لضمان استمرارية الإدارة.",
        };
      }
    }

    // Protection 3 : Si l'utilisateur a participé à des actions de workflow immuables
    if (targetUser.workflowActions && targetUser.workflowActions.length > 0) {
      return {
        success: false,
        error:
          "لا يمكن حذف هذا المستخدم نهائياً نظراً لارتباطه بسجلات سير العمل (Workflow) المعتمدة. للحفاظ على سلامة التدقيق المالي، يُرجى تعطيل الحساب بدلاً من حذفه.",
      };
    }

    // Invalider immédiatement toutes les sessions actives
    await invalidateAllUserSessions(userId);

    // Suppression définitive dans Prisma
    await prisma.user.delete({
      where: { id: userId },
    });

    // Journalisation d'audit
    await recordAuditLog({
      userId: caller.id,
      action: "USER_DELETED",
      resourceType: "USER",
      resourceId: userId,
      details: {
        targetEmail: targetUser.email,
        targetName: `${targetUser.firstName} ${targetUser.lastName}`,
        targetRole: targetUser.role.code,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        error:
          "تعذر حذف المستخدم لوجود بيانات وسجلات مرتبطة به. يوصى بتعطيل حسابه لمنعه من الوصول.",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء محاولة حذف المستخدم.",
    };
  }
}

