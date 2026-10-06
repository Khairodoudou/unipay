import { redirect } from "next/navigation";
import { getSessionCookie } from "@/lib/auth/cookies";
import { validateSessionToken, UserSessionData } from "@/lib/auth/session";
import { RoleCode } from "./roles";

/**
 * Récupère l'utilisateur actuellement connecté depuis la session serveur.
 * Retourne `null` si aucune session valide, si la session est expirée ou si le compte est inactif.
 */
export async function getCurrentUser(): Promise<UserSessionData | null> {
  const token = await getSessionCookie();
  if (!token) {
    return null;
  }

  const result = await validateSessionToken(token);
  if (!result) {
    return null;
  }

  return result.user;
}

/**
 * Vérifie que l'utilisateur est authentifié.
 * Redirige immédiatement vers /login en cas d'absence de session.
 */
export async function requireAuth(): Promise<UserSessionData> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Vérifie que l'utilisateur possède l'un des rôles requis.
 * Redirige vers /login si non authentifié, ou vers /unauthorized si le rôle ne correspond pas.
 */
export async function requireRole(
  allowedRoles: RoleCode | RoleCode[]
): Promise<UserSessionData> {
  const user = await requireAuth();
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(user.roleCode as RoleCode)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Vérifie que l'utilisateur possède une permission spécifique.
 * Redirige vers /unauthorized en cas de permission manquante.
 */
export async function requirePermission(
  permissionCode: string
): Promise<UserSessionData> {
  const user = await requireAuth();

  if (!user.permissions.includes(permissionCode)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Fonctions de vérification booléennes pour l'UI ou la logique conditionnelle.
 */
export function hasRole(user: UserSessionData, roleCode: RoleCode): boolean {
  return user.roleCode === roleCode;
}

export function hasPermission(
  user: UserSessionData,
  permissionCode: string
): boolean {
  return user.permissions.includes(permissionCode);
}
