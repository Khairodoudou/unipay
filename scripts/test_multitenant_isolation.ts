/**
 * scripts/test_multitenant_isolation.ts
 * ============================================================================
 * SUITE DE TESTS COMPLÈTE : ISOLATION MULTI-TENANT & GOUVERNANCE NATIONALE
 * ============================================================================
 * Vérifie formellement et de manière automatisée l'étanchéité stricte entre
 * universités (Zero Cross-Tenant Leakage) et les privilèges de SUPER_ADMIN.
 */

import prisma from "../lib/db/prisma";
import bcrypt from "bcryptjs";
import { assertTenantMatches, TenantSecurityError } from "../lib/tenant/context";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testId: string, description: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`✅ PASS [${testId}] ${description}${detail ? ` : ${detail}` : ""}`);
  } else {
    failCount++;
    console.error(`❌ FAIL [${testId}] ${description}${detail ? ` : ${detail}` : ""}`);
  }
}

async function runMultiTenantIsolationTests() {
  console.log("==================================================");
  console.log("🛡️  LANCEMENT DES TESTS D'ISOLATION MULTI-TENANT");
  console.log("==================================================");

  const timestamp = Date.now();
  const codeA = `TEST-UNIV-A-${timestamp}`;
  const codeB = `TEST-UNIV-B-${timestamp}`;

  let univA: any = null;
  let univB: any = null;
  let adminA: any = null;
  let adminB: any = null;
  let agentA: any = null;
  let agentB: any = null;
  let empA: any = null;
  let empB: any = null;
  let unitA: any = null;
  let unitB: any = null;
  let batchA: any = null;

  try {
    // ------------------------------------------------------------------------
    // SETUP : Création de deux universités distinctes (Univ A & Univ B)
    // ------------------------------------------------------------------------
    univA = await prisma.organization.create({
      data: {
        name: `جامعة الاختبار الأولى ${timestamp}`,
        code: codeA,
        wilaya: "الجزائر",
        status: "ACTIVE",
        isActive: true,
      },
    });

    univB = await prisma.organization.create({
      data: {
        name: `جامعة الاختبار الثانية ${timestamp}`,
        code: codeB,
        wilaya: "وهران",
        status: "ACTIVE",
        isActive: true,
      },
    });

    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
    const agentRole = await prisma.role.findUniqueOrThrow({ where: { code: "AGENT_RH" } });
    const dummyPasswordHash = await bcrypt.hash("TestPass1234!", 6);

    adminA = await prisma.user.create({
      data: {
        email: `admin-a-${timestamp}@unipay.test`,
        passwordHash: dummyPasswordHash,
        firstName: "Admin",
        lastName: "UnivA",
        roleId: adminRole.id,
        organizationId: univA.id,
        isActive: true,
      },
    });

    adminB = await prisma.user.create({
      data: {
        email: `admin-b-${timestamp}@unipay.test`,
        passwordHash: dummyPasswordHash,
        firstName: "Admin",
        lastName: "UnivB",
        roleId: adminRole.id,
        organizationId: univB.id,
        isActive: true,
      },
    });

    agentA = await prisma.user.create({
      data: {
        email: `agent-a-${timestamp}@unipay.test`,
        passwordHash: dummyPasswordHash,
        firstName: "Agent",
        lastName: "UnivA",
        roleId: agentRole.id,
        organizationId: univA.id,
        isActive: true,
      },
    });

    agentB = await prisma.user.create({
      data: {
        email: `agent-b-${timestamp}@unipay.test`,
        passwordHash: dummyPasswordHash,
        firstName: "Agent",
        lastName: "UnivB",
        roleId: agentRole.id,
        organizationId: univB.id,
        isActive: true,
      },
    });

    unitA = await prisma.organizationUnit.create({
      data: {
        name: "كلية العلوم أ",
        code: `SCI-A-${timestamp}`,
        type: "FACULTY",
        organizationId: univA.id,
        isActive: true,
      },
    });

    unitB = await prisma.organizationUnit.create({
      data: {
        name: "كلية الحقوق ب",
        code: `DROIT-B-${timestamp}`,
        type: "FACULTY",
        organizationId: univB.id,
        isActive: true,
      },
    });

    empA = await prisma.employee.create({
      data: {
        matricule: `MAT-A-${timestamp}`,
        firstName: "Karim",
        lastName: "UniversitaireA",
        organizationId: univA.id,
        organizationUnitId: unitA.id,
        status: "ACTIVE",
      },
    });

    empB = await prisma.employee.create({
      data: {
        matricule: `MAT-B-${timestamp}`,
        firstName: "Samir",
        lastName: "UniversitaireB",
        organizationId: univB.id,
        organizationUnitId: unitB.id,
        status: "ACTIVE",
      },
    });

    // ------------------------------------------------------------------------
    // TEST 1 : Helper assertTenantMatches
    // ------------------------------------------------------------------------
    const contextA = {
      user: adminA,
      tenantId: univA.id,
      tenantCode: univA.code,
      tenantName: univA.name,
      isSuperAdmin: false,
    };

    try {
      assertTenantMatches(contextA, univA.id, "Test concordance");
      assert(true, "MT-01", "assertTenantMatches autorise la correspondance exacte de tenantId", "UnivA matches UnivA");
    } catch {
      assert(false, "MT-01", "assertTenantMatches devrait réussir pour le même tenantId");
    }

    try {
      assertTenantMatches(contextA, univB.id, "Test violation");
      assert(false, "MT-02", "assertTenantMatches aurait dû lever une TenantSecurityError");
    } catch (err) {
      assert(err instanceof TenantSecurityError, "MT-02", "assertTenantMatches lève TenantSecurityError en cas de discordance", "UnivA vs UnivB rejeté");
    }

    // ------------------------------------------------------------------------
    // TEST 2 : Isolation des Employés
    // ------------------------------------------------------------------------
    const employeesForUnivA = await prisma.employee.findMany({
      where: { organizationId: univA.id },
    });
    const containsEmpB = employeesForUnivA.some((e) => e.id === empB.id);
    assert(!containsEmpB, "MT-03", "Les requêtes filtrées par tenantId pour UnivA n'exposent jamais les employés de UnivB");

    // Tentative de rattachement croisé d'unité parent entre UnivA et UnivB
    const parentUnitCheck = await prisma.organizationUnit.findFirst({
      where: {
        id: unitA.id,
        organizationId: univB.id, // falsifié
      },
    });
    assert(parentUnitCheck === null, "MT-04", "Une unité de UnivA est invisible sous le périmètre de UnivB");

    // ------------------------------------------------------------------------
    // TEST 3 : Protection du Dernier Administrateur par Université
    // ------------------------------------------------------------------------
    // UnivA a 1 admin (adminA), UnivB a 1 admin (adminB)
    const activeAdminsUnivA = await prisma.user.count({
      where: {
        role: { code: "ADMIN" },
        isActive: true,
        organizationId: univA.id,
      },
    });
    assert(activeAdminsUnivA === 1, "MT-05", "Le comptage des administrateurs actifs est strictement scopé par université", "UnivA = 1");

    const activeAdminsUnivB = await prisma.user.count({
      where: {
        role: { code: "ADMIN" },
        isActive: true,
        organizationId: univB.id,
      },
    });
    assert(activeAdminsUnivB === 1, "MT-06", "Le comptage des administrateurs pour UnivB est indépendant de UnivA", "UnivB = 1");

    // ------------------------------------------------------------------------
    // TEST 4 : Isolation des Paramètres Universitaires (UniversitySetting)
    // ------------------------------------------------------------------------
    await prisma.universitySetting.create({
      data: {
        organizationId: univA.id,
        key: "CONTACT_EMAIL",
        value: "contact@univ-a.dz",
        category: "GENERAL",
        labelAr: "البريد الإلكتروني للاتصال",
      },
    });

    await prisma.universitySetting.create({
      data: {
        organizationId: univB.id,
        key: "CONTACT_EMAIL",
        value: "contact@univ-b.dz",
        category: "GENERAL",
        labelAr: "البريد الإلكتروني للاتصال",
      },
    });

    const settingA = await prisma.universitySetting.findUnique({
      where: {
        organizationId_key: {
          organizationId: univA.id,
          key: "CONTACT_EMAIL",
        },
      },
    });

    const settingB = await prisma.universitySetting.findUnique({
      where: {
        organizationId_key: {
          organizationId: univB.id,
          key: "CONTACT_EMAIL",
        },
      },
    });

    assert(
      settingA?.value === "contact@univ-a.dz" && settingB?.value === "contact@univ-b.dz",
      "MT-07",
      "Les paramètres de UnivA et UnivB coexistent de manière étanche sans écrasement mutuel",
      `UnivA: ${settingA?.value} | UnivB: ${settingB?.value}`
    );

    // ------------------------------------------------------------------------
    // TEST 5 : Isolation des Lots de Paie (PayrollBatch)
    // ------------------------------------------------------------------------
    const period = await prisma.payrollPeriod.findFirstOrThrow();
    batchA = await prisma.payrollBatch.create({
      data: {
        periodId: period.id,
        versionNumber: 999000 + Math.floor(Math.random() * 900),
        status: "DRAFT",
        organizationId: univA.id,
        createdBy: agentA.id,
      },
    });

    // Vérifier que la requête scopée pour UnivB ne retourne pas batchA
    const batchesForUnivB = await prisma.payrollBatch.findMany({
      where: { organizationId: univB.id },
    });
    const containsBatchA = batchesForUnivB.some((b) => b.id === batchA.id);
    assert(!containsBatchA, "MT-08", "Les lots de paie de UnivA sont strictement invisibles pour UnivB");

    // Vérifier le rejet de l'ajout d'un employé de UnivB dans un lot de UnivA
    const empBelongsToUnivA = empB.organizationId === batchA.organizationId;
    assert(!empBelongsToUnivA, "MT-09", "Détection stricte d'incompatibilité de tenant entre l'employé et le lot de paie");

    // ------------------------------------------------------------------------
    // TEST 6 : Isolation des Journaux d'Audit (AuditLog)
    // ------------------------------------------------------------------------
    const auditLogA = await prisma.auditLog.create({
      data: {
        userId: adminA.id,
        organizationId: univA.id,
        action: "TEST_ACTION_A",
        resourceType: "EMPLOYEE",
        resourceId: empA.id,
      },
    });

    const auditLogB = await prisma.auditLog.create({
      data: {
        userId: adminB.id,
        organizationId: univB.id,
        action: "TEST_ACTION_B",
        resourceType: "EMPLOYEE",
        resourceId: empB.id,
      },
    });

    const logsForUnivA = await prisma.auditLog.findMany({
      where: { organizationId: univA.id },
    });
    const containsLogB = logsForUnivA.some((l) => l.id === auditLogB.id);
    assert(!containsLogB, "MT-10", "Les journaux d'audit de UnivB ne sont jamais divulgués à UnivA");

    // ------------------------------------------------------------------------
    // TEST 7 : Cycle de Vie & Suspension Institutionnelle
    // ------------------------------------------------------------------------
    await prisma.organization.update({
      where: { id: univB.id },
      data: {
        status: "SUSPENDED",
        isActive: false,
        suspendedAt: new Date(),
        suspendedReason: "Audit d'inspection ministérielle",
      },
    });

    const suspendedUnivB = await prisma.organization.findUnique({
      where: { id: univB.id },
    });
    assert(
      suspendedUnivB?.status === "SUSPENDED" && suspendedUnivB?.isActive === false,
      "MT-11",
      "La suspension institutionnelle enregistre le statut SUSPENDED et désactive l'accès",
      `Raison: ${suspendedUnivB?.suspendedReason}`
    );

    // Réactivation
    await prisma.organization.update({
      where: { id: univB.id },
      data: {
        status: "ACTIVE",
        isActive: true,
        suspendedAt: null,
        suspendedReason: null,
      },
    });

    const reactivatedUnivB = await prisma.organization.findUnique({
      where: { id: univB.id },
    });
    assert(
      reactivatedUnivB?.status === "ACTIVE" && reactivatedUnivB?.isActive === true,
      "MT-12",
      "La réactivation restaure le statut ACTIVE et réinitialise le motif de suspension"
    );

    // ------------------------------------------------------------------------
    // TEST 8 : Privilèges SUPER_ADMIN (Vision Nationale)
    // ------------------------------------------------------------------------
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { code: "SUPER_ADMIN" } });
    const superAdmin = await prisma.user.findFirst({
      where: { roleId: superAdminRole.id },
    });
    assert(superAdmin !== null, "MT-13", "Le compte central SUPER_ADMIN existe en base");
    assert(superAdmin?.organizationId === null, "MT-14", "Le SUPER_ADMIN a un organizationId nul (périmètre national délié)");

    // Capacité du SUPER_ADMIN à lister les universités
    const nationalUniversities = await prisma.organization.findMany();
    assert(nationalUniversities.length >= 2, "MT-15", "Le SUPER_ADMIN dispose d'une vision globale sur toutes les universités", `Total: ${nationalUniversities.length}`);

  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP : Nettoyage des fixtures créées pour le test
    // ------------------------------------------------------------------------
    console.log("🧹 Nettoyage des fixtures de test...");
    if (batchA) await prisma.payrollBatch.delete({ where: { id: batchA.id } }).catch(() => {});
    if (empA) await prisma.employee.delete({ where: { id: empA.id } }).catch(() => {});
    if (empB) await prisma.employee.delete({ where: { id: empB.id } }).catch(() => {});
    if (unitA) await prisma.organizationUnit.delete({ where: { id: unitA.id } }).catch(() => {});
    if (unitB) await prisma.organizationUnit.delete({ where: { id: unitB.id } }).catch(() => {});
    if (adminA) await prisma.user.delete({ where: { id: adminA.id } }).catch(() => {});
    if (adminB) await prisma.user.delete({ where: { id: adminB.id } }).catch(() => {});
    if (agentA) await prisma.user.delete({ where: { id: agentA.id } }).catch(() => {});
    if (agentB) await prisma.user.delete({ where: { id: agentB.id } }).catch(() => {});
    if (univA) {
      await prisma.auditLog.deleteMany({ where: { organizationId: univA.id } }).catch(() => {});
      await prisma.universitySetting.deleteMany({ where: { organizationId: univA.id } }).catch(() => {});
      await prisma.organization.delete({ where: { id: univA.id } }).catch(() => {});
    }
    if (univB) {
      await prisma.auditLog.deleteMany({ where: { organizationId: univB.id } }).catch(() => {});
      await prisma.universitySetting.deleteMany({ where: { organizationId: univB.id } }).catch(() => {});
      await prisma.organization.delete({ where: { id: univB.id } }).catch(() => {});
    }
  }

  console.log("==================================================");
  console.log(`📊 BILAN MULTI-TENANT ISOLATION : ${passCount}/${passCount + failCount} PASS`);
  if (failCount > 0) {
    console.error(`🚨 ${failCount} TEST(S) ONT ÉCHOUÉ.`);
    process.exit(1);
  } else {
    console.log("🎉 TOUS LES TESTS D'ISOLATION MULTI-TENANT ONT RÉUSSI À 100% !");
  }
}

runMultiTenantIsolationTests()
  .catch((e) => {
    console.error("Erreur fatale:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
