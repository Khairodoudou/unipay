"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";

const ESSENTIAL_ADMIN_PERMISSIONS = [
  "admin.access",
  "system.settings",
  "settings.read",
  "settings.update",
  "roles.read",
  "roles.update",
  "permissions.read",
  "permissions.update",
  "users.read",
  "users.update",
  "users.disable",
  "audit.read",
];

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Server Action : Mise à jour sécurisée des permissions associées à un rôle
 */
export async function updateRolePermissionsAction(
  roleId: string,
  permissionCodes: string[]
): Promise<ActionResult> {
  try {
    const caller = await getCurrentUser();
    if (!caller || !caller.isActive || caller.roleCode !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتعديل صلاحيات الأدوار." };
    }
    if (!caller.permissions.includes("roles.update")) {
      return { success: false, error: "ينقصك إذن (roles.update) لتعديل الصلاحيات." };
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      return { success: false, error: "الدور المحدد غير موجود." };
    }

    // Protection critique : Interdiction de retirer les permissions vitales de l'ADMIN
    if (role.code === "ADMIN") {
      const missingEssential = ESSENTIAL_ADMIN_PERMISSIONS.filter(
        (p) => !permissionCodes.includes(p)
      );

      if (missingEssential.length > 0) {
        return {
          success: false,
          error: `عملية مرفوضة: لا يمكن تجريد دور مدير النظام من الصلاحيات الحيوية (${missingEssential.join(", ")}).`,
        };
      }
    }

    // Récupérer les ID des permissions ciblées
    const targetPermissions = await prisma.permission.findMany({
      where: {
        code: { in: permissionCodes },
      },
      select: { id: true, code: true },
    });

    const previousCodes = role.rolePermissions.map((rp) => rp.permission.code);

    // Transaction atomique pour remplacer les associations
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      if (targetPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: targetPermissions.map((p) => ({
            roleId: role.id,
            permissionId: p.id,
          })),
        });
      }
    });

    // Journalisation d'audit avec before / after
    await recordAuditLog({
      userId: caller.id,
      action: "ROLE_PERMISSIONS_UPDATED",
      resourceType: "ROLE",
      resourceId: role.id,
      details: {
        roleCode: role.code,
        permissionsBefore: previousCodes,
        permissionsAfter: targetPermissions.map((p) => p.code),
        addedCount: targetPermissions.length - previousCodes.length,
      },
    });

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${roleId}`);
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الصلاحيات.",
    };
  }
}
