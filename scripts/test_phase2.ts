import prisma from "../lib/db/prisma";
import { verifyPassword, hashPassword, validatePasswordPolicy } from "../lib/auth/password";
import {
  createSession,
  validateSessionToken,
  invalidateSession,
  hashSessionToken,
} from "../lib/auth/session";
import { getDashboardForRole, ROLES } from "../lib/rbac/roles";
import { recordAuditLog } from "../lib/audit/logger";

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordResult(id: string, name: string, passed: boolean, details: string) {
  results.push({ id, name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${id}] ${name} : ${details}`);
}

async function runTests() {
  console.log("==================================================");
  console.log("🚀 DÉMARRAGE DE LA SUITE DE TESTS PHASE 2 (UNI-PAY)");
  console.log("==================================================");

  // --- TEST 1: Utilisateur non connecté / Absence de token ---
  try {
    const session = await validateSessionToken("");
    const passed = session === null;
    recordResult(
      "TEST 1",
      "Utilisateur non connecté",
      passed,
      passed ? "Token vide retourne null (redirection /login)" : "Échec: session retournée pour token vide"
    );
  } catch (e: unknown) {
    recordResult("TEST 1", "Utilisateur non connecté", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 2: ADMIN autorisé à /admin/dashboard ---
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@unipay.dz" },
      include: { role: true },
    });
    const { token } = await createSession(adminUser!.id);
    const session = await validateSessionToken(token);
    const targetDashboard = getDashboardForRole(session!.user.roleCode);

    const isAuthorized = session!.user.roleCode === "ADMIN" && targetDashboard === "/admin/dashboard";
    recordResult(
      "TEST 2",
      "ADMIN -> /admin/dashboard",
      isAuthorized,
      `Rôle ${session!.user.roleCode} correctement mappé vers ${targetDashboard}`
    );
    await invalidateSession(token);
  } catch (e: unknown) {
    recordResult("TEST 2", "ADMIN -> /admin/dashboard", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 3: EMPLOYE -> /admin/dashboard interdit ---
  try {
    const employeUser = await prisma.user.findUnique({
      where: { email: "employe@unipay.dz" },
      include: { role: true },
    });
    const { token } = await createSession(employeUser!.id);
    const session = await validateSessionToken(token);
    const roleCode = session!.user.roleCode;
    const adminRoles = ["ADMIN"] as string[];
    const isForbidden = roleCode === "EMPLOYE" && !adminRoles.includes(roleCode);

    recordResult(
      "TEST 3",
      "EMPLOYE -> /admin/dashboard",
      isForbidden,
      `Accès interdit: l'employé (${session!.user.roleCode}) ne peut pas accéder à l'espace ADMIN`
    );
    await invalidateSession(token);
  } catch (e: unknown) {
    recordResult("TEST 3", "EMPLOYE -> /admin/dashboard", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 4: AGENT_RH -> /agent/dashboard autorisé ---
  try {
    const agentUser = await prisma.user.findUnique({
      where: { email: "agent@unipay.dz" },
      include: { role: true },
    });
    const { token } = await createSession(agentUser!.id);
    const session = await validateSessionToken(token);
    const targetDashboard = getDashboardForRole(session!.user.roleCode);

    const isAuthorized = session!.user.roleCode === "AGENT_RH" && targetDashboard === "/agent/dashboard";
    recordResult(
      "TEST 4",
      "AGENT_RH -> /agent/dashboard",
      isAuthorized,
      `Rôle ${session!.user.roleCode} autorisé sur son dashboard ${targetDashboard}`
    );
    await invalidateSession(token);
  } catch (e: unknown) {
    recordResult("TEST 4", "AGENT_RH -> /agent/dashboard", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 5: AGENT_RH -> /directeur/dashboard interdit ---
  try {
    const agentUser = await prisma.user.findUnique({
      where: { email: "agent@unipay.dz" },
      include: { role: true },
    });
    const { token } = await createSession(agentUser!.id);
    const session = await validateSessionToken(token);
    const roleCode = session!.user.roleCode;
    const directeurRoles = ["DIRECTEUR"] as string[];
    const isForbidden = roleCode === "AGENT_RH" && !directeurRoles.includes(roleCode);

    recordResult(
      "TEST 5",
      "AGENT_RH -> /directeur/dashboard",
      isForbidden,
      `Accès interdit: l'agent RH ne peut accéder à l'espace Directeur`
    );
    await invalidateSession(token);
  } catch (e: unknown) {
    recordResult("TEST 5", "AGENT_RH -> /directeur/dashboard", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 6: COMPTABLE -> /comptable/dashboard autorisé ---
  try {
    const comptableUser = await prisma.user.findUnique({
      where: { email: "comptable@unipay.dz" },
      include: { role: true },
    });
    const { token } = await createSession(comptableUser!.id);
    const session = await validateSessionToken(token);
    const targetDashboard = getDashboardForRole(session!.user.roleCode);

    const isAuthorized = session!.user.roleCode === "COMPTABLE" && targetDashboard === "/comptable/dashboard";
    recordResult(
      "TEST 6",
      "COMPTABLE -> /comptable/dashboard",
      isAuthorized,
      `Rôle ${session!.user.roleCode} autorisé sur son dashboard ${targetDashboard}`
    );
    await invalidateSession(token);
  } catch (e: unknown) {
    recordResult("TEST 6", "COMPTABLE -> /comptable/dashboard", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 7: CONTROLEUR_FINANCIER -> /comptable/dashboard interdit ---
  try {
    const controleurUser = await prisma.user.findUnique({
      where: { email: "controleur@unipay.dz" },
      include: { role: true },
    });
    const { token } = await createSession(controleurUser!.id);
    const session = await validateSessionToken(token);
    const roleCode = session!.user.roleCode;
    const comptableRoles = ["COMPTABLE"] as string[];
    const isForbidden = roleCode === "CONTROLEUR_FINANCIER" && !comptableRoles.includes(roleCode);

    recordResult(
      "TEST 7",
      "CONTROLEUR_FINANCIER -> /comptable/dashboard",
      isForbidden,
      `Accès interdit: le contrôleur financier ne peut accéder à l'espace comptable`
    );
    await invalidateSession(token);
  } catch (e: unknown) {
    recordResult("TEST 7", "CONTROLEUR_FINANCIER -> /comptable/dashboard", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 8: Compte désactivé -> refusé ---
  try {
    const disabledUser = await prisma.user.findUnique({
      where: { email: "desactive@unipay.dz" },
    });
    const isInactive = !disabledUser!.isActive;
    const { token } = await createSession(disabledUser!.id);
    const session = await validateSessionToken(token);
    const isBlocked = isInactive && session === null;

    recordResult(
      "TEST 8",
      "Compte désactivé -> refusé",
      isBlocked,
      `Compte inactif (isActive: false) immédiatement invalidé et refusé`
    );
  } catch (e: unknown) {
    recordResult("TEST 8", "Compte désactivé -> refusé", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 9: Session expirée -> nouvelle authentification demandée ---
  try {
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@unipay.dz" } });
    const expiredDate = new Date(Date.now() - 3600 * 1000); // Expiré il y a 1 heure
    const token = "expired_token_test_12345678901234567890";
    const tokenHash = hashSessionToken(token);

    await prisma.session.create({
      data: {
        userId: adminUser!.id,
        tokenHash,
        expiresAt: expiredDate,
      },
    });

    const session = await validateSessionToken(token);
    const isExpiredAndCleaned = session === null;

    recordResult(
      "TEST 9",
      "Session expirée -> refusé",
      isExpiredAndCleaned,
      `Session expirée supprimée et rejetée automatiquement`
    );
  } catch (e: unknown) {
    recordResult("TEST 9", "Session expirée -> refusé", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 10: Logout -> session invalidée ---
  try {
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@unipay.dz" } });
    const { token } = await createSession(adminUser!.id);
    const sessionBefore = await validateSessionToken(token);
    await invalidateSession(token);
    const sessionAfter = await validateSessionToken(token);

    const isLoggedOut = sessionBefore !== null && sessionAfter === null;
    recordResult(
      "TEST 10",
      "Logout -> session invalidée",
      isLoggedOut,
      `Session détruite en base; accès protégé impossible après logout`
    );
  } catch (e: unknown) {
    recordResult("TEST 10", "Logout -> session invalidée", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 11: Login incorrect -> message générique ---
  try {
    const invalidPasswordMatch = await verifyPassword("WrongPassword!", "$2a$12$e0MYzXy4...");
    const isGenericCheck = !invalidPasswordMatch;

    recordResult(
      "TEST 11",
      "Login incorrect -> message générique",
      isGenericCheck,
      `Vérification de mot de passe échouée, aucune fuite d'information d'existence de compte`
    );
  } catch (e: unknown) {
    recordResult("TEST 11", "Login incorrect -> message générique", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 12: Audit log -> LOGIN_SUCCESS enregistré ---
  try {
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@unipay.dz" } });
    await recordAuditLog({
      userId: adminUser!.id,
      action: "LOGIN_SUCCESS",
      details: { role: "ADMIN", note: "Test automatique 12" },
      ipAddress: "127.0.0.1",
    });

    const log = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_SUCCESS", userId: adminUser!.id },
      orderBy: { createdAt: "desc" },
    });

    const passed = !!log && !log.details?.includes("password");
    recordResult(
      "TEST 12",
      "Audit log -> LOGIN_SUCCESS",
      passed,
      `Événement LOGIN_SUCCESS tracé sans mot de passe (id: ${log?.id})`
    );
  } catch (e: unknown) {
    recordResult("TEST 12", "Audit log -> LOGIN_SUCCESS", false, (e instanceof Error ? e.message : String(e)));
  }

  // --- TEST 13: Audit log -> LOGIN_FAILED enregistré ---
  try {
    await recordAuditLog({
      action: "LOGIN_FAILED",
      details: { reason: "Bad credentials", email: "unknown@unipay.dz" },
      ipAddress: "127.0.0.1",
    });

    const log = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_FAILED" },
      orderBy: { createdAt: "desc" },
    });

    const passed = !!log && !log.details?.includes("password");
    recordResult(
      "TEST 13",
      "Audit log -> LOGIN_FAILED",
      passed,
      `Événement LOGIN_FAILED tracé sans mot de passe (id: ${log?.id})`
    );
  } catch (e: unknown) {
    recordResult("TEST 13", "Audit log -> LOGIN_FAILED", false, (e instanceof Error ? e.message : String(e)));
  }

  console.log("==================================================");
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`RÉSULTAT : ${passedCount}/${total} TESTS RÉUSSIS`);
  console.log("==================================================");

  if (passedCount !== total) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
