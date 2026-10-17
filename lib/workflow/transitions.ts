/**
 * lib/workflow/transitions.ts
 * Matrice centralisée des transitions autorisées par rôle et permission.
 * C'est la SEULE source de vérité pour la machine d'état.
 * Phase 6 : Approval workflow. Phase 8 : Payment workflow.
 */

import { BatchStatus, WorkflowActionType, BATCH_STATUS, WORKFLOW_ACTIONS } from "./states";
import { RoleCode } from "@/lib/rbac/roles";

export interface TransitionDefinition {
  action: WorkflowActionType;
  fromStatus: BatchStatus;
  toStatus: BatchStatus;
  allowedRoles: RoleCode[];
  requiredPermission: string;
  /** La raison est obligatoire pour les retours */
  requireReason: boolean;
  /** Description arabe de l'action */
  labelAr: string;
}

export const ALLOWED_TRANSITIONS: TransitionDefinition[] = [
  // ── Agent RH : soumettre au Chef ──────────────────────────────────────────────
  {
    action:             WORKFLOW_ACTIONS.SUBMIT_TO_CHEF,
    fromStatus:         BATCH_STATUS.READY_FOR_REVIEW,
    toStatus:           BATCH_STATUS.CHEF_REVIEW,
    allowedRoles:       ["AGENT_RH"],
    requiredPermission: "batch.submit",
    requireReason:      false,
    labelAr:            "إرسال إلى رئيس المصلحة",
  },

  // ── Chef de Service ───────────────────────────────────────────────────────────
  {
    action:             WORKFLOW_ACTIONS.APPROVE_CHEF,
    fromStatus:         BATCH_STATUS.CHEF_REVIEW,
    toStatus:           BATCH_STATUS.APPROVED_BY_CHEF,
    allowedRoles:       ["CHEF_SERVICE"],
    requiredPermission: "payroll.verify",
    requireReason:      false,
    labelAr:            "مصادقة رئيس المصلحة",
  },
  {
    action:             WORKFLOW_ACTIONS.RETURN_BY_CHEF,
    fromStatus:         BATCH_STATUS.CHEF_REVIEW,
    toStatus:           BATCH_STATUS.RETURNED_FOR_CORRECTION,
    allowedRoles:       ["CHEF_SERVICE"],
    requiredPermission: "payroll.verify",
    requireReason:      true,
    labelAr:            "إعادة للتصحيح من رئيس المصلحة",
  },

  // ── Directeur ─────────────────────────────────────────────────────────────────
  {
    action:             WORKFLOW_ACTIONS.TAKE_DIRECTOR_REVIEW,
    fromStatus:         BATCH_STATUS.APPROVED_BY_CHEF,
    toStatus:           BATCH_STATUS.DIRECTOR_REVIEW,
    allowedRoles:       ["DIRECTEUR"],
    requiredPermission: "payroll.approve",
    requireReason:      false,
    labelAr:            "أخذ الدفعة للمراجعة من طرف المدير",
  },
  {
    action:             WORKFLOW_ACTIONS.APPROVE_DIRECTOR,
    fromStatus:         BATCH_STATUS.DIRECTOR_REVIEW,
    toStatus:           BATCH_STATUS.APPROVED_BY_DIRECTOR,
    allowedRoles:       ["DIRECTEUR"],
    requiredPermission: "payroll.approve",
    requireReason:      false,
    labelAr:            "مصادقة المدير",
  },
  {
    action:             WORKFLOW_ACTIONS.RETURN_BY_DIRECTOR,
    fromStatus:         BATCH_STATUS.DIRECTOR_REVIEW,
    toStatus:           BATCH_STATUS.RETURNED_FOR_CORRECTION,
    allowedRoles:       ["DIRECTEUR"],
    requiredPermission: "payroll.approve",
    requireReason:      true,
    labelAr:            "إعادة للتصحيح من المدير",
  },

  // ── Comptable ─────────────────────────────────────────────────────────────────
  {
    action:             WORKFLOW_ACTIONS.TAKE_ACCOUNTING_REVIEW,
    fromStatus:         BATCH_STATUS.APPROVED_BY_DIRECTOR,
    toStatus:           BATCH_STATUS.ACCOUNTING_REVIEW,
    allowedRoles:       ["COMPTABLE"],
    requiredPermission: "accounting.review",
    requireReason:      false,
    labelAr:            "أخذ الدفعة للمراجعة المحاسبية",
  },
  {
    action:             WORKFLOW_ACTIONS.VALIDATE_ACCOUNTING,
    fromStatus:         BATCH_STATUS.ACCOUNTING_REVIEW,
    toStatus:           BATCH_STATUS.ACCOUNTING_VALIDATED,
    allowedRoles:       ["COMPTABLE"],
    requiredPermission: "accounting.validate",
    requireReason:      false,
    labelAr:            "المصادقة المحاسبية",
  },
  {
    action:             WORKFLOW_ACTIONS.RETURN_BY_ACCOUNTING,
    fromStatus:         BATCH_STATUS.ACCOUNTING_REVIEW,
    toStatus:           BATCH_STATUS.RETURNED_FOR_CORRECTION,
    allowedRoles:       ["COMPTABLE"],
    requiredPermission: "accounting.review",
    requireReason:      true,
    labelAr:            "إعادة للتصحيح من المحاسب",
  },

  // ── Contrôleur Financier ──────────────────────────────────────────────────────
  {
    action:             WORKFLOW_ACTIONS.TAKE_FINANCIAL_CONTROL,
    fromStatus:         BATCH_STATUS.ACCOUNTING_VALIDATED,
    toStatus:           BATCH_STATUS.FINANCIAL_CONTROL,
    allowedRoles:       ["CONTROLEUR_FINANCIER"],
    requiredPermission: "financial_control.review",
    requireReason:      false,
    labelAr:            "أخذ الدفعة للرقابة المالية",
  },
  {
    action:             WORKFLOW_ACTIONS.GRANT_FINANCIAL_VISA,
    fromStatus:         BATCH_STATUS.FINANCIAL_CONTROL,
    toStatus:           BATCH_STATUS.AUTHORIZED,
    allowedRoles:       ["CONTROLEUR_FINANCIER"],
    requiredPermission: "financial_control.visa",
    requireReason:      false,
    labelAr:            "منح التأشيرة المالية والترخيص للصرف",
  },
  {
    action:             WORKFLOW_ACTIONS.RETURN_BY_FINANCIAL,
    fromStatus:         BATCH_STATUS.FINANCIAL_CONTROL,
    toStatus:           BATCH_STATUS.RETURNED_FOR_CORRECTION,
    allowedRoles:       ["CONTROLEUR_FINANCIER"],
    requiredPermission: "financial_control.review",
    requireReason:      true,
    labelAr:            "إعادة للتصحيح من المراقب المالي",
  },

  // ── Phase 8 : Paiement ──────────────────────────────────────────────────────────────
  // AUTHORIZED → PAYMENT_PROCESSING (Comptable uniquement)
  {
    action:             WORKFLOW_ACTIONS.START_PAYMENT_PROCESSING,
    fromStatus:         BATCH_STATUS.AUTHORIZED,
    toStatus:           BATCH_STATUS.PAYMENT_PROCESSING,
    allowedRoles:       ["COMPTABLE"],
    requiredPermission: "payment.process",
    requireReason:      false,
    labelAr:            "إطلاق معالجة الدفع وتوليد الملف التقني",
  },

  // PAYMENT_PROCESSING → PAID (Comptable)
  {
    action:             WORKFLOW_ACTIONS.CONFIRM_PAYMENT,
    fromStatus:         BATCH_STATUS.PAYMENT_PROCESSING,
    toStatus:           BATCH_STATUS.PAID,
    allowedRoles:       ["COMPTABLE"],
    requiredPermission: "payment.confirm",
    requireReason:      false,
    labelAr:            "تأكيد تنفيذ الدفع المتحكّم فيه",
  },

  // PAID → CLOSED (Comptable ou Directeur)
  {
    action:             WORKFLOW_ACTIONS.CLOSE_BATCH,
    fromStatus:         BATCH_STATUS.PAID,
    toStatus:           BATCH_STATUS.CLOSED,
    allowedRoles:       ["COMPTABLE", "DIRECTEUR"],
    requiredPermission: "payment.close",
    requireReason:      false,
    labelAr:            "إقفال الدفعة بعد إتمام التسوية",
  },
];

/**
 * Cherche la définition d'une transition autorisée.
 * Retourne null si la transition est interdite.
 */
export function findTransition(
  action: string,
  currentStatus: string
): TransitionDefinition | null {
  return (
    ALLOWED_TRANSITIONS.find(
      (t) => t.action === action && t.fromStatus === currentStatus
    ) ?? null
  );
}

/**
 * Retourne toutes les transitions possibles depuis un statut donné.
 */
export function getAvailableTransitions(currentStatus: string): TransitionDefinition[] {
  return ALLOWED_TRANSITIONS.filter((t) => t.fromStatus === currentStatus);
}

/**
 * Retourne les transitions disponibles pour un rôle et un statut donnés.
 */
export function getTransitionsForRole(
  currentStatus: string,
  roleCode: string
): TransitionDefinition[] {
  return ALLOWED_TRANSITIONS.filter(
    (t) => t.fromStatus === currentStatus && t.allowedRoles.includes(roleCode as RoleCode)
  );
}
