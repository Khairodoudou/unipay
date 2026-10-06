import prisma from "@/lib/db/prisma";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "SESSION_REVOKED"
  | "ACCOUNT_LOCKED"
  | "ACCESS_DENIED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_ROLE_CHANGED"
  | "USER_ENABLED"
  | "USER_DISABLED"
  | "USER_PASSWORD_RESET"
  | "ROLE_PERMISSIONS_UPDATED"
  | "ORGANIZATION_UPDATED"
  | "ORGANIZATION_UNIT_CREATED"
  | "ORGANIZATION_UNIT_UPDATED"
  | "SETTINGS_UPDATED"
  | "PAYROLL_RULE_CREATED"
  | "PAYROLL_RULE_UPDATED"
  | "PAYROLL_RULE_ACTIVATED"
  | "PAYROLL_RULE_DEACTIVATED"
  | "PAYROLL_RULE_VERSION_ADDED"
  // Phase 4 — Employee
  | "EMPLOYEE_CREATED"
  | "EMPLOYEE_UPDATED"
  | "EMPLOYEE_STATUS_CHANGED"
  | "EMPLOYEE_IMPORTED"
  // Phase 4 — Payroll Workflow
  | "PAYROLL_PERIOD_CREATED"
  | "PAYROLL_PERIOD_STATUS_CHANGED"
  | "PAYROLL_BATCH_CREATED"
  | "PAYROLL_BATCH_EMPLOYEES_UPDATED"
  | "PAYROLL_CALCULATED"
  | "PAYROLL_CORRECTED"
  | "PAYROLL_READY_FOR_REVIEW"
  | "ATTENDANCE_UPDATED"
  | "LINE_ITEMS_UPDATED";


export interface CreateAuditLogParams {
  userId?: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enregistre un événement dans le journal d'audit UNI-PAY.
 * RÈGLE DE SÉCURITÉ ABSOLUE : Ne jamais enregistrer de mot de passe ni de passwordHash.
 */
export async function recordAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    let detailsString: string | undefined = undefined;

    if (params.details) {
      if (typeof params.details === "string") {
        detailsString = params.details;
      } else {
        // Filtrer explicitement toute clé sensible par sécurité
        const sanitized = { ...params.details };
        delete (sanitized as Record<string, unknown>).password;
        delete (sanitized as Record<string, unknown>).passwordHash;
        delete (sanitized as Record<string, unknown>).newPassword;
        delete (sanitized as Record<string, unknown>).confirmPassword;
        delete (sanitized as Record<string, unknown>).token;
        delete (sanitized as Record<string, unknown>).secret;
        detailsString = JSON.stringify(sanitized);
      }
    }


    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resourceType: params.resourceType || "AUTH",
        resourceId: params.resourceId || null,
        details: detailsString,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Les erreurs d'audit ne doivent jamais bloquer la suite de l'application mais sont journalisées
    console.error("[AUDIT_LOG_ERROR] Impossible d'enregistrer l'audit log :", error);
  }
}
