import prisma from "../lib/db/prisma";

async function main() {
  console.log("==================================================");
  console.log("🔍 DIAGNOSTIC DE BASE DE DONNÉES — PHASE 8 UNI-PAY");
  console.log("==================================================");

  // 1. Périodes de paie
  const periodsCount = await prisma.payrollPeriod.count();
  console.log(`1. Périodes de paie (PayrollPeriods) : ${periodsCount}`);

  // 2. Lots de paie
  const batchesCount = await prisma.payrollBatch.count();
  console.log(`2. Lots de paie (PayrollBatches) : ${batchesCount}`);

  // 3. Batches par statut
  const statusCounts = await prisma.payrollBatch.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id]));

  console.log(`3. Détail des statuts de lots :`);
  console.log(`   - AUTHORIZED          : ${statusMap["AUTHORIZED"] ?? 0}`);
  console.log(`   - PAYMENT_PROCESSING  : ${statusMap["PAYMENT_PROCESSING"] ?? 0}`);
  console.log(`   - PAID                : ${statusMap["PAID"] ?? 0}`);
  console.log(`   - CLOSED              : ${statusMap["CLOSED"] ?? 0}`);
  console.log(`   - Autres (DRAFT, etc.): ${batchesCount - ((statusMap["AUTHORIZED"] ?? 0) + (statusMap["PAYMENT_PROCESSING"] ?? 0) + (statusMap["PAID"] ?? 0) + (statusMap["CLOSED"] ?? 0))}`);
  for (const s of statusCounts) {
    if (!["AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(s.status)) {
      console.log(`     * ${s.status}: ${s._count.id}`);
    }
  }

  // 4. Enregistrements de paie (PayrollRecords)
  const recordsCount = await prisma.payrollRecord.count();
  console.log(`4. Enregistrements de paie (PayrollRecords) : ${recordsCount}`);

  // 5. Employés et RIB
  const employeesCount = await prisma.employee.count();
  const employeesWithRib = await prisma.employee.count({
    where: { rib: { not: null } },
  });
  const employeesWithoutRib = employeesCount - employeesWithRib;

  // Recherche de doublons de RIB
  const allRibs = await prisma.employee.findMany({
    where: { rib: { not: null } },
    select: { rib: true, matricule: true },
  });

  const ribOccurrences: Record<string, string[]> = {};
  for (const item of allRibs) {
    if (!item.rib) continue;
    ribOccurrences[item.rib] = ribOccurrences[item.rib] || [];
    ribOccurrences[item.rib].push(item.matricule);
  }

  const duplicateRibs = Object.entries(ribOccurrences).filter(([, mats]) => mats.length > 1);

  console.log(`5. Employés (Employees) : ${employeesCount}`);
  console.log(`   - Avec RIB : ${employeesWithRib}`);
  console.log(`   - Sans RIB : ${employeesWithoutRib}`);
  console.log(`   - Doublons de RIB : ${duplicateRibs.length} ${duplicateRibs.length > 0 ? `(Ex: ${duplicateRibs.slice(0, 2).map(([r, m]) => `${r}: ${m.join(",")}`).join("; ")})` : "(aucun)"}`);

  // 6. Utilisateurs des rôles concernés
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isActive: true,
      role: { select: { code: true, nameAr: true } },
    },
  });
  console.log(`6. Utilisateurs enregistrés (${users.length}) :`);
  users.forEach((u) => {
    console.log(`   - ${u.email} | Rôle: ${u.role.code} | Actif: ${u.isActive}`);
  });

  // 7. Permissions existantes
  const permissionsCount = await prisma.permission.count();
  const paymentPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { code: { contains: "payment" } },
        { code: { contains: "accounting" } },
        { code: { contains: "financial" } },
      ],
    },
    select: { code: true, nameAr: true, category: true },
  });
  console.log(`7. Permissions en base (${permissionsCount} au total) :`);
  console.log(`   - Permissions financières/comptables/paiement existantes :`);
  paymentPermissions.forEach((p) => {
    console.log(`     * ${p.code} (${p.nameAr}) [${p.category}]`);
  });

  // 8. Notifications
  const notificationsCount = await prisma.notification.count();
  const notifTypes = await prisma.notification.groupBy({
    by: ["type"],
    _count: { id: true },
  });
  console.log(`8. Notifications en base (${notificationsCount}) :`);
  notifTypes.forEach((nt) => {
    console.log(`   - ${nt.type} : ${nt._count.id}`);
  });

  // 9. WorkflowActions
  const actionsCount = await prisma.workflowAction.count();
  const actionTypes = await prisma.workflowAction.groupBy({
    by: ["action"],
    _count: { id: true },
  });
  console.log(`9. Actions de workflow (WorkflowActions) : ${actionsCount}`);
  actionTypes.forEach((at) => {
    console.log(`   - ${at.action} : ${at._count.id}`);
  });

  console.log("==================================================");
  console.log("✅ DIAGNOSTIC PHASE 8 ACHEVÉ");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Erreur pendant le diagnostic Phase 8 :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
