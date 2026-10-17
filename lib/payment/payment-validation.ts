/**
 * lib/payment/payment-validation.ts
 * Validation pré-paiement (Pre-Flight) côté serveur.
 *
 * RÈGLES ABSOLUES :
 * - Toutes les données viennent de la DB, jamais du client.
 * - RIB toujours masqué dans les erreurs/logs.
 * - Le serveur recalcule les totaux — aucune confiance au frontend.
 * - Cette validation est obligatoire avant toute transition AUTHORIZED → PAYMENT_PROCESSING.
 */

import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/db/prisma";

export interface PaymentValidationResult {
  valid: boolean;
  totalAmount: number;
  employeeCount: number;
  batchLabel: string;
  errors: string[];
  warnings: string[];
  missingRibs: string[];    // matricules (jamais RIB complet)
  invalidRibs: string[];    // matricules avec RIB structurellement invalide
  duplicateRibs: string[];  // matricules partageant un RIB dans ce lot
  invalidAmounts: string[]; // matricules avec montant net invalide
  inconsistencies: string[];
}

/**
 * Masque un RIB : retourne uniquement les 4 derniers chiffres.
 */
export function maskRib(rib: string): string {
  if (rib.length <= 4) return "****";
  return `****${rib.slice(-4)}`;
}

/**
 * Valide la structure d'un RIB (format algérien : 20 chiffres).
 * NE PAS prétendre vérifier qu'un compte est actif sans intégration bancaire réelle.
 */
function isRibStructurallyValid(rib: string): boolean {
  // RIB algérien : 20 chiffres numériques
  return /^\d{20}$/.test(rib.trim());
}

/**
 * Validation Pre-Flight complète avant le lancement du paiement.
 * Doit être appelée DANS une transaction si l'on veut garantir la cohérence.
 */
export async function validatePaymentPreflight(
  batchId: string,
  userOrgId: string,
  options?: { allowFailedRetry?: boolean }
): Promise<PaymentValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRibs: string[] = [];
  const invalidRibs: string[] = [];
  const duplicateRibs: string[] = [];
  const invalidAmounts: string[] = [];
  const inconsistencies: string[] = [];

  // ── 1. Récupérer le batch complet ────────────────────────────────────────
  const batch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    include: {
      period: { select: { label: true, year: true, month: true } },
      records: {
        include: {
          employee: {
            select: {
              id: true,
              matricule: true,
              firstName: true,
              lastName: true,
              rib: true,
              bankName: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!batch) {
    errors.push("الدفعة غير موجودة.");
    return {
      valid: false, totalAmount: 0, employeeCount: 0, batchLabel: "",
      errors, warnings, missingRibs, invalidRibs, duplicateRibs, invalidAmounts, inconsistencies,
    };
  }

  const batchLabel = batch.label ?? batch.period?.label ?? batchId;

  // ── 2. Vérification de l'organisation (multi-tenancy) ────────────────────
  if (batch.organizationId && batch.organizationId !== userOrgId) {
    errors.push("ليس لديك صلاحية الوصول إلى هذه الدفعة (نطاق مؤسسي مختلف).");
    return {
      valid: false, totalAmount: 0, employeeCount: 0, batchLabel,
      errors, warnings, missingRibs, invalidRibs, duplicateRibs, invalidAmounts, inconsistencies,
    };
  }

  // ── 3. Vérification du statut ─────────────────────────────────────────────
  // En mode retry d'un ordre FAILED, le batch est en PAYMENT_PROCESSING
  const expectedBatchStatuses = options?.allowFailedRetry
    ? ["AUTHORIZED", "PAYMENT_PROCESSING"]
    : ["AUTHORIZED"];

  if (!expectedBatchStatuses.includes(batch.status)) {
    errors.push(`الدفعة ليست في حالة AUTHORIZED (الوضعية الحالية: ${batch.status}).`);
    return {
      valid: false, totalAmount: 0, employeeCount: 0, batchLabel,
      errors, warnings, missingRibs, invalidRibs, duplicateRibs, invalidAmounts, inconsistencies,
    };
  }

  // ── 4. Vérifier qu'un PaymentOrder n'existe pas déjà (idempotence) ────────
  const existingOrder = await prisma.paymentOrder.findUnique({ where: { batchId } });
  if (existingOrder) {
    const isRetryAllowed = options?.allowFailedRetry === true && existingOrder.status === "FAILED";
    if (!isRetryAllowed) {
      errors.push(`أمر الدفع موجود بالفعل لهذه الدفعة (الرقم المرجعي: ${existingOrder.reference} — الحالة: ${existingOrder.status}).`);
      return {
        valid: false, totalAmount: 0, employeeCount: batch.records.length, batchLabel,
        errors, warnings, missingRibs, invalidRibs, duplicateRibs, invalidAmounts, inconsistencies,
      };
    }
  }

  // ── 5. Vérifier la présence d'enregistrements ─────────────────────────────
  if (batch.records.length === 0) {
    errors.push("الدفعة لا تحتوي على أي سجلات رواتب. يجب حساب الرواتب أولاً.");
    return {
      valid: false, totalAmount: 0, employeeCount: 0, batchLabel,
      errors, warnings, missingRibs, invalidRibs, duplicateRibs, invalidAmounts, inconsistencies,
    };
  }

  // ── 6. Analyse de chaque PayrollRecord ───────────────────────────────────
  let computedTotal = new Decimal(0);
  const ribsSeen = new Map<string, string[]>(); // rib → [matricules]

  for (const record of batch.records) {
    const emp = record.employee;
    const mat = record.snapshotMatricule;

    // 6a. Cohérence Employee ↔ PayrollRecord
    if (!emp) {
      inconsistencies.push(`السجل ${record.id} لا يرتبط بأي موظف.`);
      errors.push(`سجل الراتب غير مرتبط بموظف: ${mat}`);
      continue;
    }

    // 6b. Statut employé actif
    if (emp.status !== "ACTIVE") {
      warnings.push(`الموظف ${mat} ليس في حالة ACTIVE (${emp.status}). تحقق من صحة الاشتمال.`);
    }

    // 6c. RIB manquant
    if (!emp.rib || emp.rib.trim() === "") {
      missingRibs.push(mat);
      errors.push(`الموظف ${mat} لا يملك RIB مسجلاً. لا يمكن تنفيذ الدفع.`);
      continue;
    }

    // 6d. Validation structurelle du RIB
    const cleanRib = emp.rib.trim();
    if (!isRibStructurallyValid(cleanRib)) {
      invalidRibs.push(mat);
      errors.push(`RIB الموظف ${mat} غير صالح هيكلياً (${maskRib(cleanRib)}).`);
      continue;
    }

    // 6e. Détection des doublons de RIB dans le lot
    const existing = ribsSeen.get(cleanRib) ?? [];
    existing.push(mat);
    ribsSeen.set(cleanRib, existing);

    // 6f. Validation du montant net
    const net = Number(record.netAmount);
    if (isNaN(net) || net <= 0) {
      invalidAmounts.push(mat);
      errors.push(`الموظف ${mat} لديه مبلغ صافي غير صالح (${net} د.ج).`);
      continue;
    }

    if (net > 10_000_000) {
      warnings.push(`الموظف ${mat} لديه مبلغ صافي مرتفع جداً (${net.toFixed(2)} د.ج). تحقق من صحة البيانات.`);
    }

    computedTotal = computedTotal.plus(record.netAmount as Decimal);
  }

  // ── 7. Détection doublons de RIB ─────────────────────────────────────────
  for (const [rib, mats] of ribsSeen.entries()) {
    if (mats.length > 1) {
      const maskedRib = maskRib(rib);
      duplicateRibs.push(...mats);
      errors.push(`RIB مكرر (${maskedRib}) مشترك بين الموظفين: ${mats.join(", ")}. يجب تصحيح البيانات قبل الدفع.`);
    }
  }

  // ── 8. Vérification du total calculé ─────────────────────────────────────
  const totalAmount = Number(computedTotal);

  if (totalAmount <= 0) {
    errors.push(`المجموع الكلي للمبالغ غير صالح (${totalAmount.toFixed(2)} د.ج).`);
  }

  // ── 9. Résultat final ─────────────────────────────────────────────────────
  const valid =
    errors.length === 0 &&
    missingRibs.length === 0 &&
    invalidRibs.length === 0 &&
    duplicateRibs.length === 0 &&
    invalidAmounts.length === 0 &&
    inconsistencies.length === 0 &&
    totalAmount > 0;

  return {
    valid,
    totalAmount,
    employeeCount: batch.records.length,
    batchLabel,
    errors,
    warnings,
    missingRibs,
    invalidRibs,
    duplicateRibs,
    invalidAmounts,
    inconsistencies,
  };
}
