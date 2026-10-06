"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";

const ALLOWED_SETTING_KEYS = [
  "PLATFORM_NAME",
  "INSTITUTION_NAME",
  "DEFAULT_LANGUAGE",
  "DEFAULT_TIMEZONE",
  "SESSION_TTL_HOURS",
  "PASSWORD_MIN_LENGTH",
  "THEME_DEFAULT",
  "AUDIT_RETENTION_DAYS",
];

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function updateSystemSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await getCurrentUser();
    if (!caller || !caller.isActive || caller.roleCode !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتعديل إعدادات النظام." };
    }

    if (
      !caller.permissions.includes("settings.update") &&
      !caller.permissions.includes("system.settings")
    ) {
      return { success: false, error: "ينقصك إذن تعديل الإعدادات (settings.update)." };
    }

    const modifiedKeys: string[] = [];

    // Mettre à jour chaque clé autorisée présente dans le formData
    for (const key of ALLOWED_SETTING_KEYS) {
      const val = formData.get(key)?.toString()?.trim();
      if (val !== undefined && val !== null) {
        // Validation spécifique par clé
        if (key === "PASSWORD_MIN_LENGTH") {
          const num = parseInt(val, 10);
          if (isNaN(num) || num < 8 || num > 32) {
            return { success: false, error: "الحد الأدنى لكلمة المرور يجب أن يكون بين 8 و 32 خانة." };
          }
        }
        if (key === "SESSION_TTL_HOURS") {
          const num = parseInt(val, 10);
          if (isNaN(num) || num < 1 || num > 720) {
            return { success: false, error: "مدة صلاحية الجلسة يجب أن تكون بين 1 و 720 ساعة." };
          }
        }

        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: val },
          create: {
            key,
            value: val,
            category: key.startsWith("SESSION") || key.startsWith("PASSWORD") ? "SECURITY" : "GENERAL",
            labelAr: key,
          },
        });
        modifiedKeys.push(key);
      }
    }

    // Journalisation d'audit
    await recordAuditLog({
      userId: caller.id,
      action: "SETTINGS_UPDATED",
      resourceType: "SYSTEM_SETTINGS",
      details: {
        modifiedKeys,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الإعدادات.",
    };
  }
}
