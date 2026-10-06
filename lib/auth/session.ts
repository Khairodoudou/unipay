import crypto from "crypto";
import prisma from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit/logger";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "unipay-institutional-payroll-secure-session-key-2026-dz";

// Durée de vie de la session : 7 jours
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface UserSessionData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleCode: string;
  roleNameAr: string;
  organizationId: string;
  organizationName: string;
  isActive: boolean;
  permissions: string[];
}

/**
 * Hache un token de session brut avec SHA-256 et le secret de session.
 */
export function hashSessionToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token + SESSION_SECRET)
    .digest("hex");
}

/**
 * Crée une nouvelle session pour un utilisateur en base de données.
 * Retourne le token brut destiné au cookie HttpOnly.
 */
export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  // Token cryptographique de 32 octets aléatoires (64 caractères hexadécimaux)
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Valide un token de session et extrait les informations de l'utilisateur actif.
 * Si la session est expirée ou si le compte est désactivé, elle est révoquée.
 */
export async function validateSessionToken(
  token: string
): Promise<{ user: UserSessionData; expiresAt: Date } | null> {
  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
          organization: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // 1. Contrôle d'expiration
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // 2. Contrôle de compte actif
  if (!session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    await recordAuditLog({
      userId: session.user.id,
      action: "ACCOUNT_LOCKED",
      details: "Tentative d'accès avec un compte désactivé",
    });
    return null;
  }

  // 3. Mise à jour de l'horodatage lastUsedAt (throttled à 5 min)
  if (Date.now() - session.lastUsedAt.getTime() > 5 * 60 * 1000) {
    await prisma.session
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});
  }

  const permissions = session.user.role.rolePermissions.map(
    (rp) => rp.permission.code
  );

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      roleId: session.user.roleId,
      roleCode: session.user.role.code,
      roleNameAr: session.user.role.nameAr,
      organizationId: session.user.organizationId,
      organizationName: session.user.organization.name,
      isActive: session.user.isActive,
      permissions,
    },
    expiresAt: session.expiresAt,
  };
}

/**
 * Invalide une session spécifique (ex. lors du logout).
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

/**
 * Invalide toutes les sessions actives d'un utilisateur (ex. révocation de sécurité).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}
