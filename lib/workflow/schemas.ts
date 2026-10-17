/**
 * lib/workflow/schemas.ts
 * Zod schemas pour toutes les Server Actions du workflow Phase 6.
 */

import { z } from "zod";

export const executeTransitionSchema = z.object({
  batchId: z.string().min(1, "معرّف الدفعة مطلوب"),
  action:  z.string().min(1, "الإجراء مطلوب"),
  reason:  z.string().optional(),
});

/** Schema pour les retours (raison obligatoire, min 10 chars utiles) */
export const returnTransitionSchema = z.object({
  batchId: z.string().min(1, "معرّف الدفعة مطلوب"),
  action:  z.string().min(1, "الإجراء مطلوب"),
  reason:  z.string().trim().min(10, "يجب تقديم سبب مفصّل (10 أحرف على الأقل)"),
});

/** Schema pour marquer notification comme lue */
export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1),
});

export type ExecuteTransitionInput = z.infer<typeof executeTransitionSchema>;
export type ReturnTransitionInput   = z.infer<typeof returnTransitionSchema>;
