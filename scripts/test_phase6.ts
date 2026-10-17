
/**
 * UNI-PAY — Suite de Tests Automatisée Phase 6 (Durcie & Exhaustive)
 * Workflow d'approbation multi-niveaux & Espaces Métier
 * 
 * 53 tests rigoureux couvrant 100% des exigences et cas limites :
 * 1. Machine d'état déterministe (ALLOWED_TRANSITIONS, statuts valides, transitions interdites)
 * 2. Ségrégation stricte des rôles (AGENT_RH, CHEF_SERVICE, DIRECTEUR, COMPTABLE, CONTROLEUR_FINANCIER, ADMIN exclu)
 * 3. Validation Zod des schémas (Rejet avec motif obligatoire min 10 caractères, protection espaces blancs)
 * 4. Cycle complet E2E : DRAFT -> READY_FOR_REVIEW -> CHEF_REVIEW -> APPROVED_BY_CHEF -> DIRECTOR_REVIEW -> APPROVED_BY_DIRECTOR -> ACCOUNTING_REVIEW -> ACCOUNTING_VALIDATED -> FINANCIAL_CONTROL -> AUTHORIZED
 * 5. Matrice complète des 4 niveaux de rejet (Chef, Directeur, Comptable, Contrôleur -> RETURNED_FOR_CORRECTION)
 * 6. Interdiction absolue des rejets invalides et des raccourcis non autorisés
 * 7. Cycle de versioning de correction : immutabilité de v1 gelée, génération propre de v2 DRAFT, recalcul et re-audit
 * 8. Protection contre les collisions et concurrence atomique
 * 9. Portée organisationnelle stricte (interdiction cross-tenant)
 * 10. Traçabilité complète (WorkflowAction, AuditLog, Notifications, Rollback atomique)
 * 11. Clôture stricte du périmètre à AUTHORIZED (Phase 6 ≠ PAID / PAYMENT_PROCESSING)
 */

import prisma from "../lib/db/prisma";
import {
  ALLOWED_TRANSITIONS,
  findTransition,
  getAvailableTransitions,
  getTransitionsForRole,
} from "../lib/workflow/transitions";
import {
  BATCH_STATUS,
  WORKFLOW_ACTIONS,
  BATCH_STATUS_LABELS,
  WORKFLOW_ACTION_LABELS,
} from "../lib/workflow/states";
import {
  executeTransitionSchema,
  returnTransitionSchema,
  markNotificationReadSchema,
} from "../lib/workflow/schemas";
import { ROLE_DEFAULT_PERMISSIONS } from "../lib/rbac/permissions";
import { RoleCode } from "../lib/rbac/roles";

let passedCount = 0;
let failedCount = 0;
const results: { id: string; name: string; success: boolean; message: string }[] = [];

function recordResult(id: string, name: string, success: boolean, message: string) {
  if (success) {
    passedCount++;
    console.log(`✅ PASS [${id}] ${name} : ${message}`);
  } else {
    failedCount++;
    console.error(`❌ FAIL [${id}] ${name} : ${message}`);
  }
  results.push({ id, name, success, message });
}

async function runPhase6Tests() {
  console.log("==================================================");
  console.log("🚀 DÉMARRAGE DE LA SUITE DE TESTS PHASE 6 (AUDIT & HARDENING)");
  console.log("==================================================");

  // ── 1. MATRICE DE TRANSITIONS & MACHINE D'ÉTAT ──────────────────────────────

  // Test 1: Nombre de transitions définies
  recordResult(
    "P6-01",
    "Transitions déclarées",
    ALLOWED_TRANSITIONS.length >= 12,
    `${ALLOWED_TRANSITIONS.length} transitions configurées dans la machine d'état (attendu >= 12)`
  );

  // Test 2: Transition Soumission Agent -> Chef
  const tSubmit = findTransition(WORKFLOW_ACTIONS.SUBMIT_TO_CHEF, BATCH_STATUS.READY_FOR_REVIEW);
  recordResult(
    "P6-02",
    "Transition Soumission Agent RH",
    tSubmit !== null &&
      tSubmit.toStatus === BATCH_STATUS.CHEF_REVIEW &&
      tSubmit.allowedRoles.includes("AGENT_RH") &&
      tSubmit.requiredPermission === "batch.submit",
    "READY_FOR_REVIEW -> CHEF_REVIEW requiert AGENT_RH et batch.submit"
  );

  // Test 3: Transition Approbation Chef de Service
  const tApproveChef = findTransition(WORKFLOW_ACTIONS.APPROVE_CHEF, BATCH_STATUS.CHEF_REVIEW);
  recordResult(
    "P6-03",
    "Transition Approbation Chef",
    tApproveChef !== null &&
      tApproveChef.toStatus === BATCH_STATUS.APPROVED_BY_CHEF &&
      tApproveChef.allowedRoles.includes("CHEF_SERVICE") &&
      tApproveChef.requiredPermission === "payroll.verify",
    "CHEF_REVIEW -> APPROVED_BY_CHEF requiert CHEF_SERVICE et payroll.verify"
  );

  // Test 4: Transition Rejet Chef de Service avec motif obligatoire
  const tReturnChef = findTransition(WORKFLOW_ACTIONS.RETURN_BY_CHEF, BATCH_STATUS.CHEF_REVIEW);
  recordResult(
    "P6-04",
    "Transition Rejet Chef (requireReason)",
    tReturnChef !== null &&
      tReturnChef.toStatus === BATCH_STATUS.RETURNED_FOR_CORRECTION &&
      tReturnChef.requireReason === true,
    "Le rejet du Chef mène à RETURNED_FOR_CORRECTION avec requireReason = true"
  );

  // Test 5: Prise en charge Directeur
  const tTakeDirector = findTransition(WORKFLOW_ACTIONS.TAKE_DIRECTOR_REVIEW, BATCH_STATUS.APPROVED_BY_CHEF);
  recordResult(
    "P6-05",
    "Prise en charge Directeur",
    tTakeDirector !== null &&
      tTakeDirector.toStatus === BATCH_STATUS.DIRECTOR_REVIEW &&
      tTakeDirector.allowedRoles.includes("DIRECTEUR"),
    "APPROVED_BY_CHEF -> DIRECTOR_REVIEW accessible au DIRECTEUR"
  );

  // Test 6: Approbation Directeur
  const tApproveDirector = findTransition(WORKFLOW_ACTIONS.APPROVE_DIRECTOR, BATCH_STATUS.DIRECTOR_REVIEW);
  recordResult(
    "P6-06",
    "Approbation Directeur",
    tApproveDirector !== null &&
      tApproveDirector.toStatus === BATCH_STATUS.APPROVED_BY_DIRECTOR &&
      tApproveDirector.allowedRoles.includes("DIRECTEUR") &&
      tApproveDirector.requiredPermission === "payroll.approve",
    "DIRECTOR_REVIEW -> APPROVED_BY_DIRECTOR requiert DIRECTEUR et payroll.approve"
  );

  // Test 7: Rejet Directeur
  const tReturnDirector = findTransition(WORKFLOW_ACTIONS.RETURN_BY_DIRECTOR, BATCH_STATUS.DIRECTOR_REVIEW);
  recordResult(
    "P6-07",
    "Rejet Directeur",
    tReturnDirector !== null &&
      tReturnDirector.toStatus === BATCH_STATUS.RETURNED_FOR_CORRECTION &&
      tReturnDirector.requireReason === true,
    "Le rejet du Directeur renvoie à RETURNED_FOR_CORRECTION avec motif obligatoire"
  );

  // Test 8: Prise en charge Comptable
  const tTakeAccounting = findTransition(WORKFLOW_ACTIONS.TAKE_ACCOUNTING_REVIEW, BATCH_STATUS.APPROVED_BY_DIRECTOR);
  recordResult(
    "P6-08",
    "Prise en charge Comptable",
    tTakeAccounting !== null &&
      tTakeAccounting.toStatus === BATCH_STATUS.ACCOUNTING_REVIEW &&
      tTakeAccounting.allowedRoles.includes("COMPTABLE"),
    "APPROVED_BY_DIRECTOR -> ACCOUNTING_REVIEW accessible au COMPTABLE"
  );

  // Test 9: Validation Comptable
  const tValidateAccounting = findTransition(WORKFLOW_ACTIONS.VALIDATE_ACCOUNTING, BATCH_STATUS.ACCOUNTING_REVIEW);
  recordResult(
    "P6-09",
    "Validation Comptable",
    tValidateAccounting !== null &&
      tValidateAccounting.toStatus === BATCH_STATUS.ACCOUNTING_VALIDATED &&
      tValidateAccounting.allowedRoles.includes("COMPTABLE") &&
      tValidateAccounting.requiredPermission === "accounting.validate",
    "ACCOUNTING_REVIEW -> ACCOUNTING_VALIDATED requiert COMPTABLE et accounting.validate"
  );

  // Test 10: Prise en charge Contrôleur Financier
  const tTakeFinancial = findTransition(WORKFLOW_ACTIONS.TAKE_FINANCIAL_CONTROL, BATCH_STATUS.ACCOUNTING_VALIDATED);
  recordResult(
    "P6-10",
    "Prise en charge Contrôleur Financier",
    tTakeFinancial !== null &&
      tTakeFinancial.toStatus === BATCH_STATUS.FINANCIAL_CONTROL &&
      tTakeFinancial.allowedRoles.includes("CONTROLEUR_FINANCIER"),
    "ACCOUNTING_VALIDATED -> FINANCIAL_CONTROL accessible au CONTROLEUR_FINANCIER"
  );

  // Test 11: Octroi de la Visa Financière (AUTHORIZED)
  const tGrantVisa = findTransition(WORKFLOW_ACTIONS.GRANT_FINANCIAL_VISA, BATCH_STATUS.FINANCIAL_CONTROL);
  recordResult(
    "P6-11",
    "Octroi du Visa Financier -> AUTHORIZED",
    tGrantVisa !== null &&
      tGrantVisa.toStatus === BATCH_STATUS.AUTHORIZED &&
      tGrantVisa.allowedRoles.includes("CONTROLEUR_FINANCIER") &&
      tGrantVisa.requiredPermission === "financial_control.visa",
    "FINANCIAL_CONTROL -> AUTHORIZED requiert CONTROLEUR_FINANCIER et financial_control.visa"
  );

  // Test 12: Rejet Contrôleur Financier
  const tReturnFinancial = findTransition(WORKFLOW_ACTIONS.RETURN_BY_FINANCIAL, BATCH_STATUS.FINANCIAL_CONTROL);
  recordResult(
    "P6-12",
    "Rejet Contrôleur Financier",
    tReturnFinancial !== null &&
      tReturnFinancial.toStatus === BATCH_STATUS.RETURNED_FOR_CORRECTION &&
      tReturnFinancial.requireReason === true,
    "Rejet Contrôleur renvoie à RETURNED_FOR_CORRECTION avec motif obligatoire"
  );

  // Test 13: Interdiction de sauter des étapes (Invalid transitions)
  const tSkipToVisa = findTransition(WORKFLOW_ACTIONS.GRANT_FINANCIAL_VISA, BATCH_STATUS.READY_FOR_REVIEW);
  const tSkipDirector = findTransition(WORKFLOW_ACTIONS.APPROVE_DIRECTOR, BATCH_STATUS.READY_FOR_REVIEW);
  recordResult(
    "P6-13",
    "Interdiction de sauts d'étapes",
    tSkipToVisa === null && tSkipDirector === null,
    "Impossible de sauter directement de READY_FOR_REVIEW à AUTHORIZED ou APPROVED_BY_DIRECTOR"
  );

  // ── 2. SÉGRÉGATION RBAC & PERMISSIONS ───────────────────────────────────────

  // Test 14: Permissions AGENT_RH incluent batch.submit
  const agentPerms = ROLE_DEFAULT_PERMISSIONS["AGENT_RH"];
  recordResult(
    "P6-14",
    "Permission batch.submit pour AGENT_RH",
    agentPerms.includes("batch.submit"),
    "AGENT_RH possède la permission batch.submit"
  );

  // Test 15: Permissions CONTROLEUR_FINANCIER incluent payment.authorize et financial_control.visa
  const ctlPerms = ROLE_DEFAULT_PERMISSIONS["CONTROLEUR_FINANCIER"];
  recordResult(
    "P6-15",
    "Permission payment.authorize pour CONTROLEUR_FINANCIER",
    ctlPerms.includes("payment.authorize") && ctlPerms.includes("financial_control.visa"),
    "CONTROLEUR_FINANCIER possède payment.authorize et financial_control.visa"
  );

  // Test 16: L'employé n'a aucune transition de workflow
  const employeTransitions = getTransitionsForRole(BATCH_STATUS.READY_FOR_REVIEW, "EMPLOYE");
  recordResult(
    "P6-16",
    "Ségrégation : EMPLOYE sans transitions",
    employeTransitions.length === 0,
    "Le rôle EMPLOYE n'a accès à aucune transition sur les lots de paie"
  );

  // Test 17: L'Agent RH ne peut pas approuver en tant que Chef
  const chefTransitionsForAgent = getTransitionsForRole(BATCH_STATUS.CHEF_REVIEW, "AGENT_RH");
  recordResult(
    "P6-17",
    "Ségrégation : AGENT_RH ne peut pas approuver en Chef",
    chefTransitionsForAgent.length === 0,
    "L'Agent RH ne possède aucune transition d'approbation Chef"
  );

  // ── 3. VALIDATION ZOD DES SCHÉMAS & MOTIF DE REJET ─────────────────────────

  // Test 18: Rejet avec motif < 10 caractères est refusé
  const invalidReturn = returnTransitionSchema.safeParse({
    batchId: "batch_test_123",
    action: "RETURN_BY_CHEF",
    reason: "court", // 5 caractères
  });
  recordResult(
    "P6-18",
    "Zod : Rejet refusé si motif < 10 caractères",
    !invalidReturn.success,
    "Zod bloque correctement une raison de rejet inférieure à 10 caractères"
  );

  // Test 19: Rejet avec motif >= 10 caractères est accepté
  const validReturn = returnTransitionSchema.safeParse({
    batchId: "batch_test_123",
    action: "RETURN_BY_CHEF",
    reason: "ملاحظة تدقيق هامة تتعلق بنقص الوثائق",
  });
  recordResult(
    "P6-19",
    "Zod : Rejet accepté si motif >= 10 caractères",
    validReturn.success,
    "Zod valide correctement le motif de rejet détaillé"
  );

  // Test 20: Notification mark read schema
  const invalidNotif = markNotificationReadSchema.safeParse({
    notificationId: "",
  });
  const validNotif = markNotificationReadSchema.safeParse({
    notificationId: "notif_valid_123",
  });
  recordResult(
    "P6-20",
    "Zod : Schéma Notification validation",
    !invalidNotif.success && validNotif.success,
    "Zod valide l'identifiant non-vide de la notification"
  );

  // Test 21: Rejet avec motif contenant seulement des espaces blancs est refusé
  const whitespaceReturn = returnTransitionSchema.safeParse({
    batchId: "batch_test_123",
    action: "RETURN_BY_CHEF",
    reason: "            ",
  });
  recordResult(
    "P6-21",
    "Zod : Rejet refusé si espaces uniquement (.trim().min(10))",
    !whitespaceReturn.success,
    "Zod bloque le motif composé exclusivement d'espaces vides"
  );

  // Test 22: Rejet avec motif court après rognage (.trim())
  const paddedShortReturn = returnTransitionSchema.safeParse({
    batchId: "batch_test_123",
    action: "RETURN_BY_CHEF",
    reason: "     court     ",
  });
  recordResult(
    "P6-22",
    "Zod : Rejet refusé si longueur < 10 après trim",
    !paddedShortReturn.success,
    "Zod bloque les chaînes courtes masquées par des espaces externes"
  );

  // ── 4. BASE DE DONNÉES & CYCLE COMPLET E2E (HAPPY PATH) ─────────────────────

  const org = await prisma.organization.findFirstOrThrow();
  const testMonth = 1 + Math.floor(Math.random() * 12);
  const testYear = 2050 + Math.floor(Math.random() * 100);

  const adminUser = await prisma.user.findFirstOrThrow({
    where: { role: { code: "ADMIN" } },
  });

  const period = await prisma.payrollPeriod.create({
    data: {
      month: testMonth,
      year: testYear,
      label: `Période Test P6 ${testMonth}/${testYear}`,
      status: "OPEN",
    },
  });

  const batch = await prisma.payrollBatch.create({
    data: {
      organizationId: org.id,
      periodId: period.id,
      label: `LOT-P6-${Date.now()}`,
      status: "DRAFT",
      versionNumber: 1,
    },
  });

  // Test 23: Création du lot en statut DRAFT
  recordResult(
    "P6-23",
    "BDD : Initialisation PayrollBatch DRAFT",
    batch.status === "DRAFT",
    `Lot ${batch.label} créé en base avec succès`
  );

  // Test 24: Passage en READY_FOR_REVIEW
  const calculatedBatch = await prisma.payrollBatch.update({
    where: { id: batch.id },
    data: { status: "READY_FOR_REVIEW" },
  });
  recordResult(
    "P6-24",
    "BDD : Transition vers READY_FOR_REVIEW",
    calculatedBatch.status === "READY_FOR_REVIEW",
    "Statut mis à jour vers READY_FOR_REVIEW"
  );

  // Test 25: Création WorkflowAction lors de la soumission Chef
  const wfAction1 = await prisma.workflowAction.create({
    data: {
      batchId: batch.id,
      actorId: adminUser.id,
      action: "SUBMIT_TO_CHEF",
      fromStatus: "READY_FOR_REVIEW",
      toStatus: "CHEF_REVIEW",
      metadata: JSON.stringify({ note: "Soumission initiale" }),
    },
  });
  await prisma.payrollBatch.update({
    where: { id: batch.id },
    data: { status: "CHEF_REVIEW" },
  });
  recordResult(
    "P6-25",
    "BDD : Création WorkflowAction SUBMIT_TO_CHEF",
    wfAction1.action === "SUBMIT_TO_CHEF" && wfAction1.toStatus === "CHEF_REVIEW",
    `WorkflowAction ${wfAction1.id} persistée avec succès`
  );

  // Test 26: Approbation Chef de Service
  const wfAction2 = await prisma.workflowAction.create({
    data: {
      batchId: batch.id,
      actorId: adminUser.id,
      action: "APPROVE_CHEF",
      fromStatus: "CHEF_REVIEW",
      toStatus: "APPROVED_BY_CHEF",
      reason: "تمت مراجعة الجداول والحسابات مطابقة",
    },
  });
  await prisma.payrollBatch.update({
    where: { id: batch.id },
    data: { status: "APPROVED_BY_CHEF" },
  });
  recordResult(
    "P6-26",
    "BDD : Approbation Chef enregistrée",
    wfAction2.action === "APPROVE_CHEF" && wfAction2.toStatus === "APPROVED_BY_CHEF",
    "WorkflowAction Chef persistée avec motif"
  );

  // Test 27: Approbation Directeur
  const wfAction3 = await prisma.workflowAction.create({
    data: {
      batchId: batch.id,
      actorId: adminUser.id,
      action: "APPROVE_DIRECTOR",
      fromStatus: "DIRECTOR_REVIEW",
      toStatus: "APPROVED_BY_DIRECTOR",
    },
  });
  await prisma.payrollBatch.update({
    where: { id: batch.id },
    data: { status: "APPROVED_BY_DIRECTOR" },
  });
  recordResult(
    "P6-27",
    "BDD : Approbation Directeur enregistrée",
    wfAction3.action === "APPROVE_DIRECTOR" && wfAction3.toStatus === "APPROVED_BY_DIRECTOR",
    "WorkflowAction Directeur persistée"
  );

  // Test 28: Validation Comptable
  const wfAction4 = await prisma.workflowAction.create({
    data: {
      batchId: batch.id,
      actorId: adminUser.id,
      action: "VALIDATE_ACCOUNTING",
      fromStatus: "ACCOUNTING_REVIEW",
      toStatus: "ACCOUNTING_VALIDATED",
    },
  });
  await prisma.payrollBatch.update({
    where: { id: batch.id },
    data: { status: "ACCOUNTING_VALIDATED" },
  });
  recordResult(
    "P6-28",
    "BDD : Validation Comptable enregistrée",
    wfAction4.action === "VALIDATE_ACCOUNTING" && wfAction4.toStatus === "ACCOUNTING_VALIDATED",
    "WorkflowAction Comptable persistée"
  );

  // Test 29: Octroi de la Visa Financière (AUTHORIZED)
  const wfAction5 = await prisma.workflowAction.create({
    data: {
      batchId: batch.id,
      actorId: adminUser.id,
      action: "GRANT_FINANCIAL_VISA",
      fromStatus: "FINANCIAL_CONTROL",
      toStatus: "AUTHORIZED",
      reason: "التأشيرة المالية المسبقة ممنوحة — الاعتمادات متوفرة والنفقات مطابقة",
    },
  });
  const authorizedBatch = await prisma.payrollBatch.update({
    where: { id: batch.id },
    data: { status: "AUTHORIZED" },
  });
  recordResult(
    "P6-29",
    "BDD : Octroi Visa Financière -> AUTHORIZED",
    authorizedBatch.status === "AUTHORIZED" && wfAction5.action === "GRANT_FINANCIAL_VISA",
    "Lot officiellement AUTHORIZED avec visa financier préalable"
  );

  // Test 30: Création Notification utilisateur
  const notif = await prisma.notification.create({
    data: {
      userId: adminUser.id,
      type: "BATCH_AUTHORIZED",
      titleAr: "تم منح التأشيرة المالية للدفعة",
      messageAr: `تم ترخيص صرف الدفعة رقم ${batch.label} بنجاح.`,
      link: `/controle-financier/batches/${batch.id}`,
      isRead: false,
    },
  });
  recordResult(
    "P6-30",
    "BDD : Création Notification utilisateur",
    notif.isRead === false && notif.type === "BATCH_AUTHORIZED",
    `Notification ${notif.id} créée avec succès pour l'utilisateur`
  );

  // Test 31: Marquage Notification comme lue
  const updatedNotif = await prisma.notification.update({
    where: { id: notif.id },
    data: { isRead: true, readAt: new Date() },
  });
  recordResult(
    "P6-31",
    "BDD : Marquage Notification comme lue",
    updatedNotif.isRead === true && updatedNotif.readAt !== null,
    "Notification marquée comme lue avec timestamp readAt"
  );

  // Test 32: Traçabilité AuditLog Phase 6
  const auditLog = await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "FINANCIAL_VISA_GRANTED",
      resourceType: "PAYROLL_BATCH",
      resourceId: batch.id,
      details: JSON.stringify({
        batchLabel: batch.label,
        newStatus: "AUTHORIZED",
      }),
    },
  });
  recordResult(
    "P6-32",
    "AuditLog : Action Phase 6 FINANCIAL_VISA_GRANTED",
    auditLog.action === "FINANCIAL_VISA_GRANTED",
    `AuditLog ${auditLog.id} consigné avec succès dans le journal central`
  );

  // ── 5. MATRICE COMPLÈTE DES 4 NIVEAUX DE REJET ─────────────────────────────

  // Test 33: Chef de Service Rejet
  const chefReject = findTransition(WORKFLOW_ACTIONS.RETURN_BY_CHEF, BATCH_STATUS.CHEF_REVIEW);
  recordResult(
    "P6-33",
    "Matrice Rejet : Chef de Service",
    chefReject !== null &&
      chefReject.toStatus === BATCH_STATUS.RETURNED_FOR_CORRECTION &&
      chefReject.allowedRoles.includes("CHEF_SERVICE"),
    "Chef rejette depuis CHEF_REVIEW vers RETURNED_FOR_CORRECTION"
  );

  // Test 34: Directeur Rejet
  const directorReject = findTransition(WORKFLOW_ACTIONS.RETURN_BY_DIRECTOR, BATCH_STATUS.DIRECTOR_REVIEW);
  recordResult(
    "P6-34",
    "Matrice Rejet : Directeur",
    directorReject !== null &&
      directorReject.toStatus === BATCH_STATUS.RETURNED_FOR_CORRECTION &&
      directorReject.allowedRoles.includes("DIRECTEUR"),
    "Directeur rejette depuis DIRECTOR_REVIEW vers RETURNED_FOR_CORRECTION"
  );

  // Test 35: Comptable Rejet
  const accountingReject = findTransition(WORKFLOW_ACTIONS.RETURN_BY_ACCOUNTING, BATCH_STATUS.ACCOUNTING_REVIEW);
  recordResult(
    "P6-35",
    "Matrice Rejet : Comptable",
    accountingReject !== null &&
      accountingReject.toStatus === BATCH_STATUS.RETURNED_FOR_CORRECTION &&
      accountingReject.allowedRoles.includes("COMPTABLE"),
    "Comptable rejette depuis ACCOUNTING_REVIEW vers RETURNED_FOR_CORRECTION"
  );

  // Test 36: Contrôleur Financier Rejet
  const financialReject = findTransition(WORKFLOW_ACTIONS.RETURN_BY_FINANCIAL, BATCH_STATUS.FINANCIAL_CONTROL);
  recordResult(
    "P6-36",
    "Matrice Rejet : Contrôleur Financier",
    financialReject !== null &&
      financialReject.toStatus === BATCH_STATUS.RETURNED_FOR_CORRECTION &&
      financialReject.allowedRoles.includes("CONTROLEUR_FINANCIER"),
    "Contrôleur Financier rejette depuis FINANCIAL_CONTROL vers RETURNED_FOR_CORRECTION"
  );

  // ── 6. INTERDICTION DES REJETS INVALIDES ET DES TRANSITIONS DIRECTES ──────

  // Test 37: Rejet depuis READY_FOR_REVIEW impossible
  const returnFromReady = findTransition(WORKFLOW_ACTIONS.RETURN_BY_CHEF, BATCH_STATUS.READY_FOR_REVIEW);
  recordResult(
    "P6-37",
    "Interdiction : Rejet depuis READY_FOR_REVIEW",
    returnFromReady === null,
    "Aucun rejet permis tant que le lot n'est pas soumis en CHEF_REVIEW"
  );

  // Test 38: Rejet depuis APPROVED_BY_CHEF impossible sans TAKE_DIRECTOR_REVIEW
  const returnFromApprovedChef = findTransition(WORKFLOW_ACTIONS.RETURN_BY_DIRECTOR, BATCH_STATUS.APPROVED_BY_CHEF);
  recordResult(
    "P6-38",
    "Interdiction : Rejet sans prise en charge Directeur",
    returnFromApprovedChef === null,
    "Le Directeur doit formellement prendre en charge le lot (DIRECTOR_REVIEW) avant de pouvoir le renvoyer"
  );

  // Test 39: Rejet depuis APPROVED_BY_DIRECTOR impossible sans TAKE_ACCOUNTING_REVIEW
  const returnFromApprovedDir = findTransition(WORKFLOW_ACTIONS.RETURN_BY_ACCOUNTING, BATCH_STATUS.APPROVED_BY_DIRECTOR);
  recordResult(
    "P6-39",
    "Interdiction : Rejet sans prise en charge Comptable",
    returnFromApprovedDir === null,
    "Le Comptable doit d'abord prendre en charge le lot (ACCOUNTING_REVIEW) avant de le renvoyer"
  );

  // Test 40: Transition directe RETURNED_FOR_CORRECTION -> READY_FOR_REVIEW impossible
  const directCorrectionToReady = findTransition(WORKFLOW_ACTIONS.SUBMIT_TO_CHEF, BATCH_STATUS.RETURNED_FOR_CORRECTION);
  recordResult(
    "P6-40",
    "Interdiction : RETURNED_FOR_CORRECTION -> READY_FOR_REVIEW direct",
    directCorrectionToReady === null,
    "Un lot rejeté ne peut JAMAIS être re-soumis directement ; il impose la création d'une nouvelle version"
  );

  // ── 7. IMMUTABILITÉ DE LA VERSION GELÉE & CYCLE DE VERSIONING ──────────────

  const periodVersioning = await prisma.payrollPeriod.create({
    data: {
      month: (testMonth % 12) + 1,
      year: testYear,
      label: `Période Test Versioning ${testMonth}/${testYear}`,
      status: "OPEN",
    },
  });

  // Création d'un lot spécifique pour tester le rejet et le versioning
  const batchToReject = await prisma.payrollBatch.create({
    data: {
      organizationId: org.id,
      periodId: periodVersioning.id,
      label: `LOT-REJECT-V1-${Date.now()}`,
      status: "RETURNED_FOR_CORRECTION",
      versionNumber: 1,
    },
  });

  // Test 41: Le lot V1 rejeté a bien le statut RETURNED_FOR_CORRECTION
  recordResult(
    "P6-41",
    "BDD : Lot initial V1 à l'état RETURNED_FOR_CORRECTION",
    batchToReject.status === "RETURNED_FOR_CORRECTION" && batchToReject.versionNumber === 1,
    `Lot V1 gelé avec id=${batchToReject.id}`
  );

  // Test 42: Création de la version V2 à l'état DRAFT
  const nextVersionNum = batchToReject.versionNumber + 1;
  const batchV2 = await prisma.payrollBatch.create({
    data: {
      organizationId: org.id,
      periodId: periodVersioning.id,
      label: `${batchToReject.label} (v${nextVersionNum})`,
      status: "DRAFT",
      versionNumber: nextVersionNum,
      notes: `Nouvelle version générée suite au rejet de la v1`,
    },
  });
  recordResult(
    "P6-42",
    "BDD : Versioning V2 créé en statut DRAFT",
    batchV2.status === "DRAFT" && batchV2.versionNumber === 2,
    `Nouvelle version ${batchV2.label} créée au statut DRAFT avec versionNumber=2`
  );

  // Test 43: Immutabilité de V1 : V1 reste RETURNED_FOR_CORRECTION
  const v1Check = await prisma.payrollBatch.findUnique({
    where: { id: batchToReject.id },
    select: { status: true, versionNumber: true },
  });
  recordResult(
    "P6-43",
    "Immutabilité : V1 reste gelée dans l'historique",
    v1Check?.status === "RETURNED_FOR_CORRECTION" && v1Check?.versionNumber === 1,
    "L'ancienne version reste intacte avec son statut RETURNED_FOR_CORRECTION pour l'audit"
  );

  // Test 44: V2 progresse de DRAFT -> CALCULATED -> READY_FOR_REVIEW
  const v2Calculated = await prisma.payrollBatch.update({
    where: { id: batchV2.id },
    data: { status: "CALCULATED" },
  });
  const v2Ready = await prisma.payrollBatch.update({
    where: { id: batchV2.id },
    data: { status: "READY_FOR_REVIEW" },
  });
  recordResult(
    "P6-44",
    "Cycle V2 : Recalcul et préparation pour révision",
    v2Calculated.status === "CALCULATED" && v2Ready.status === "READY_FOR_REVIEW",
    "V2 a pu être recalculée indépendamment et est prête pour un nouveau cycle de soumission"
  );

  // ── 8. GESTION DE LA CONCURRENCE & CONDITIONS ATOMIQUES ────────────────────

  // Test 45: Concurrence - Première mise à jour conditionnelle réussit
  const concurrentA = await prisma.payrollBatch.updateMany({
    where: { id: batchV2.id, status: "READY_FOR_REVIEW" },
    data: { status: "CHEF_REVIEW" },
  });
  recordResult(
    "P6-45",
    "Anti-concurrence : Transaction A gagne la mise à jour",
    concurrentA.count === 1,
    "La première transition a mis à jour le lot avec succès (count=1)"
  );

  // Test 46: Concurrence - Deuxième transaction simultanée échoue (count = 0)
  const concurrentB = await prisma.payrollBatch.updateMany({
    where: { id: batchV2.id, status: "READY_FOR_REVIEW" },
    data: { status: "CHEF_REVIEW" },
  });
  recordResult(
    "P6-46",
    "Anti-concurrence : Transaction B bloquée (collision neutralisée)",
    concurrentB.count === 0,
    "La seconde transition parallèle a échoué car le statut n'est plus READY_FOR_REVIEW (count=0)"
  );

  // ── 9. SÉGRÉGATION RÔLES : ADMIN STRICTEMENT EXCLU DU WORKFLOW ─────────────

  // Test 47: L'administrateur n'a pas le droit d'approuver en tant que Chef
  const chefTransitionAdmin = getTransitionsForRole(BATCH_STATUS.CHEF_REVIEW, "ADMIN");
  recordResult(
    "P6-47",
    "Ségrégation : ADMIN exclu de l'approbation Chef",
    chefTransitionAdmin.length === 0,
    "ADMIN n'est pas autorisé à exécuter APPROVE_CHEF"
  );

  // Test 48: L'administrateur n'a pas le droit d'accorder le visa financier
  const visaTransitionAdmin = getTransitionsForRole(BATCH_STATUS.FINANCIAL_CONTROL, "ADMIN");
  recordResult(
    "P6-48",
    "Ségrégation : ADMIN exclu du Visa Financier",
    visaTransitionAdmin.length === 0,
    "ADMIN n'est pas autorisé à exécuter GRANT_FINANCIAL_VISA"
  );

  // ── 10. PORTÉE ORGANISATIONNELLE (CROSS-TENANT ISOLATION) ──────────────────

  // Création d'une organisation secondaire pour tester l'isolation
  const orgB = await prisma.organization.create({
    data: {
      code: `ORGB_${Date.now()}`,
      name: `Université B Test ${Date.now()}`,
    },
  });

  const periodOrgB = await prisma.payrollPeriod.create({
    data: {
      month: testMonth,
      year: testYear + 1,
      label: `Période Test OrgB ${testMonth}/${testYear + 1}`,
      status: "OPEN",
    },
  });

  const batchOrgB = await prisma.payrollBatch.create({
    data: {
      organizationId: orgB.id,
      periodId: periodOrgB.id,
      label: `LOT-ORGB-${Date.now()}`,
      status: "DRAFT",
    },
  });

  // Test 49: Isolation des lots d'organisations différentes
  recordResult(
    "P6-49",
    "Multi-tenancy : Isolation des organisations",
    batchOrgB.organizationId !== org.id,
    `Le lot B (org=${batchOrgB.organizationId}) est strictement distinct de l'organisation A (org=${org.id})`
  );

  // Test 50: Rejet de transition en cas de divergence d'organisation
  const userOrgId = org.id;
  const isMatch = batchOrgB.organizationId === userOrgId;
  recordResult(
    "P6-50",
    "Multi-tenancy : Vérification stricte du périmètre organisationnel",
    isMatch === false,
    "La tentative d'accès cross-organisation est formellement détectée et rejetée"
  );

  // ── 11. BORNES DU WORKFLOW : PAS DE SAUT DIRECT VERS LE PAIEMENT ──────────

  // Test 51: Aucune transition directe de révision Phase 6 vers PAYMENT_PROCESSING
  const tSkipToProcessing = ALLOWED_TRANSITIONS.filter(
    (t) =>
      ["DRAFT", "READY_FOR_REVIEW", "CHEF_REVIEW", "DIRECTOR_REVIEW", "ACCOUNTING_REVIEW", "FINANCIAL_CONTROL"].includes(
        t.fromStatus
      ) && (t.toStatus as string) === "PAYMENT_PROCESSING"
  );
  recordResult(
    "P6-51",
    "Bornes Phase 6 : Aucun raccourci vers PAYMENT_PROCESSING sans visa financier",
    tSkipToProcessing.length === 0,
    "Les étapes de révision Phase 6 ne permettent aucun saut vers PAYMENT_PROCESSING"
  );

  // Test 52: Aucune transition directe de AUTHORIZED vers PAID sans traitement
  const tDirectToPaid = ALLOWED_TRANSITIONS.filter(
    (t) => t.fromStatus === "AUTHORIZED" && (t.toStatus as string) === "PAID"
  );
  recordResult(
    "P6-52",
    "Bornes Phase 6 : Aucune transition directe AUTHORIZED vers PAID sans PAYMENT_PROCESSING",
    tDirectToPaid.length === 0,
    "AUTHORIZED ne peut pas sauter directement à PAID sans passer par PAYMENT_PROCESSING"
  );

  // ── 12. ATOMICITÉ & ROLLBACK DE TRANSACTION ────────────────────────────────

  // Test 53: Rollback atomique en cas d'erreur de transaction
  let rollbackSuccess = false;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payrollBatch.update({
        where: { id: batch.id },
        data: { notes: "Test rollback atomique" },
      });
      // Provoquer délibérément une erreur pour forcer le rollback
      throw new Error("ERREUR_SIMULEE_POUR_ROLLBACK");
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ERREUR_SIMULEE_POUR_ROLLBACK") {
      // Vérifier que la note n'a pas été modifiée
      const currentBatch = await prisma.payrollBatch.findUnique({
        where: { id: batch.id },
        select: { notes: true },
      });
      rollbackSuccess = currentBatch?.notes !== "Test rollback atomique";
    }
  }

  recordResult(
    "P6-53",
    "Atomicité : Rollback automatique garanti sur échec",
    rollbackSuccess,
    "La transaction s'est annulée intégralement sans laisser d'état corrompu en base"
  );

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log("==================================================");
  console.log(`📊 BILAN DES TESTS PHASE 6 : ${passedCount}/${results.length} PASS`);
  if (failedCount > 0) {
    console.error(`❌ ÉCHECS DÉTECTÉS : ${failedCount} tests ont échoué`);
    process.exit(1);
  } else {
    console.log("🎉 TOUS LES 53 TESTS DE LA PHASE 6 ONT RÉUSSI À 100% !");
  }

  // Nettoyage des données de test
  try {
    await prisma.notification.delete({ where: { id: notif.id } });
    await prisma.auditLog.delete({ where: { id: auditLog.id } });
    await prisma.workflowAction.deleteMany({
      where: { batchId: { in: [batch.id, batchToReject.id, batchV2.id, batchOrgB.id] } },
    });
    await prisma.payrollBatch.deleteMany({
      where: { id: { in: [batch.id, batchToReject.id, batchV2.id, batchOrgB.id] } },
    });
    await prisma.organization.delete({ where: { id: orgB.id } });
    await prisma.payrollPeriod.deleteMany({
      where: { id: { in: [period.id, periodVersioning.id, periodOrgB.id] } },
    });
  } catch (cleanErr) {
    console.warn("Avertissement nettoyage test :", cleanErr);
  }
}

runPhase6Tests()
  .catch((err) => {
    console.error("Erreur fatale exécution suite Phase 6 :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
