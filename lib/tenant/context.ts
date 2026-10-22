/**
 * lib/tenant/context.ts
 * ============================================================================
 * CONTRÔLE D'ACCÈS & ISOLATION MULTI-TENANT (Algérie - Enseignement Supérieur)
 * ============================================================================
 * Résolution stricte et infalsifiable de l'Université (Tenant) côté serveur.
 */

import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/rbac/guards";
import type { UserSessionData } from "@/lib/auth/session";

export interface TenantContext {
  user: UserSessionData;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  isSuperAdmin: boolean;
}

export class TenantSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantSecurityError";
  }
}

/**
 * Résout et valide le contexte de l'université (tenant) de manière 100% sécurisée côté serveur.
 * Aucune valeur client (form, param, cookie) n'est acceptée sans validation formelle.
 */
export async function requireTenantContext(
  targetTenantId?: string | null
): Promise<TenantContext> {
  const user = await requireAuth();

  const isSuperAdmin = user.roleCode === "SUPER_ADMIN";

  // Cas 1 : Utilisateur institutionnel local (ADMIN, AGENT_RH, CHEF, DIRECTEUR, etc.)
  if (!isSuperAdmin) {
    if (!user.organizationId) {
      redirect("/unauthorized");
    }

    // Si un targetTenantId est fourni par un formulaire ou une URL, il DOIT correspondre strictement
    if (targetTenantId && targetTenantId !== user.organizationId) {
      throw new TenantSecurityError(
        "محاولة وصول غير مصرح بها: لا يمكنك الوصول إلى بيانات مؤسسة أخرى."
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, code: true, name: true, isActive: true, status: true },
    });

    if (!org) {
      redirect("/unauthorized");
    }

    if (!org.isActive || org.status === "SUSPENDED" || org.status === "ARCHIVED") {
      throw new TenantSecurityError(
        "تم تجميد أو إيقاف هذه المؤسسة الجامعية. يرجى التواصل مع الإدارة المركزية."
      );
    }

    return {
      user,
      tenantId: org.id,
      tenantCode: org.code,
      tenantName: org.name,
      isSuperAdmin: false,
    };
  }

  // Cas 2 : SUPER_ADMIN
  let activeTenantId = targetTenantId || user.organizationId;

  if (!activeTenantId) {
    // Si aucun tenant ciblé, récupérer la première organisation active
    const defaultOrg = await prisma.organization.findFirst({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
    });
    if (!defaultOrg) {
      throw new TenantSecurityError("لا توجد أي مؤسسة جامعية مسجلة في المنصة.");
    }
    activeTenantId = defaultOrg.id;
  }

  const org = await prisma.organization.findUnique({
    where: { id: activeTenantId },
    select: { id: true, code: true, name: true, isActive: true, status: true },
  });

  if (!org) {
    throw new TenantSecurityError("المؤسسة الجامعية المحددة غير موجودة.");
  }

  return {
    user,
    tenantId: org.id,
    tenantCode: org.code,
    tenantName: org.name,
    isSuperAdmin: true,
  };
}

/**
 * Vérifie que l'utilisateur est un SUPER_ADMIN actif.
 */
export async function requireSuperAdmin(): Promise<UserSessionData> {
  const user = await requireAuth();
  if (user.roleCode !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Vérifie que l'utilisateur est un administrateur universitaire (ADMIN) ou SUPER_ADMIN.
 */
export async function requireUniversityAdmin(
  targetTenantId?: string | null
): Promise<TenantContext> {
  const user = await requireAuth();
  if (user.roleCode !== "ADMIN" && user.roleCode !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }
  return requireTenantContext(targetTenantId);
}

/**
 * Vérifie formellement qu'une ressource appartient bien au tenant actif.
 */
export function assertTenantMatches(
  context: TenantContext,
  resourceOrgId: string | null | undefined,
  resourceName: string = "السجل"
): void {
  if (context.isSuperAdmin) return;
  if (!resourceOrgId || resourceOrgId !== context.tenantId) {
    throw new TenantSecurityError(
      `خرق أمني في النطاق: ${resourceName} لا ينتمي إلى مؤسستك الجامعية.`
    );
  }
}
