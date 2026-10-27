/**
 * lib/payment/reconciliation-service.ts
 * Service de rapprochement des paiements — Phase 8 أكاديميا شفاف.
 *
 * Priorité de rapprochement :
 * 1. Référence de transaction (TX-...)
 * 2. Référence de l'ordre de paiement (OP-...)
 * 3. Matricule + montant (jamais le nom seul)
 */

import { Prisma } from "@prisma/client";
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import prisma from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit/logger";

export type ReconciliationStatus =
  | "MATCHED"
  | "UNMATCHED"
  | "AMOUNT_MISMATCH"
  | "FAILED"
  | "DUPLICATE"
  | "UNKNOWN_REFERENCE";

export interface ReconciliationEntry {
  reference?: string;
  matricule?: string;
  amount?: number;
  externalRef?: string;
  notes?: string;
}

export interface ReconciliationResult {
  matched: ReconciliationEntry[];
  unmatched: ReconciliationEntry[];
  amountMismatch: Array<ReconciliationEntry & { expectedAmount: number }>;
  failed: ReconciliationEntry[];
  duplicate: ReconciliationEntry[];
  unknownReference: ReconciliationEntry[];
  totalMatched: number;
  totalUnmatched: number;
  isFullyReconciled: boolean;
  notes: string;
}

/**
 * Reconcilie un retour bancaire ou une confirmation contre les transactions existantes.
 */
export async function reconcilePaymentOrder(
  paymentOrderId: string,
  userOrgId: string,
  reconciliationData: ReconciliationEntry[],
  userId: string
): Promise<ReconciliationResult> {
  // 1. Charger l'ordre de paiement
  const order = await prisma.paymentOrder.findUnique({
    where: { id: paymentOrderId },
    include: {
      batch: { select: { organizationId: true, label: true } },
      transactions: true,
    },
  });

  if (!order) throw new Error("أمر الدفع غير موجود.");
  if (order.batch.organizationId !== userOrgId) {
    throw new Error("ليس لديك صلاحية الوصول إلى هذا أمر الدفع.");
  }
  if (!["PROCESSING", "PAID"].includes(order.status)) {
    throw new Error(`لا يمكن المطابقة لأمر في الوضعية: ${order.status}.`);
  }

  const result: ReconciliationResult = {
    matched: [],
    unmatched: [],
    amountMismatch: [],
    failed: [],
    duplicate: [],
    unknownReference: [],
    totalMatched: 0,
    totalUnmatched: 0,
    isFullyReconciled: false,
    notes: "",
  };

  const matchedTxIds = new Set<string>();
  const seenRefs = new Set<string>();

  for (const entry of reconciliationData) {
    // Détection doublons dans les données de rapprochement
    const entryKey = entry.reference ?? entry.externalRef ?? JSON.stringify(entry);
    if (seenRefs.has(entryKey)) {
      result.duplicate.push(entry);
      continue;
    }
    seenRefs.add(entryKey);

    // Priorité 1 : référence de transaction
    let matchedTx = entry.reference
      ? order.transactions.find(tx => tx.reference === entry.reference)
      : undefined;

    // Priorité 2 : référence de l'ordre
    if (!matchedTx && entry.reference === order.reference) {
      // Rapprochement global de l'ordre
      if (entry.amount !== undefined) {
        const expectedDecimal = new Decimal(order.totalAmount);
        const receivedDecimal = new Decimal(entry.amount);
        if (!receivedDecimal.equals(expectedDecimal)) {
          result.amountMismatch.push({ ...entry, expectedAmount: Number(expectedDecimal) });
          continue;
        }
        result.matched.push(entry);
        result.totalMatched++;
        continue;
      }
    }

    // Priorité 3 : matricule (issu du snapshot immutable) + montant exact
    if (!matchedTx && entry.matricule && entry.amount !== undefined) {
      matchedTx = order.transactions.find(tx => {
        const txDecimal = new Decimal(tx.amount);
        const entryDecimal = new Decimal(entry.amount!);
        const sameAmount = txDecimal.equals(entryDecimal);
        const matchesMatricule = tx.snapshotMatricule
          ? tx.snapshotMatricule === entry.matricule
          : true;
        return sameAmount && matchesMatricule && !matchedTxIds.has(tx.id);
      });
    }

    if (!matchedTx) {
      result.unknownReference.push(entry);
      continue;
    }

    // Vérification que la transaction n'a pas déjà été rapprochée
    if (matchedTxIds.has(matchedTx.id)) {
      result.duplicate.push(entry);
      continue;
    }

    // Vérification du montant avec précision Decimal
    if (entry.amount !== undefined) {
      const expectedDecimal = new Decimal(matchedTx.amount);
      const receivedDecimal = new Decimal(entry.amount);
      if (!receivedDecimal.equals(expectedDecimal)) {
        result.amountMismatch.push({ ...entry, expectedAmount: Number(expectedDecimal) });
        continue;
      }
    }

    matchedTxIds.add(matchedTx.id);
    result.matched.push(entry);
    result.totalMatched++;
  }

  // Transactions non rapprochées
  for (const tx of order.transactions) {
    if (!matchedTxIds.has(tx.id)) {
      result.unmatched.push({ reference: tx.reference, amount: Number(tx.amount) });
      result.totalUnmatched++;
    }
  }

  result.isFullyReconciled =
    result.unmatched.length === 0 &&
    result.amountMismatch.length === 0 &&
    result.failed.length === 0 &&
    result.duplicate.length === 0;

  result.notes = result.isFullyReconciled
    ? `المطابقة مكتملة: ${result.totalMatched} حركة مطابقة بنجاح.`
    : `مطابقة جزئية: ${result.totalMatched} مطابق، ${result.totalUnmatched} غير مطابق.`;

  // Journaliser la tentative de rapprochement
  await recordAuditLog({
    userId,
    action: "PAYMENT_RECONCILED",
    resourceType: "PAYMENT_ORDER",
    resourceId: paymentOrderId,
    details: {
      matched: result.totalMatched,
      unmatched: result.totalUnmatched,
      amountMismatch: result.amountMismatch.length,
      isFullyReconciled: result.isFullyReconciled,
    },
  }).catch(() => {});

  // Machine d'état : si l'ordre est PAID et entièrement rapproché, transition vers RECONCILED
  const targetStatus = (order.status === "PAID" && result.isFullyReconciled)
    ? "RECONCILED"
    : order.status;

  // Mettre à jour le statut et les notes de rapprochement
  await prisma.paymentOrder.update({
    where: { id: paymentOrderId },
    data: {
      status: targetStatus,
      reconciliationNotes: result.notes,
      updatedAt: new Date(),
    },
  });

  return result;
}

/**
 * Vérifie si toutes les transactions d'un PaymentOrder sont dans un état acceptable
 * pour la transition vers PAID.
 */
export async function areAllTransactionsResolved(paymentOrderId: string): Promise<boolean> {
  const pendingCount = await prisma.paymentTransaction.count({
    where: { paymentOrderId, status: "PENDING" },
  });
  return pendingCount === 0;
}

/**
 * Calcule le total réel depuis la DB (source de vérité — jamais le client).
 */
export async function computeServerSideTotal(paymentOrderId: string): Promise<Decimal> {
  const txs = await prisma.paymentTransaction.findMany({
    where: { paymentOrderId },
    select: { amount: true },
  });
  return txs.reduce((sum, tx) => sum.plus(tx.amount as Decimal), new Decimal(0));
}

/**
 * Auto-rapprochement basé sur la liste exacte des transactions d'un ordre
 */
export async function autoReconcileFromTransactionList(
  paymentOrderId: string,
  userOrgId: string,
  userId: string
): Promise<ReconciliationResult> {
  const order = await prisma.paymentOrder.findUnique({
    where: { id: paymentOrderId },
    include: { transactions: true },
  });
  if (!order) throw new Error("أمر الدفع غير موجود.");
  const entries: ReconciliationEntry[] = order.transactions.map(tx => ({
    reference: tx.reference,
    amount: Number(tx.amount),
    externalRef: `AUTO-REC-${tx.id}`,
  }));
  return reconcilePaymentOrder(paymentOrderId, userOrgId, entries, userId);
}
