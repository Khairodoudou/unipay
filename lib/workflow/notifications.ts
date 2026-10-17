/**
 * lib/workflow/notifications.ts
 * Helpers pour créer les notifications liées aux transitions workflow.
 * Server-only. Ne jamais importer côté client.
 */

import prisma from "@/lib/db/prisma";
import { RoleCode } from "@/lib/rbac/roles";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface WorkflowNotificationPayload {
  type: string;
  titleAr: string;
  messageAr: string;
  link?: string;
}

/**
 * Notifie tous les utilisateurs actifs d'un rôle donné dans la même organisation.
 */
async function notifyRoleInOrg(
  orgId: string,
  roleCode: RoleCode,
  payload: WorkflowNotificationPayload,
  tx?: TransactionClient
): Promise<void> {
  const db = tx ?? prisma;
  const targets = await db.user.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      role: { code: roleCode },
    },
    select: { id: true },
  });

  if (targets.length === 0) return;

  await db.notification.createMany({
    data: targets.map((u: { id: string }) => ({
      userId:    u.id,
      type:      payload.type,
      titleAr:   payload.titleAr,
      messageAr: payload.messageAr,
      link:      payload.link ?? null,
    })),
  });
}

/**
 * Notifie un utilisateur spécifique.
 */
async function notifyUser(
  userId: string,
  payload: WorkflowNotificationPayload,
  tx?: TransactionClient
): Promise<void> {
  const db = tx ?? prisma;
  await db.notification.create({
    data: {
      userId:    userId,
      type:      payload.type,
      titleAr:   payload.titleAr,
      messageAr: payload.messageAr,
      link:      payload.link ?? null,
    },
  });
}

/**
 * Crée les notifications appropriées selon l'action workflow réalisée.
 */
export async function createWorkflowNotifications(params: {
  action: string;
  batchId: string;
  batchLabel: string;
  orgId: string;
  actorId?: string;
  reason?: string | null;
  tx?: TransactionClient;
}): Promise<void> {
  const { action, batchId, batchLabel, orgId, reason, tx } = params;

  const db = tx ?? prisma;

  try {
    switch (action) {
      case "SUBMIT_TO_CHEF":
        await notifyRoleInOrg(orgId, "CHEF_SERVICE", {
          type:      "BATCH_SUBMITTED",
          titleAr:   "دفعة أجور جديدة تنتظر مراجعتك",
          messageAr: `تم إرسال الدفعة "${batchLabel}" إليك للمراجعة الأولية.`,
          link:      `/chef/batches/${batchId}`,
        }, tx);
        break;

      case "APPROVE_CHEF":
        await notifyRoleInOrg(orgId, "DIRECTEUR", {
          type:      "BATCH_APPROVED",
          titleAr:   "دفعة أجور بانتظار موافقتك",
          messageAr: `الدفعة "${batchLabel}" صادق عليها رئيس المصلحة وتنتظر مصادقتك.`,
          link:      `/directeur/batches/${batchId}`,
        }, tx);
        break;

      case "RETURN_BY_CHEF": {
        // Notifier le créateur du batch (Agent RH)
        const batch = await db.payrollBatch.findUnique({
          where: { id: batchId },
          select: { createdBy: true, submittedBy: true },
        });
        const agentId = batch?.submittedBy ?? batch?.createdBy;
        if (agentId) {
          await notifyUser(agentId, {
            type:      "BATCH_RETURNED",
            titleAr:   "دفعة أجور مُعادة للتصحيح",
            messageAr: `الدفعة "${batchLabel}" أُعيدت من رئيس المصلحة. السبب: ${reason ?? "غير محدد"}`,
            link:      `/agent/batches/${batchId}`,
          }, tx);
        }
        break;
      }

      case "APPROVE_DIRECTOR":
        await notifyRoleInOrg(orgId, "COMPTABLE", {
          type:      "BATCH_APPROVED",
          titleAr:   "دفعة أجور بانتظار مراجعتك المحاسبية",
          messageAr: `الدفعة "${batchLabel}" صادق عليها المدير وتنتظر مراجعتك المحاسبية.`,
          link:      `/comptable/batches/${batchId}`,
        }, tx);
        break;

      case "RETURN_BY_DIRECTOR": {
        const batch = await db.payrollBatch.findUnique({
          where: { id: batchId },
          select: { createdBy: true, submittedBy: true },
        });
        const agentId = batch?.submittedBy ?? batch?.createdBy;
        if (agentId) {
          await notifyUser(agentId, {
            type:      "BATCH_RETURNED",
            titleAr:   "دفعة أجور مُعادة للتصحيح",
            messageAr: `الدفعة "${batchLabel}" أُعيدت من المدير. السبب: ${reason ?? "غير محدد"}`,
            link:      `/agent/batches/${batchId}`,
          }, tx);
        }
        break;
      }

      case "VALIDATE_ACCOUNTING":
        await notifyRoleInOrg(orgId, "CONTROLEUR_FINANCIER", {
          type:      "BATCH_APPROVED",
          titleAr:   "دفعة أجور بانتظار الرقابة المالية",
          messageAr: `الدفعة "${batchLabel}" صُودق عليها محاسبياً وتنتظر التأشيرة المالية.`,
          link:      `/controle-financier/batches/${batchId}`,
        }, tx);
        break;

      case "RETURN_BY_ACCOUNTING": {
        const batch = await db.payrollBatch.findUnique({
          where: { id: batchId },
          select: { createdBy: true, submittedBy: true },
        });
        const agentId = batch?.submittedBy ?? batch?.createdBy;
        if (agentId) {
          await notifyUser(agentId, {
            type:      "BATCH_RETURNED",
            titleAr:   "دفعة أجور مُعادة للتصحيح",
            messageAr: `الدفعة "${batchLabel}" أُعيدت من المحاسب. السبب: ${reason ?? "غير محدد"}`,
            link:      `/agent/batches/${batchId}`,
          }, tx);
        }
        break;
      }

      case "GRANT_FINANCIAL_VISA": {
        // Notifier l'agent et les rôles concernés
        const batch = await db.payrollBatch.findUnique({
          where: { id: batchId },
          select: { createdBy: true, submittedBy: true },
        });
        const agentId = batch?.submittedBy ?? batch?.createdBy;
        if (agentId) {
          await notifyUser(agentId, {
            type:      "PAYMENT_AUTHORIZED",
            titleAr:   "الدفعة مرخصة للصرف",
            messageAr: `الدفعة "${batchLabel}" حصلت على التأشيرة المالية وأصبحت مرخصة للصرف.`,
            link:      `/agent/batches/${batchId}`,
          }, tx);
        }
        // Notifier également le Directeur et le Comptable
        await notifyRoleInOrg(orgId, "DIRECTEUR", {
          type:      "PAYMENT_AUTHORIZED",
          titleAr:   "دفعة أجور مرخصة للصرف",
          messageAr: `الدفعة "${batchLabel}" حصلت على التأشيرة المالية النهائية.`,
          link:      `/directeur/batches/${batchId}`,
        }, tx);

        // ── Phase 7 : Notifications personnelles des employés (PAYSLIP_AVAILABLE) ──
        const records = await db.payrollRecord.findMany({
          where: { batchId },
          select: {
            id: true,
            employee: {
              select: {
                user: {
                  select: { id: true },
                },
              },
            },
          },
        });

        for (const rec of records) {
          const empUserId = rec.employee.user?.id;
          if (empUserId) {
            const payslipLink = `/employe/payslips/${rec.id}`;
            const existingNotif = await db.notification.findFirst({
              where: {
                userId: empUserId,
                type: "PAYSLIP_AVAILABLE",
                link: payslipLink,
              },
            });

            if (!existingNotif) {
              await notifyUser(
                empUserId,
                {
                  type:      "PAYSLIP_AVAILABLE",
                  titleAr:   "كشف الراتب متاح",
                  messageAr: `أصبح كشف راتبك لفترة "${batchLabel}" متاحاً الآن للاطلاع والتحميل.`,
                  link:      payslipLink,
                },
                tx
              );
            }
          }
        }
        break;
      }

      case "RETURN_BY_FINANCIAL": {
        const batch = await db.payrollBatch.findUnique({
          where: { id: batchId },
          select: { createdBy: true, submittedBy: true },
        });
        const agentId = batch?.submittedBy ?? batch?.createdBy;
        if (agentId) {
          await notifyUser(agentId, {
            type:      "BATCH_RETURNED",
            titleAr:   "دفعة أجور مُعادة للتصحيح",
            messageAr: `الدفعة "${batchLabel}" أُعيدت من المراقب المالي. السبب: ${reason ?? "غير محدد"}`,
            link:      `/agent/batches/${batchId}`,
          }, tx);
        }
        break;
      }

      default:
        break;

      // ── Phase 8 : Paiement ─────────────────────────────────────────────────
      case "START_PAYMENT_PROCESSING": {
        // Notifier Directeur + Contrôleur que le paiement est en cours
        await notifyRoleInOrg(orgId, "DIRECTEUR", {
          type:      "PAYMENT_PROCESSING",
          titleAr:   "جاري معالجة الدفع",
          messageAr: `بدأ المحاسب معالجة دفعة الأجور \"${batchLabel}\".`,
          link:      `/directeur/batches/${batchId}`,
        }, tx);
        await notifyRoleInOrg(orgId, "CONTROLEUR_FINANCIER", {
          type:      "PAYMENT_PROCESSING",
          titleAr:   "جاري معالجة الدفع",
          messageAr: `بدأت معالجة دفعة الأجور \"${batchLabel}\" التي حصلت على التأشيرة المالية.`,
          link:      `/controle-financier/batches/${batchId}`,
        }, tx);
        break;
      }

      case "CONFIRM_PAYMENT": {
        // Notifier Directeur + Contrôleur + Comptable
        await notifyRoleInOrg(orgId, "DIRECTEUR", {
          type:      "PAYMENT_PAID",
          titleAr:   "الدفعة مُنفَّذة — مدفوع",
          messageAr: `تم تأكيد تنفيذ دفعة الأجور \"${batchLabel}\" بشكل مُتحكَّم فيه.`,
          link:      `/directeur/batches/${batchId}`,
        }, tx);
        await notifyRoleInOrg(orgId, "CONTROLEUR_FINANCIER", {
          type:      "PAYMENT_PAID",
          titleAr:   "الدفعة مُنفَّذة — مدفوع",
          messageAr: `تم تأكيد تنفيذ دفعة الأجور \"${batchLabel}\".`,
          link:      `/controle-financier/batches/${batchId}`,
        }, tx);
        // Notifier l'agent RH
        const batchDataConf = await db.payrollBatch.findUnique({
          where: { id: batchId },
          select: { submittedBy: true, createdBy: true },
        });
        const agentConfId = batchDataConf?.submittedBy ?? batchDataConf?.createdBy;
        if (agentConfId) {
          await notifyUser(agentConfId, {
            type:      "PAYMENT_PAID",
            titleAr:   "الدفعة مُنفَّذة — مدفوع",
            messageAr: `تم تأكيد تنفيذ دفعة الأجور \"${batchLabel}\" بنجاح.`,
            link:      `/agent/batches/${batchId}`,
          }, tx);
        }
        break;
      }

      case "CLOSE_BATCH": {
        await notifyRoleInOrg(orgId, "DIRECTEUR", {
          type:      "PAYMENT_CLOSED",
          titleAr:   "الدفعة مُقفلة",
          messageAr: `تم إقفال دفعة الأجور \"${batchLabel}\" بشكل نهائي بعد التسوية.`,
          link:      `/directeur/batches/${batchId}`,
        }, tx);
        await notifyRoleInOrg(orgId, "CONTROLEUR_FINANCIER", {
          type:      "PAYMENT_CLOSED",
          titleAr:   "الدفعة مُقفلة",
          messageAr: `تم إقفال دفعة الأجور \"${batchLabel}\" بعد إتمام التسوية.`,
          link:      `/controle-financier/batches/${batchId}`,
        }, tx);
        const batchDataClose = await db.payrollBatch.findUnique({
          where: { id: batchId },
          select: { submittedBy: true, createdBy: true },
        });
        const agentCloseId = batchDataClose?.submittedBy ?? batchDataClose?.createdBy;
        if (agentCloseId) {
          await notifyUser(agentCloseId, {
            type:      "PAYMENT_CLOSED",
            titleAr:   "الدفعة مُقفلة",
            messageAr: `دفعة الأجور \"${batchLabel}\" أُقفلت نهائياً.`,
            link:      `/agent/batches/${batchId}`,
          }, tx);
        }
        break;
      }
    }
  } catch (err) {
    // Les erreurs de notification ne doivent pas bloquer le workflow
    console.error("[WORKFLOW_NOTIFICATION_ERROR]", err);
  }
}
