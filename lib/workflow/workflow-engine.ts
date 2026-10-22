/**
 * lib/workflow/workflow-engine.ts
 * Moteur central d'exécution des transitions workflow — server-only.
 *
 * Sécurité :
 * 1. Session validate → user active
 * 2. Role + permission check
 * 3. Organization scope check
 * 4. Status + transition check
 * 5. Zod validation
 * 6. Transaction atomique (anti-concurrence)
 * 7. WorkflowAction + AuditLog + Notifications
 */

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import type { UserSessionData } from "@/lib/auth/session";
import { findTransition, ALLOWED_TRANSITIONS, type TransitionDefinition } from "./transitions";
import { createWorkflowNotifications } from "./notifications";
import { executeTransitionSchema, returnTransitionSchema } from "./schemas";

export interface WorkflowResult {
  success: boolean;
  error?: string;
  data?: { batchId: string; newStatus: string };
}

/** Map action → action AuditLog */
const ACTION_TO_AUDIT: Record<string, string> = {
  SUBMIT_TO_CHEF:         "BATCH_SUBMITTED",
  APPROVE_CHEF:           "BATCH_APPROVED_BY_CHEF",
  RETURN_BY_CHEF:         "BATCH_RETURNED_BY_CHEF",
  TAKE_DIRECTOR_REVIEW:   "DIRECTOR_REVIEW_STARTED",
  APPROVE_DIRECTOR:       "BATCH_APPROVED_BY_DIRECTOR",
  RETURN_BY_DIRECTOR:     "BATCH_RETURNED_BY_DIRECTOR",
  TAKE_ACCOUNTING_REVIEW: "ACCOUNTING_REVIEW_STARTED",
  VALIDATE_ACCOUNTING:    "ACCOUNTING_VALIDATED",
  RETURN_BY_ACCOUNTING:   "ACCOUNTING_RETURNED",
  TAKE_FINANCIAL_CONTROL: "FINANCIAL_CONTROL_STARTED",
  GRANT_FINANCIAL_VISA:   "FINANCIAL_VISA_GRANTED",
  RETURN_BY_FINANCIAL:    "FINANCIAL_RETURNED",
  // Phase 8
  START_PAYMENT_PROCESSING: "PAYMENT_PROCESSING_STARTED",
  CONFIRM_PAYMENT:          "PAYMENT_CONFIRMED",
  CLOSE_BATCH:              "PAYMENT_BATCH_CLOSED",
};

/** Chemins à revalider après une transition */
const REVALIDATE_PATHS = [
  "/chef",
  "/directeur",
  "/comptable",
  "/controle-financier",
  "/agent",
];

/**
 * Vérifie si un utilisateur peut accéder à un batch (org-scope).
 * Retourne null si accès autorisé, message d'erreur sinon.
 */
export async function canAccessBatch(
  userId: string,
  userOrgId: string,
  batchId: string,
  userRole?: string
): Promise<string | null> {
  const batch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    select: { id: true, organizationId: true },
  });

  if (!batch) return "الدفعة غير موجودة.";

  if (userRole === "SUPER_ADMIN") return null;

  if (!batch.organizationId || batch.organizationId !== userOrgId) {
    return "ليس لديك صلاحية الوصول إلى هذه الدفعة (نطاق مختلف).";
  }

  return null;
}

/**
 * Moteur central d'exécution d'une transition workflow.
 * Toutes les Server Actions d'approbation/rejet passent par cette fonction.
 */
export async function executeTransition(
  rawInput: {
    batchId: string;
    action: string;
    reason?: string;
  },
  sessionOverride?: UserSessionData | null
): Promise<WorkflowResult> {
  // ── 1. Récupérer l'utilisateur connecté ─────────────────────────────────────
  let user: UserSessionData | null = null;
  if (sessionOverride !== undefined) {
    user = sessionOverride;
  } else {
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }
  }
  if (!user) return { success: false, error: "يجب تسجيل الدخول للقيام بهذه العملية." };
  if (!user.isActive) return { success: false, error: "الحساب غير نشط." };


  // ── 3. Valider les inputs Zod ──────────────────────────────────────────────
  // Choisir le schéma selon si raison obligatoire ou non
  const transitionCandidate = findTransitionByAction(rawInput.action);
  if (!transitionCandidate) {
    return { success: false, error: `الإجراء "${rawInput.action}" غير معروف.` };
  }

  const schema = transitionCandidate.requireReason ? returnTransitionSchema : executeTransitionSchema;
  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة." };
  }

  const { batchId, action, reason } = parsed.data;

  // ── 4. Vérifier rôle ──────────────────────────────────────────────────────
  if (!transitionCandidate.allowedRoles.includes(user.roleCode as never)) {
    return { success: false, error: "ليس لديك الدور المطلوب لهذه العملية." };
  }

  // ── 5. Vérifier permission ────────────────────────────────────────────────
  if (!user.permissions.includes(transitionCandidate.requiredPermission)) {
    return { success: false, error: "ليس لديك الصلاحية المطلوبة لهذه العملية." };
  }

  // ── 6. Récupérer le batch + org-scope ────────────────────────────────────
  const accessError = await canAccessBatch(user.id, user.organizationId, batchId, user.roleCode);
  if (accessError) return { success: false, error: accessError };

  // ── 7. Exécuter dans une transaction atomique (anti-concurrence) ──────────
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-lire le batch dans la transaction pour éviter la concurrence
      const batch = await tx.payrollBatch.findUnique({
        where: { id: batchId },
        select: {
          id: true,
          status: true,
          organizationId: true,
          versionNumber: true,
          label: true,
          period: { select: { label: true } },
        },
      });

      if (!batch) throw new Error("الدفعة غير موجودة.");

      // Vérification stricte du périmètre organisationnel dans la transaction
      if (user.roleCode !== "SUPER_ADMIN" && (!batch.organizationId || batch.organizationId !== user.organizationId)) {
        throw new Error("ليس لديك صلاحية الوصول إلى هذه الدفعة (نطاق مختلف).");
      }

      // Vérifier la transition depuis le statut actuel du batch
      const def = findTransition(action, batch.status);
      if (!def) {
        throw new Error(
          `لا يمكن تنفيذ الإجراء "${action}" من الحالة "${batch.status}". قد تكون الدفعة تغيّرت.`
        );
      }

      const batchLabel = batch.label ?? batch.period?.label ?? batchId;

      // ── 1. Update status ──────────────────────────────────────────────────
      const updatedBatch = await tx.payrollBatch.update({
        where: { id: batchId },
        data: {
          status:    def.toStatus,
          updatedAt: new Date(),
          // Si c'est une soumission, enregistrer le soumetteur
          ...(action === "SUBMIT_TO_CHEF"
            ? { submittedBy: user.id, submittedAt: new Date() }
            : {}),
        },
      });

      // ── 2. Créer WorkflowAction ───────────────────────────────────────────
      await tx.workflowAction.create({
        data: {
          batchId:    batchId,
          actorId:    user.id,
          action:     action,
          fromStatus: def.fromStatus,
          toStatus:   def.toStatus,
          reason:     reason ?? null,
          metadata:   JSON.stringify({
            batchVersion: batch.versionNumber,
            actorRole:    user.roleCode,
          }),
        },
      });

      // ── 3. Créer AuditLog DANS la transaction pour garantir l'atomicité ──
      const auditAction = ACTION_TO_AUDIT[action] ?? "WORKFLOW_TRANSITION";
      await tx.auditLog.create({
        data: {
          userId:       user.id,
          action:       auditAction,
          resourceType: "PAYROLL_BATCH",
          resourceId:   batchId,
          details:      JSON.stringify({
            action,
            fromStatus:   def.fromStatus,
            toStatus:     def.toStatus,
            reason:       reason ?? null,
            actorRole:    user.roleCode,
            batchVersion: batch.versionNumber,
          }),
        },
      });

      // ── 4. Créer Notifications DANS la transaction ───────────────────────
      await createWorkflowNotifications({
        action,
        batchId,
        batchLabel,
        orgId:   batch.organizationId ?? user.organizationId,
        actorId: user.id,
        reason:  reason ?? null,
        tx,
      });

      return { updatedBatch, batchLabel, orgId: batch.organizationId ?? user.organizationId };
    });

    // ── Revalidation des caches Next.js ─────────────────────────────────────
    try {
      for (const path of REVALIDATE_PATHS) revalidatePath(path, "layout");
      revalidatePath(`/chef/batches/${batchId}`);
      revalidatePath(`/directeur/batches/${batchId}`);
      revalidatePath(`/comptable/batches/${batchId}`);
      revalidatePath(`/controle-financier/batches/${batchId}`);
      revalidatePath(`/agent/batches/${batchId}`);
    } catch {
      // Ignoré en environnement de test / scripts (hors requête Next.js)
    }

    return {
      success: true,
      data: { batchId, newStatus: result.updatedBatch.status },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    console.error("[WORKFLOW_ENGINE_ERROR]", message);
    return { success: false, error: message };
  }
}

/** Helper interne — trouve la définition d'une action (sans vérifier fromStatus) */
function findTransitionByAction(action: string): TransitionDefinition | null {
  return ALLOWED_TRANSITIONS.find((t) => t.action === action) ?? null;
}
