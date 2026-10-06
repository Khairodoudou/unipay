"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { verifyPassword } from "./password";
import { createSession, invalidateSession } from "./session";
import { setSessionCookie, deleteSessionCookie, getSessionCookie } from "./cookies";
import { recordAuditLog } from "@/lib/audit/logger";
import { getDashboardForRole } from "@/lib/rbac/roles";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني المدخل غير صالح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل"),
});

export interface LoginActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Server Action pour l'authentification sécurisée des utilisateurs.
 */
export async function loginAction(
  formData: FormData
): Promise<LoginActionResult> {
  const rawEmail = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;

  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "unknown";

  // 1. Validation des champs
  const validation = loginSchema.safeParse({
    email: rawEmail?.trim()?.toLowerCase(),
    password: rawPassword,
  });

  if (!validation.success) {
    await recordAuditLog({
      action: "LOGIN_FAILED",
      details: { reason: "Validation schema failed", email: rawEmail },
      ipAddress,
      userAgent,
    });
    return {
      success: false,
      error: "بيانات الاعتماد المدخلة غير مطابقة للشروط المطلوبة.",
    };
  }

  const { email, password } = validation.data;

  // 2. Recherche de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
      organization: true,
    },
  });

  // Message générique pour éviter l'énumération des comptes utilisateurs
  const GENERIC_ERROR = "بيانات الاعتماد غير صحيحة. يرجى التحقق من البريد وكلمة المرور.";

  if (!user) {
    await recordAuditLog({
      action: "LOGIN_FAILED",
      details: { reason: "User not found", email },
      ipAddress,
      userAgent,
    });
    return { success: false, error: GENERIC_ERROR };
  }

  // 3. Vérification si le compte est actif
  if (!user.isActive) {
    await recordAuditLog({
      userId: user.id,
      action: "LOGIN_FAILED",
      details: { reason: "Account inactive", email },
      ipAddress,
      userAgent,
    });
    return {
      success: false,
      error: "هذا الحساب معطّل. يرجى مراجعة إدارة النظام لتفعيل الحساب.",
    };
  }

  // 4. Vérification du mot de passe
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    await recordAuditLog({
      userId: user.id,
      action: "LOGIN_FAILED",
      details: { reason: "Invalid password" },
      ipAddress,
      userAgent,
    });
    return { success: false, error: GENERIC_ERROR };
  }

  // 5. Création de la session en base de données
  const { token, expiresAt } = await createSession(user.id);

  // 6. Écriture du cookie HttpOnly sécurisé
  await setSessionCookie(token, expiresAt);

  // 7. Mise à jour de lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 8. Journalisation de l'audit de succès
  await recordAuditLog({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    details: {
      role: user.role.code,
      organization: user.organization.name,
    },
    ipAddress,
    userAgent,
  });

  // 9. Détermination de la redirection selon le rôle RBAC
  const redirectTo = getDashboardForRole(user.role.code);

  return {
    success: true,
    redirectTo,
  };
}

/**
 * Server Action pour la déconnexion complète de la session.
 */
export async function logoutAction(): Promise<void> {
  const token = await getSessionCookie();
  if (token) {
    await invalidateSession(token);
    await recordAuditLog({
      action: "LOGOUT",
      details: "Déconnexion utilisateur effectuée",
    });
  }

  await deleteSessionCookie();
  redirect("/login");
}
