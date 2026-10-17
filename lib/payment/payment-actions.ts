"use server";

/**
 * lib/payment/payment-actions.ts
 * Server Actions Phase 8 — exposées aux pages Comptable.
 * Toutes les mutations passent par payment-service.ts.
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  startPaymentProcessingService,
  confirmPaymentService,
  closeBatchService,
  markPaymentOrderFailedService,
  retryPaymentProcessingService,
} from "./payment-service";
import { validatePaymentPreflight } from "./payment-validation";
import { getCurrentUser } from "@/lib/rbac/guards";
import type { PaymentServiceResult } from "./payment-service";

// ── Schémas Zod ───────────────────────────────────────────────────────────────

const batchIdSchema = z.object({
  batchId: z.string().cuid("معرف الدفعة غير صالح."),
});

const failPaymentSchema = z.object({
  batchId:       z.string().cuid("معرف الدفعة غير صالح."),
  failureReason: z.string().min(3, "سبب الفشل يجب أن يحتوي على 3 أحرف على الأقل.").max(500).trim(),
});

const confirmPaymentSchema = z.object({
  batchId:        z.string().cuid("معرف الدفعة غير صالح."),
  confirmationRef: z.string()
    .min(3, "مرجع التأكيد يجب أن يحتوي على 3 أحرف كحد أدنى.")
    .max(100, "مرجع التأكيد طويل جداً.")
    .trim(),
  notes: z.string().max(500).optional(),
});

const closeBatchSchema = z.object({
  batchId: z.string().cuid("معرف الدفعة غير صالح."),
  notes:   z.string().max(500).optional(),
});

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Validation pré-paiement sans démarrer le traitement.
 * Utilisé par l'UI pour afficher le rapport avant confirmation.
 */
export async function preflightPaymentAction(batchId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول." };
  if (!["COMPTABLE", "ADMIN"].includes(user.roleCode)) {
    return { success: false, error: "غير مصرح." };
  }

  const parsed = batchIdSchema.safeParse({ batchId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const preflight = await validatePaymentPreflight(batchId, user.organizationId);
  return { success: true, data: preflight };
}

/**
 * Démarre le traitement du paiement : AUTHORIZED → PAYMENT_PROCESSING.
 * Crée le PaymentOrder + PaymentTransactions + fichier générique.
 */
export async function startPaymentProcessingAction(batchId: string): Promise<PaymentServiceResult> {
  const parsed = batchIdSchema.safeParse({ batchId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const result = await startPaymentProcessingService(batchId);

  if (result.success) {
    revalidatePath("/comptable", "layout");
    revalidatePath(`/comptable/payment`);
    revalidatePath(`/comptable/batches/${batchId}`);
    revalidatePath(`/directeur`, "layout");
    revalidatePath(`/controle-financier`, "layout");
  }

  return result;
}

/**
 * Confirme l'exécution contrôlée du paiement : PAYMENT_PROCESSING → PAID.
 * Mode MANUAL_CONTROLLED — aucune banque réelle.
 */
export async function confirmPaymentAction(input: {
  batchId: string;
  confirmationRef: string;
  notes?: string;
}): Promise<PaymentServiceResult> {
  const parsed = confirmPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const result = await confirmPaymentService(
    parsed.data.batchId,
    parsed.data.confirmationRef,
    parsed.data.notes
  );

  if (result.success) {
    revalidatePath("/comptable", "layout");
    revalidatePath(`/comptable/payment`);
    revalidatePath(`/comptable/batches/${parsed.data.batchId}`);
    revalidatePath(`/directeur`, "layout");
  }

  return result;
}

/**
 * Clôture définitive du lot : PAID → CLOSED.
 */
export async function closeBatchAction(input: {
  batchId: string;
  notes?: string;
}): Promise<PaymentServiceResult> {
  const parsed = closeBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const result = await closeBatchService(parsed.data.batchId, parsed.data.notes);

  if (result.success) {
    revalidatePath("/comptable", "layout");
    revalidatePath(`/comptable/payment`);
    revalidatePath(`/comptable/batches/${parsed.data.batchId}`);
    revalidatePath(`/directeur`, "layout");
  }

  return result;
}

/**
 * Enregistre l'échec d'un ordre de paiement : PROCESSING → FAILED.
 */
export async function markPaymentOrderFailedAction(input: {
  batchId: string;
  failureReason: string;
}): Promise<PaymentServiceResult> {
  const parsed = failPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const result = await markPaymentOrderFailedService(
    parsed.data.batchId,
    parsed.data.failureReason
  );

  if (result.success) {
    revalidatePath("/comptable", "layout");
    revalidatePath(`/comptable/payment`);
    revalidatePath(`/comptable/batches/${parsed.data.batchId}`);
  }

  return result;
}

/**
 * Réessaye l'exécution d'un ordre de paiement FAILED : FAILED → PROCESSING.
 */
export async function retryPaymentProcessingAction(batchId: string): Promise<PaymentServiceResult> {
  const parsed = batchIdSchema.safeParse({ batchId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const result = await retryPaymentProcessingService(batchId);

  if (result.success) {
    revalidatePath("/comptable", "layout");
    revalidatePath(`/comptable/payment`);
    revalidatePath(`/comptable/batches/${batchId}`);
  }

  return result;
}
