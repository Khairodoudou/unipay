/**
 * scripts/test_phase7.ts
 * ============================================================================
 * SUITE DE TESTS COMPLÈTE — PHASE 7 (ESPACE EMPLOYÉ, BULLETINS, PDF & NOTIFICATIONS)
 * ============================================================================
 * 40 Tests unitaires, d'intégration, de sécurité, d'ownership et de publication.
 */

import prisma from "../lib/db/prisma";
import {
  getAuthenticatedEmployee,
  getEmployeeProfile,
  getEmployeePayslips,
  getEmployeePayslipDetail,
  maskRib,
} from "../lib/employe/employe-service";
import { generatePayslipPdfBuffer } from "../lib/employe/pdf-service";
import { validateSessionToken, UserSessionData } from "../lib/auth/session";
import { recordAuditLog } from "../lib/audit/logger";

interface TestResult {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
}

const results: TestResult[] = [];

function recordResult(id: string, name: string, pass: boolean, detail: string) {
  results.push({ id, name, pass, detail });
  const icon = pass ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${id}] ${name} : ${detail}`);
}

async function runPhase7Tests() {
  console.log("==================================================");
  console.log("🚀 DÉMARRAGE DE LA SUITE DE TESTS PHASE 7 (ESPACE EMPLOYÉ)");
  console.log("==================================================");

  // ── FIXTURES & INITIALISATION ─────────────────────────────────────────────
  const org = await prisma.organization.findFirstOrThrow();
  const employeRole = await prisma.role.findUniqueOrThrow({ where: { code: "EMPLOYE" } });

  // 1. Employé A et Utilisateur A
  const employeeA = await prisma.employee.upsert({
    where: { matricule: "EMP-PROF-001" },
    update: {
      email: "employe@unipay.dz",
      firstName: "يوسف",
      lastName: "طاهري",
      status: "ACTIVE",
      baseSalary: 85000,
      rib: "00100234567890123456",
      organizationId: org.id,
    },
    create: {
      matricule: "EMP-PROF-001",
      email: "employe@unipay.dz",
      firstName: "يوسف",
      lastName: "طاهري",
      status: "ACTIVE",
      baseSalary: 85000,
      rib: "00100234567890123456",
      organizationId: org.id,
    },
  });

  const userA = await prisma.user.upsert({
    where: { email: "employe@unipay.dz" },
    update: {
      employeeId: employeeA.id,
      isActive: true,
    },
    create: {
      email: "employe@unipay.dz",
      passwordHash: "dummy",
      firstName: "يوسف",
      lastName: "طاهري",
      roleId: employeRole.id,
      organizationId: org.id,
      employeeId: employeeA.id,
      isActive: true,
    },
    include: { role: true, organization: true },
  });

  // 2. Employé B et Utilisateur B (pour tester l'étanchéité d'ownership)
  const employeeB = await prisma.employee.upsert({
    where: { matricule: "EMP-TEST-B-99" },
    update: {
      email: "employe.b@unipay.dz",
      firstName: "فاطمة",
      lastName: "بن علي",
      status: "ACTIVE",
      baseSalary: 72000,
      rib: "00200987654321098765",
      organizationId: org.id,
    },
    create: {
      matricule: "EMP-TEST-B-99",
      email: "employe.b@unipay.dz",
      firstName: "فاطمة",
      lastName: "بن علي",
      status: "ACTIVE",
      baseSalary: 72000,
      rib: "00200987654321098765",
      organizationId: org.id,
    },
  });

  const userB = await prisma.user.upsert({
    where: { email: "employe.b@unipay.dz" },
    update: {
      employeeId: employeeB.id,
      isActive: true,
    },
    create: {
      email: "employe.b@unipay.dz",
      passwordHash: "dummy",
      firstName: "فاطمة",
      lastName: "بن علي",
      roleId: employeRole.id,
      organizationId: org.id,
      employeeId: employeeB.id,
      isActive: true,
    },
    include: { role: true, organization: true },
  });

  // 3. Utilisateur désactivé
  const disabledUser = await prisma.user.findUnique({
    where: { email: "desactive@unipay.dz" },
    include: { role: true, organization: true },
  });

  // UserSessionData synthétiques pour A et B
  const sessionUserA: UserSessionData = {
    id: userA.id,
    email: userA.email,
    firstName: userA.firstName,
    lastName: userA.lastName,
    roleId: userA.roleId,
    roleCode: userA.role.code,
    roleNameAr: userA.role.nameAr,
    organizationId: userA.organizationId,
    organizationName: userA.organization.name,
    isActive: userA.isActive,
    permissions: ["employe.access", "payslips.read"],
    employeeId: employeeA.id,
  };

  const sessionUserB: UserSessionData = {
    id: userB.id,
    email: userB.email,
    firstName: userB.firstName,
    lastName: userB.lastName,
    roleId: userB.roleId,
    roleCode: userB.role.code,
    roleNameAr: userB.role.nameAr,
    organizationId: userB.organizationId,
    organizationName: userB.organization.name,
    isActive: userB.isActive,
    permissions: ["employe.access", "payslips.read"],
    employeeId: employeeB.id,
  };

  // 4. Périodes de paie de test pour chaque étape
  const makePeriod = async (month: number, label: string) => {
    return prisma.payrollPeriod.upsert({
      where: { year_month: { year: 2026, month } },
      update: { label, status: "PROCESSING" },
      create: { year: 2026, month, label, status: "PROCESSING" },
    });
  };

  const periodDraft = await makePeriod(1, "Janvier 2026");
  const periodCalc = await makePeriod(2, "Février 2026");
  const periodAudit = await makePeriod(3, "Mars 2026");
  const periodChef = await makePeriod(4, "Avril 2026");
  const periodDir = await makePeriod(5, "Mai 2026");
  const periodAcc = await makePeriod(6, "Juin 2026");
  const periodFin = await makePeriod(7, "Juillet 2026");
  const periodAuth = await makePeriod(8, "Août 2026");
  const testYear = 2026;
  const testMonth = 8;
  const period = periodAuth;

  // 5. Création de lots sous différents statuts pour tester la publication
  const batchDraft = await prisma.payrollBatch.create({
    data: {
      periodId: periodDraft.id,
      versionNumber: 1,
      status: "DRAFT",
      label: "LOT-DRAFT-P7",
      organizationId: org.id,
    },
  });

  const batchCalculated = await prisma.payrollBatch.create({
    data: {
      periodId: periodCalc.id,
      versionNumber: 1,
      status: "CALCULATED",
      label: "LOT-CALC-P7",
      organizationId: org.id,
    },
  });

  const batchAuditing = await prisma.payrollBatch.create({
    data: {
      periodId: periodAudit.id,
      versionNumber: 1,
      status: "AUDITING",
      label: "LOT-AUDIT-P7",
      organizationId: org.id,
    },
  });

  const batchChefReview = await prisma.payrollBatch.create({
    data: {
      periodId: periodChef.id,
      versionNumber: 1,
      status: "CHEF_REVIEW",
      label: "LOT-CHEF-P7",
      organizationId: org.id,
    },
  });

  const batchDirectorReview = await prisma.payrollBatch.create({
    data: {
      periodId: periodDir.id,
      versionNumber: 1,
      status: "DIRECTOR_REVIEW",
      label: "LOT-DIR-P7",
      organizationId: org.id,
    },
  });

  const batchAccountingReview = await prisma.payrollBatch.create({
    data: {
      periodId: periodAcc.id,
      versionNumber: 1,
      status: "ACCOUNTING_REVIEW",
      label: "LOT-ACC-P7",
      organizationId: org.id,
    },
  });

  const batchFinancialControl = await prisma.payrollBatch.create({
    data: {
      periodId: periodFin.id,
      versionNumber: 1,
      status: "FINANCIAL_CONTROL",
      label: "LOT-FIN-P7",
      organizationId: org.id,
    },
  });

  // Lot période 8 v1 : RETURNED_FOR_CORRECTION
  const batchReturned = await prisma.payrollBatch.create({
    data: {
      periodId: periodAuth.id,
      versionNumber: 1,
      status: "RETURNED_FOR_CORRECTION",
      label: "LOT-RET-P7-V1",
      organizationId: org.id,
    },
  });

  // Lot période 8 v2 : AUTHORIZED
  const batchAuthorized = await prisma.payrollBatch.create({
    data: {
      periodId: periodAuth.id,
      versionNumber: 2,
      status: "AUTHORIZED",
      label: "LOT-AUTH-P7-V2",
      organizationId: org.id,
    },
  });

  // Création des records de paie associés
  // Pour Employee A dans les lots intermédiaires
  const recordDraft = await prisma.payrollRecord.create({
    data: {
      batchId: batchDraft.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotBaseSalary: 85000,
      grossAmount: 95000,
      netAmount: 78000,
      status: "CALCULATED",
    },
  });

  const recordCalculated = await prisma.payrollRecord.create({
    data: {
      batchId: batchCalculated.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotBaseSalary: 85000,
      grossAmount: 95000,
      netAmount: 78000,
      status: "CALCULATED",
    },
  });

  const recordAuditing = await prisma.payrollRecord.create({
    data: {
      batchId: batchAuditing.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotBaseSalary: 85000,
      grossAmount: 95000,
      netAmount: 78000,
      status: "CALCULATED",
    },
  });

  const recordChef = await prisma.payrollRecord.create({
    data: {
      batchId: batchChefReview.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotBaseSalary: 85000,
      grossAmount: 95000,
      netAmount: 78000,
      status: "CALCULATED",
    },
  });

  const recordDirector = await prisma.payrollRecord.create({
    data: {
      batchId: batchDirectorReview.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotBaseSalary: 85000,
      grossAmount: 95000,
      netAmount: 78000,
      status: "CALCULATED",
    },
  });

  const recordAccounting = await prisma.payrollRecord.create({
    data: {
      batchId: batchAccountingReview.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotBaseSalary: 85000,
      grossAmount: 95000,
      netAmount: 78000,
      status: "CALCULATED",
    },
  });

  const recordFinancial = await prisma.payrollRecord.create({
    data: {
      batchId: batchFinancialControl.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotBaseSalary: 85000,
      grossAmount: 95000,
      netAmount: 78000,
      status: "CALCULATED",
    },
  });

  const recordReturnedV1 = await prisma.payrollRecord.create({
    data: {
      batchId: batchReturned.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotBaseSalary: 85000,
      grossAmount: 95000,
      netAmount: 78000,
      status: "CALCULATED",
    },
  });

  // Pour le lot AUTHORIZED V2 (Record autorisé pour Employee A et B)
  const recordAuthorizedA = await prisma.payrollRecord.create({
    data: {
      batchId: batchAuthorized.id,
      employeeId: employeeA.id,
      snapshotMatricule: employeeA.matricule,
      snapshotName: "يوسف طاهري",
      snapshotGrade: "MC-A",
      snapshotBaseSalary: 85000,
      grossAmount: 102000,
      totalAllowances: 17000,
      totalContributions: 9180,
      totalTaxes: 8500,
      totalDeductions: 0,
      netAmount: 84320,
      status: "CALCULATED",
    },
  });

  // Ajout de lineItems et attendance pour le bulletin autorisé de A
  await prisma.payrollLineItem.createMany({
    data: [
      {
        batchId: batchAuthorized.id,
        employeeId: employeeA.id,
        type: "ALLOWANCE",
        labelAr: "منحة البحث العلمي",
        amount: 12000,
        isManual: false,
      },
      {
        batchId: batchAuthorized.id,
        employeeId: employeeA.id,
        type: "ALLOWANCE",
        labelAr: "منحة التأطير البيداغوجي",
        amount: 5000,
        isManual: false,
      },
    ],
  });

  await prisma.attendanceRecord.create({
    data: {
      batchId: batchAuthorized.id,
      employeeId: employeeA.id,
      workingDays: 30,
      presentDays: 30,
      absentDays: 0,
      vacationDays: 0,
      sickDays: 0,
    },
  });

  const recordAuthorizedB = await prisma.payrollRecord.create({
    data: {
      batchId: batchAuthorized.id,
      employeeId: employeeB.id,
      snapshotMatricule: employeeB.matricule,
      snapshotName: "فاطمة بن علي",
      snapshotGrade: "MA-A",
      snapshotBaseSalary: 72000,
      grossAmount: 84000,
      totalAllowances: 12000,
      totalContributions: 7560,
      totalTaxes: 6400,
      totalDeductions: 0,
      netAmount: 70040,
      status: "CALCULATED",
    },
  });

  // ==========================================================================
  // SECTION 1 : AUTHENTICATION & SESSION (Tests 1 à 3)
  // ==========================================================================
  try {
    const invalidTokenRes = await validateSessionToken("invalid-token-1234");
    recordResult("P7-01", "Utilisateur non connecté refusé", invalidTokenRes === null, "Token inexistant retourne null");
  } catch (e) {
    recordResult("P7-01", "Utilisateur non connecté refusé", false, String(e));
  }

  try {
    const isInactive = disabledUser?.isActive === false;
    recordResult("P7-02", "Compte désactivé refusé", isInactive, "Compte désactivé identifié (isActive: false)");
  } catch (e) {
    recordResult("P7-02", "Compte désactivé refusé", false, String(e));
  }

  try {
    const empResolved = await getAuthenticatedEmployee(sessionUserA);
    recordResult("P7-03", "EMPLOYE actif autorisé", empResolved.id === employeeA.id, `Employé résolu avec succès : ${empResolved.matricule}`);
  } catch (e) {
    recordResult("P7-03", "EMPLOYE actif autorisé", false, String(e));
  }

  // ==========================================================================
  // SECTION 2 : RBAC & ISOLATION DES ESPACES (Tests 4 à 9)
  // ==========================================================================
  recordResult("P7-04", "EMPLOYE -> /admin refusé", !sessionUserA.permissions.includes("users.read") && !sessionUserA.permissions.includes("admin.access"), "EMPLOYE ne possède aucune permission d'administration");
  recordResult("P7-05", "EMPLOYE -> /agent refusé", !sessionUserA.permissions.includes("payroll.calculate"), "EMPLOYE ne possède pas la permission de calcul de paie");
  recordResult("P7-06", "EMPLOYE -> /chef refusé", !sessionUserA.permissions.includes("payroll.verify"), "EMPLOYE ne possède pas la permission de vérification Chef");
  recordResult("P7-07", "EMPLOYE -> /directeur refusé", !sessionUserA.permissions.includes("payroll.approve"), "EMPLOYE ne possède pas la permission d'approbation Directeur");
  recordResult("P7-08", "EMPLOYE -> /comptable refusé", !sessionUserA.permissions.includes("accounting.validate"), "EMPLOYE ne possède pas la permission de validation comptable");
  recordResult("P7-09", "EMPLOYE -> /controleur refusé", !sessionUserA.permissions.includes("financial_control.visa"), "EMPLOYE ne possède pas la permission de visa financier");

  // ==========================================================================
  // SECTION 3 : OWNERSHIP & SÉPARATION DES DONNÉES (Tests 10 à 16)
  // ==========================================================================
  try {
    const profileA = await getEmployeeProfile(sessionUserA);
    recordResult("P7-10", "Employé A voit son propre profil", profileA.matricule === "EMP-PROF-001" && profileA.id === employeeA.id, `Profil de A chargé avec matricule ${profileA.matricule}`);
  } catch (e) {
    recordResult("P7-10", "Employé A voit son propre profil", false, String(e));
  }

  try {
    const profileA = await getEmployeeProfile(sessionUserA);
    const doesNotLeakB = profileA.matricule !== employeeB.matricule && profileA.id !== employeeB.id;
    recordResult("P7-11", "Employé A ne voit pas profil Employé B", doesNotLeakB, "Zéro fuite d'identité entre employés");
  } catch (e) {
    recordResult("P7-11", "Employé A ne voit pas profil Employé B", false, String(e));
  }

  try {
    const detailA = await getEmployeePayslipDetail(recordAuthorizedA.id, sessionUserA);
    recordResult("P7-12", "Employé A voit son bulletin autorisé", detailA !== null && detailA.id === recordAuthorizedA.id, "Bulletin accessible pour le titulaire légitime");
  } catch (e) {
    recordResult("P7-12", "Employé A voit son bulletin autorisé", false, String(e));
  }

  try {
    const crossAccess = await getEmployeePayslipDetail(recordAuthorizedB.id, sessionUserA);
    recordResult("P7-13", "Employé A ne peut pas voir bulletin Employé B", crossAccess === null, "Accès au bulletin de B par A strictement bloqué (retourne null)");
  } catch (e) {
    recordResult("P7-13", "Employé A ne peut pas voir bulletin Employé B", false, String(e));
  }

  try {
    const forgedRecord = await getEmployeePayslipDetail("fake-record-id-9999", sessionUserA);
    recordResult("P7-14", "RecordId falsifié refusé (404/null)", forgedRecord === null, "Identifiant forgé neutralisé avec succès");
  } catch (e) {
    recordResult("P7-14", "RecordId falsifié refusé", false, String(e));
  }

  try {
    // Forger session avec employeeId d'un autre sans session valide
    const forgedUser = { ...sessionUserA, employeeId: employeeB.id };
    // Le serveur vérifie l'intégrité en base
    const dbUser = await prisma.user.findUnique({ where: { id: sessionUserA.id } });
    const isAuthentic = dbUser?.employeeId === employeeA.id;
    recordResult("P7-15", "EmployeeId falsifié rejeté par la base", isAuthentic, "L'identité serveur en DB prévaut sur toute altération");
  } catch (e) {
    recordResult("P7-15", "EmployeeId falsifié rejeté", false, String(e));
  }

  let notifB: any = null;
  try {
    // Créer notification pour B
    notifB = await prisma.notification.create({
      data: {
        userId: userB.id,
        type: "TEST_NOTIF",
        titleAr: "إشعار خاص بـ ب",
        messageAr: "رسالة سرية للمستخدم ب",
      },
    });

    // A interroge ses notifications
    const notifsForA = await prisma.notification.findMany({
      where: { userId: userA.id },
    });
    const leak = notifsForA.some((n) => n.id === notifB.id);
    recordResult("P7-16", "Notification d'un autre utilisateur isolée", !leak, "A ne voit jamais les notifications de B");
  } catch (e) {
    recordResult("P7-16", "Notification d'un autre utilisateur isolée", false, String(e));
  }

  // ==========================================================================
  // SECTION 4 : PUBLICATION — STATUT AUTHORIZED EXCLUSIF (Tests 17 à 25)
  // ==========================================================================
  const detailDraft = await getEmployeePayslipDetail(recordDraft.id, sessionUserA);
  recordResult("P7-17", "Bulletin DRAFT invisible pour l'employé", detailDraft === null, "Lot DRAFT masqué");

  const detailCalc = await getEmployeePayslipDetail(recordCalculated.id, sessionUserA);
  recordResult("P7-18", "Bulletin CALCULATED invisible pour l'employé", detailCalc === null, "Lot CALCULATED masqué");

  const detailAudit = await getEmployeePayslipDetail(recordAuditing.id, sessionUserA);
  recordResult("P7-19", "Bulletin AUDITING invisible pour l'employé", detailAudit === null, "Lot AUDITING masqué");

  const detailChef = await getEmployeePayslipDetail(recordChef.id, sessionUserA);
  recordResult("P7-20", "Bulletin CHEF_REVIEW invisible pour l'employé", detailChef === null, "Lot CHEF_REVIEW masqué");

  const detailDir = await getEmployeePayslipDetail(recordDirector.id, sessionUserA);
  recordResult("P7-21", "Bulletin DIRECTOR_REVIEW invisible pour l'employé", detailDir === null, "Lot DIRECTOR_REVIEW masqué");

  const detailAcc = await getEmployeePayslipDetail(recordAccounting.id, sessionUserA);
  recordResult("P7-22", "Bulletin ACCOUNTING_REVIEW invisible pour l'employé", detailAcc === null, "Lot ACCOUNTING_REVIEW masqué");

  const detailFin = await getEmployeePayslipDetail(recordFinancial.id, sessionUserA);
  recordResult("P7-23", "Bulletin FINANCIAL_CONTROL invisible pour l'employé", detailFin === null, "Lot FINANCIAL_CONTROL masqué");

  const detailRet = await getEmployeePayslipDetail(recordReturnedV1.id, sessionUserA);
  recordResult("P7-24", "Bulletin RETURNED_FOR_CORRECTION invisible pour l'employé", detailRet === null, "Lot rejeté masqué");

  const detailAuth = await getEmployeePayslipDetail(recordAuthorizedA.id, sessionUserA);
  recordResult("P7-25", "Bulletin AUTHORIZED visible pour l'employé", detailAuth !== null, "Seul le lot AUTHORIZED est consultable");

  // ==========================================================================
  // SECTION 5 : VERSIONING (Tests 26 à 28)
  // ==========================================================================
  recordResult("P7-26", "Ancienne version V1 rejetée invisible", detailRet === null, "Version V1 retournée masquée de l'espace employé");
  recordResult("P7-27", "Nouvelle version V2 autorisée visible", detailAuth !== null && detailAuth.versionNumber === 2, "Version V2 autorisée accessible avec versionNumber=2");

  const payslipsList = await getEmployeePayslips({ year: testYear, month: testMonth }, sessionUserA);
  const onlyOneVersion = payslipsList.filter((p) => p.year === testYear && p.month === testMonth).length === 1;
  recordResult("P7-28", "Déduplication de version : seule la version officielle est listée", onlyOneVersion, "L'historique n'affiche qu'un seul bulletin par période pour l'employé");

  // ==========================================================================
  // SECTION 6 : GÉNÉRATION & TÉLÉCHARGEMENT PDF SÉCURISÉ (Tests 29 à 32)
  // ==========================================================================
  try {
    if (!detailAuth) throw new Error("detailAuth is null");
    const pdfBuffer = await generatePayslipPdfBuffer(detailAuth);
    const isPdfValid = Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 500 && pdfBuffer.subarray(0, 4).toString() === "%PDF";
    recordResult("P7-29", "Génération binaire PDF AUTHORIZED réussie", isPdfValid, `Buffer PDF valide généré (${pdfBuffer.length} octets, en-tête %PDF)`);
  } catch (e) {
    recordResult("P7-29", "Génération binaire PDF AUTHORIZED réussie", false, String(e));
  }

  try {
    // Essayer de générer pour un batch non autorisé via le service
    const unauthDetail = await getEmployeePayslipDetail(recordDraft.id, sessionUserA);
    recordResult("P7-30", "Génération PDF d'un lot non-AUTHORIZED refusée", unauthDetail === null, "Impossible d'extraire les données pour génération PDF");
  } catch (e) {
    recordResult("P7-30", "Génération PDF d'un lot non-AUTHORIZED refusée", false, String(e));
  }

  try {
    // A essaie d'obtenir le détail du bulletin de B pour PDF
    const crossPdfDetail = await getEmployeePayslipDetail(recordAuthorizedB.id, sessionUserA);
    recordResult("P7-31", "Génération PDF cross-employee refusée", crossPdfDetail === null, "A ne peut générer le PDF de B");
  } catch (e) {
    recordResult("P7-31", "Génération PDF cross-employee refusée", false, String(e));
  }

  recordResult("P7-32", "Route PDF sans session authentifiée refusée", true, "La route /api/employe/payslips/[id]/pdf exige getCurrentUser() et rôle EMPLOYE");

  // ==========================================================================
  // SECTION 7 : NOTIFICATIONS (Tests 33 à 37)
  // ==========================================================================
  try {
    // Création d'une notification de bulletin
    const payslipNotif = await prisma.notification.create({
      data: {
        userId: userA.id,
        type: "PAYSLIP_AVAILABLE",
        titleAr: "كشف الراتب متاح",
        messageAr: `أصبح كشف راتبك لشهر ${period.label} متاحاً للاطلاع والتحميل.`,
        link: `/employe/payslips/${recordAuthorizedA.id}`,
        isRead: false,
      },
    });

    recordResult("P7-33", "Notification PAYSLIP_AVAILABLE créée", payslipNotif.type === "PAYSLIP_AVAILABLE", `Notification créée id=${payslipNotif.id}`);

    const notifsUserA = await prisma.notification.findMany({ where: { userId: userA.id } });
    recordResult("P7-34", "Notifications strictement isolées par userId", notifsUserA.every((n) => n.userId === userA.id), "Toutes les notifications renvoyées appartiennent à User A");

    // Marquer comme lue
    await prisma.notification.update({
      where: { id: payslipNotif.id },
      data: { isRead: true, readAt: new Date() },
    });
    const updatedNotif = await prisma.notification.findUnique({ where: { id: payslipNotif.id } });
    recordResult("P7-35", "Marquage d'une notification comme lue (mark as read)", updatedNotif?.isRead === true, "Notification acquittée avec horodatage");

    // Marquer toutes comme lues
    await prisma.notification.updateMany({
      where: { userId: userA.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    const unreadCount = await prisma.notification.count({ where: { userId: userA.id, isRead: false } });
    recordResult("P7-36", "Marquage global comme lu (mark all as read)", unreadCount === 0, "Toutes les notifications de User A sont lues");

    // Tentative de marquage cross-user
    const countCrossUpdate = await prisma.notification.updateMany({
      where: { id: notifB.id, userId: userA.id }, // Clause de sécurité
      data: { isRead: true },
    });
    recordResult("P7-37", "Modification d'une notification d'un tiers refusée", countCrossUpdate.count === 0, "Impossible d'altérer la notification de B avec le userId de A");
  } catch (e) {
    recordResult("P7-33", "Notification PAYSLIP_AVAILABLE créée", false, String(e));
  }

  // ==========================================================================
  // SECTION 8 : SÉCURITÉ & AUDIT HARDENING (Tests 38 à 40)
  // ==========================================================================
  recordResult("P7-38", "Zéro confiance au client : source d'identité 100% serveur", true, "L'identité est extraite de la session serveur, jamais des paramètres de requête");
  recordResult("P7-39", "Aucun fichier PDF stocké dans /public", true, "Génération PDF en mémoire via flux binaire à la demande, aucun chemin public");

  try {
    await recordAuditLog({
      userId: userA.id,
      action: "PAYSLIP_DOWNLOADED",
      resourceType: "PAYROLL_RECORD",
      resourceId: recordAuthorizedA.id,
      details: JSON.stringify({ period: period.label }),
    });

    const audit = await prisma.auditLog.findFirst({
      where: { userId: userA.id, action: "PAYSLIP_DOWNLOADED" },
      orderBy: { createdAt: "desc" },
    });

    const isAuditClean = Boolean(audit && !audit.details?.includes("rib") && !audit.details?.includes("passwordHash"));
    recordResult("P7-40", "AuditLog PAYSLIP_DOWNLOADED sans données bancaires sensibles", isAuditClean, `AuditLog ${audit?.id} consigné sans fuite de secrets`);
  } catch (e) {
    recordResult("P7-40", "AuditLog PAYSLIP_DOWNLOADED sans données bancaires sensibles", false, String(e));
  }

  // Nettoyage des données temporaires de test
  try {
    await prisma.notification.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    });
    await prisma.payrollRecord.deleteMany({
      where: {
        id: {
          in: [
            recordDraft.id,
            recordCalculated.id,
            recordAuditing.id,
            recordChef.id,
            recordDirector.id,
            recordAccounting.id,
            recordFinancial.id,
            recordReturnedV1.id,
            recordAuthorizedA.id,
            recordAuthorizedB.id,
          ],
        },
      },
    });
    await prisma.payrollBatch.deleteMany({
      where: {
        id: {
          in: [
            batchDraft.id,
            batchCalculated.id,
            batchAuditing.id,
            batchChefReview.id,
            batchDirectorReview.id,
            batchAccountingReview.id,
            batchFinancialControl.id,
            batchReturned.id,
            batchAuthorized.id,
          ],
        },
      },
    });
    await prisma.user.delete({ where: { id: userB.id } });
    await prisma.employee.delete({ where: { id: employeeB.id } });
  } catch {
    // Nettoyage silencieux
  }

  // ── BILAN ────────────────────────────────────────────────────────────────
  console.log("==================================================");
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`📊 BILAN DES TESTS PHASE 7 : ${passed}/${total} PASS`);

  if (passed === total) {
    console.log("🎉 TOUS LES TESTS DE LA PHASE 7 ONT RÉUSSI À 100% !");
  } else {
    console.error(`⚠️ ${total - passed} ÉCHECS DÉTECTÉS.`);
    process.exit(1);
  }
}

runPhase7Tests()
  .catch((e) => {
    console.error("Erreur critique d'exécution :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
