/**
 * lib/payment/bank-file-service.ts
 *
 * Service de génération du fichier technique générique d'export de paiement.
 *
 * AVERTISSEMENT LÉGAL OBLIGATOIRE :
 * "Export technique générique أكاديميا شفاف — non présenté comme format bancaire officiel."
 *
 * Ce fichier est un export CSV structuré de type GENERIC_BANK_TRANSFER.
 * Il n'implémente PAS :
 * - CIB / Edahabia / SATIM / SWIFT / SEPA
 * - Aucune connexion bancaire réelle
 * - Aucun format bancaire officiel algérien
 *
 * Le fichier est confidentiel, généré côté serveur uniquement,
 * jamais stocké dans /public, jamais accessible sans authentification.
 */

import { createHash } from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/db/prisma";
import { maskRib } from "./payment-validation";

export interface BankFileResult {
  content: string;       // Contenu CSV brut
  fileName: string;      // Nom du fichier
  fileHash: string;      // SHA-256 hex digest
  fileSize: number;      // Taille en octets
  rowCount: number;      // Nombre de lignes de données (hors header)
  totalAmount: number;   // Total calculé côté serveur
}

/**
 * Génère le fichier CSV technique générique GENERIC_BANK_TRANSFER.
 * Le RIB complet est inclus uniquement dans le contenu du fichier
 * (car c'est sa raison d'être technique), mais JAMAIS dans les logs.
 *
 * Utilise en priorité absolue le SNAPSHOT IMMUTABLE scellé dans PaymentTransaction
 * (ribSnapshot, snapshotMatricule, snapshotName), garantissant qu'aucune
 * modification ultérieure sur l'employé n'altère l'intégrité du fichier ni son hash SHA-256.
 */
export async function generateBankFile(
  paymentOrderId: string,
  userOrgId: string
): Promise<BankFileResult> {
  // 1. Récupérer l'ordre de paiement + transactions + batch + employés
  const order = await prisma.paymentOrder.findUnique({
    where: { id: paymentOrderId },
    include: {
      batch: {
        include: {
          period: { select: { label: true, year: true, month: true } },
        },
      },
      transactions: {
        include: {
          employee: {
            select: { id: true, matricule: true, firstName: true, lastName: true, rib: true },
          },
          payrollRecord: {
            select: { netAmount: true, snapshotMatricule: true, snapshotName: true },
          },
        },
        orderBy: { reference: "asc" },
      },
    },
  });

  if (!order) throw new Error("أمر الدفع غير موجود.");
  if (!order.batch.organizationId || order.batch.organizationId !== userOrgId) {
    throw new Error("ليس لديك صلاحية الوصول إلى هذا الملف.");
  }
  if (!["PROCESSING", "PAID", "RECONCILED", "CLOSED"].includes(order.status)) {
    throw new Error(`لا يمكن توليد الملف لأمر دفع في الوضعية: ${order.status}.`);
  }

  const org = order.batch.organizationId
    ? await prisma.organization.findUnique({
        where: { id: order.batch.organizationId },
        select: { name: true, code: true },
      })
    : null;

  const period = order.batch.period;
  const periodLabel = period?.label ?? `${period?.year ?? ""}/${period?.month ?? ""}`;
  const orgName = org?.name ?? "أكاديميا شفاف";
  const orgCode = org?.code ?? "ORG";

  const orderDateStr = (order.processingStartedAt ?? order.createdAt).toISOString();
  const fileDateStamp = (order.processingStartedAt ?? order.createdAt).toISOString().slice(0, 10).replace(/-/g, "");

  // 2. En-tête du fichier avec avertissement légal
  const disclaimer = [
    "# ============================================================",
    "# EXPORT TECHNIQUE GÉNÉRIQUE أكاديميا شفاف",
    "# NON PRÉSENTÉ COMME FORMAT BANCAIRE OFFICIEL",
    "# Format: GENERIC_BANK_TRANSFER / CSV",
    `# Organisation: ${orgName} (${orgCode})`,
    `# Période: ${periodLabel}`,
    `# Ordre de paiement: ${order.reference}`,
    `# Date génération: ${orderDateStr}`,
    `# Nombre d'employés: ${order.transactions.length}`,
    `# Montant total: ${new Decimal(order.totalAmount).toFixed(2)} DZD`,
    "# ============================================================",
    "# AVERTISSEMENT: Ce fichier est confidentiel.",
    "# Il doit être traité par un processus bancaire autorisé.",
    "# أكاديميا شفاف ne prétend effectuer aucun virement bancaire réel.",
    "# ============================================================",
  ].join("\n");

  // 3. En-tête CSV
  const csvHeader = "REF_VIREMENT,MATRICULE,NOM_PRENOM,RIB,MONTANT,DEVISE,MOTIF";

  // 4. Lignes de données calculées avec précision Decimal
  let computedTotal = new Decimal(0);
  const csvRows: string[] = [];

  for (const tx of order.transactions) {
    const emp = tx.employee;
    const rec = tx.payrollRecord;

    // Source de vérité immuable : le snapshot capturé à l'émission de l'ordre
    const ribComplet = (tx.ribSnapshot ?? emp.rib)?.trim() ?? "";
    if (!ribComplet) {
      throw new Error(`الموظف ${emp.matricule} لا يملك RIB. يجب إعادة التحقق قبل توليد الملف.`);
    }

    const matricule = tx.snapshotMatricule ?? rec?.snapshotMatricule ?? emp.matricule;
    const rawNom = tx.snapshotName ?? rec?.snapshotName ?? `${emp.firstName} ${emp.lastName}`;
    const nomPrenom = rawNom.replace(/,/g, " ").replace(/"/g, "'");

    const txAmount = new Decimal(tx.amount ?? rec.netAmount);
    computedTotal = computedTotal.plus(txAmount);

    const currency = tx.currency || "DZD";
    const motif = `SALAIRE ${periodLabel}`.replace(/,/g, " ");

    csvRows.push(
      `${tx.reference},${matricule},"${nomPrenom}",${ribComplet},${txAmount.toFixed(2)},${currency},"${motif}"`
    );
  }

  // 5. Pied de fichier avec total de contrôle en Decimal
  const footer = [
    "# ============================================================",
    `# TOTAL CONTRÔLE: ${computedTotal.toFixed(2)} DZD`,
    `# NOMBRE VIREMENTS: ${csvRows.length}`,
    "# FIN DU FICHIER",
    "# ============================================================",
  ].join("\n");

  const content = [disclaimer, csvHeader, ...csvRows, footer].join("\n");

  // 6. Calcul SHA-256
  const fileHash = createHash("sha256").update(content, "utf8").digest("hex");
  const fileBuffer = Buffer.from(content, "utf8");
  const fileSize = fileBuffer.length;

  // 7. Nom de fichier
  const safeRef = order.reference.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `UNIPAY_GENERIC_TRANSFER_${safeRef}_${fileDateStamp}.csv`;

  return {
    content,
    fileName,
    fileHash,
    fileSize,
    rowCount: csvRows.length,
    totalAmount: Number(computedTotal),
  };
}

/**
 * Vérifie l'intégrité d'un fichier en comparant son hash SHA-256.
 */
export function verifyFileIntegrity(content: string, expectedHash: string): boolean {
  const actualHash = createHash("sha256").update(content, "utf8").digest("hex");
  return actualHash === expectedHash;
}

/**
 * Génère et persiste les métadonnées du fichier dans PaymentOrder.
 */
export async function generateAndPersistBankFile(
  paymentOrderId: string,
  userOrgId: string
): Promise<BankFileResult> {
  const result = await generateBankFile(paymentOrderId, userOrgId);

  // Persister le hash et métadonnées dans PaymentOrder
  await prisma.paymentOrder.update({
    where: { id: paymentOrderId },
    data: {
      fileName: result.fileName,
      fileHash: result.fileHash,
      fileSize: result.fileSize,
      updatedAt: new Date(),
    },
  });

  return result;
}

/**
 * Masque le RIB pour l'affichage UI (réexporté depuis payment-validation).
 */
export { maskRib };
