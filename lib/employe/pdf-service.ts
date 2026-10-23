import PDFDocument from "pdfkit";
import { EmployeePayslipDetailDTO } from "./employe-service";

/**
 * Formate un montant en dinars algériens (DZD)
 */
function formatDZD(amount: number): string {
  return (
    amount.toLocaleString("fr-DZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " DZD"
  );
}

/**
 * Génère le tampon binaire PDF d'un bulletin de paie autorisé.
 * Conforme aux standards administratifs algériens (Bilingue institutionnel).
 */
export async function generatePayslipPdfBuffer(
  payslip: EmployeePayslipDetailDTO
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: {
        Title: `Bulletin_Paie_${payslip.employee.matricule}_${payslip.year}_${payslip.month}`,
        Author: payslip.employee.organizationName || "أكاديميا شفاف",
        Subject: "Bulletin de paie mensuel certifié",
        Keywords: "bulletin, paie, unipay, universite",
        CreationDate: new Date(),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const pageWidth = 595.28 - 80; // A4 width minus margins (margin 40 on each side)
    const startX = 40;

    // ── 1. EN-TÊTE INSTITUTIONNEL ───────────────────────────────────────────
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE", startX, 40, {
        align: "center",
        width: pageWidth,
      });

    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        "MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE",
        startX,
        54,
        { align: "center", width: pageWidth }
      );

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(payslip.employee.organizationName.toUpperCase(), startX, 68, {
        align: "center",
        width: pageWidth,
      });

    if (payslip.employee.organizationUnitName) {
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .text(payslip.employee.organizationUnitName, startX, 82, {
          align: "center",
          width: pageWidth,
        });
    }

    // Ligne de séparation
    doc
      .moveTo(startX, 98)
      .lineTo(startX + pageWidth, 98)
      .lineWidth(1)
      .strokeColor("#1e3a8a")
      .stroke();

    // ── 2. TITRE DU DOCUMENT & PÉRIODE ─────────────────────────────────────
    doc
      .rect(startX, 105, pageWidth, 28)
      .fillColor("#f1f5f9")
      .fill();

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("BULLETIN DE PAIE MENSUEL  /  كشف الراتب الشهري", startX + 10, 113, {
        width: pageWidth - 200,
      });

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#1e3a8a")
      .text(
        `PÉRIODE : ${payslip.periodLabel.toUpperCase()}  (v${payslip.versionNumber})`,
        startX + pageWidth - 220,
        114,
        { width: 210, align: "right" }
      );

    // ── 3. CADRE IDENTIFICATION DE L'EMPLOYÉ ───────────────────────────────
    let currentY = 142;

    doc
      .rect(startX, currentY, pageWidth, 80)
      .strokeColor("#cbd5e1")
      .lineWidth(0.8)
      .stroke();

    // Colonne 1 : Données d'identité
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("Matricule :", startX + 12, currentY + 10)
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(payslip.employee.matricule, startX + 75, currentY + 10);

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("Nom & Prénom :", startX + 12, currentY + 26)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(payslip.employee.fullName, startX + 85, currentY + 26);

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("Grade :", startX + 12, currentY + 42)
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(payslip.employee.grade ?? "—", startX + 75, currentY + 42);

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("Fonction :", startX + 12, currentY + 58)
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(payslip.employee.position ?? "Enseignant / Chercheur", startX + 75, currentY + 58);

    // Colonne 2 : Données administratives et bancaires
    const col2X = startX + 280;

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("Catégorie :", col2X, currentY + 10)
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(payslip.employee.category ?? "Titulaire permanent", col2X + 65, currentY + 10);

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("Banque :", col2X, currentY + 26)
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(payslip.employee.bankName ?? "Trésor Public / BNA", col2X + 65, currentY + 26);

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("RIB :", col2X, currentY + 42)
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(payslip.employee.maskedRib ?? "Compte institutionnel certifié", col2X + 65, currentY + 42);

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("Salaire de Base :", col2X, currentY + 58)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(formatDZD(payslip.summary.baseSalary), col2X + 85, currentY + 58);

    currentY += 90;

    // ── 4. CADRE ASSIDUITÉ (si disponible) ─────────────────────────────────
    if (payslip.attendance) {
      doc
        .rect(startX, currentY, pageWidth, 24)
        .fillColor("#f8fafc")
        .fill();

      doc
        .rect(startX, currentY, pageWidth, 24)
        .strokeColor("#e2e8f0")
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#475569")
        .text(
          `Assiduité :  Jours ouvrables: ${payslip.attendance.workingDays}  |  Présents: ${payslip.attendance.presentDays}  |  Absences: ${payslip.attendance.absentDays}  |  Congés: ${payslip.attendance.vacationDays + payslip.attendance.sickDays}`,
          startX + 12,
          currentY + 7
        );

      currentY += 32;
    }

    // ── 5. TABLEAU DES ÉLÉMENTS DE PAIE ─────────────────────────────────────
    const tableHeaderY = currentY;

    // Entête du tableau
    doc
      .rect(startX, tableHeaderY, pageWidth, 22)
      .fillColor("#1e293b")
      .fill();

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("RUBRIQUE / DESIGNATION", startX + 12, tableHeaderY + 7, { width: 230 })
      .text("TYPE", startX + 250, tableHeaderY + 7, { width: 80 })
      .text("GAINS (DZD)", startX + 340, tableHeaderY + 7, { width: 80, align: "right" })
      .text("RETENUES (DZD)", startX + 430, tableHeaderY + 7, { width: 75, align: "right" });

    currentY += 22;

    // Ligne 1 : Salaire de Base
    let isOdd = false;
    const rowHeight = 18;

    const printRow = (label: string, type: string, gain: number | null, retenue: number | null) => {
      if (isOdd) {
        doc.rect(startX, currentY, pageWidth, rowHeight).fillColor("#f8fafc").fill();
      }
      isOdd = !isOdd;

      doc
        .rect(startX, currentY, pageWidth, rowHeight)
        .strokeColor("#f1f5f9")
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#1e293b")
        .text(label, startX + 12, currentY + 5, { width: 230 })
        .text(type, startX + 250, currentY + 5, { width: 80 })
        .text(gain ? formatDZD(gain) : "—", startX + 340, currentY + 5, {
          width: 80,
          align: "right",
        })
        .text(retenue ? formatDZD(retenue) : "—", startX + 430, currentY + 5, {
          width: 75,
          align: "right",
        });

      currentY += rowHeight;
    };

    // Imprimer le salaire de base
    printRow("Salaire de base / الأجر القاعدي", "BASE", payslip.summary.baseSalary, null);

    // Imprimer les lineItems
    for (const item of payslip.lineItems) {
      const isGain = item.type === "ALLOWANCE" || item.type === "BONUS";
      printRow(
        item.labelAr || item.code || "Indemnité",
        item.type,
        isGain ? item.amount : null,
        !isGain ? item.amount : null
      );
    }

    // Cotisations sociales CNAS (si non déjà dans lineItems)
    if (payslip.summary.totalContributions > 0 && !payslip.lineItems.some((l) => l.type === "CONTRIBUTION")) {
      printRow(
        "Cotisations Sécurité Sociale (CNAS 9%)",
        "CONTRIBUTION",
        null,
        payslip.summary.totalContributions
      );
    }

    // Retenue fiscale IRG (si non déjà dans lineItems)
    if (payslip.summary.totalTaxes > 0 && !payslip.lineItems.some((l) => l.type === "TAX")) {
      printRow("Retenue Impôt sur le Revenu (IRG)", "TAX", null, payslip.summary.totalTaxes);
    }

    // ── 6. RÉCAPITULATIF DES TOTAUX ─────────────────────────────────────────
    currentY += 10;

    const totalBoxY = currentY;
    const totalBoxHeight = 55;

    doc
      .rect(startX, totalBoxY, pageWidth, totalBoxHeight)
      .fillColor("#f1f5f9")
      .fill();

    doc
      .rect(startX, totalBoxY, pageWidth, totalBoxHeight)
      .strokeColor("#94a3b8")
      .lineWidth(1)
      .stroke();

    // Total Brut
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("TOTAL SALAIRE BRUT :", startX + 15, totalBoxY + 12)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(formatDZD(payslip.summary.grossAmount), startX + 160, totalBoxY + 12);

    // Total Retenues
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text("TOTAL DES RETENUES :", startX + 15, totalBoxY + 32)
      .font("Helvetica-Bold")
      .fillColor("#dc2626")
      .text(
        formatDZD(payslip.summary.totalDeductions + payslip.summary.totalContributions + payslip.summary.totalTaxes),
        startX + 160,
        totalBoxY + 32
      );

    // NET A PAYER ENCADRÉ
    const netBoxX = startX + 280;
    const netBoxWidth = pageWidth - 280;

    doc
      .rect(netBoxX, totalBoxY, netBoxWidth, totalBoxHeight)
      .fillColor("#1e3a8a")
      .fill();

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#93c5fd")
      .text("NET À PAYER  /  الصافي للدفع", netBoxX + 10, totalBoxY + 12, {
        width: netBoxWidth - 20,
        align: "center",
      });

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text(formatDZD(payslip.summary.netAmount), netBoxX + 10, totalBoxY + 30, {
        width: netBoxWidth - 20,
        align: "center",
      });

    currentY += totalBoxHeight + 30;

    // ── 7. MENTIONS DE VALIDATION & SÉCURITÉ ────────────────────────────────
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        "Ce document est certifié et généré électroniquement par le système de paie أكاديميا شفاف. Il atteste de la régularité des décomptes validés par les instances de contrôle financier habilitées.",
        startX,
        currentY,
        { width: pageWidth, align: "center" }
      );

    doc
      .fontSize(7)
      .font("Helvetica-Oblique")
      .fillColor("#94a3b8")
      .text(
        `Document ID: ${payslip.id}  •  Date d'émission: ${new Date().toLocaleDateString("fr-DZ")}  •  Statut de visa: AUTORISÉ (AUTHORIZED)`,
        startX,
        currentY + 16,
        { width: pageWidth, align: "center" }
      );

    doc.end();
  });
}
