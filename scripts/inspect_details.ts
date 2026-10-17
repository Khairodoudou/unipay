import prisma from "../lib/db/prisma";

async function main() {
  const authBatches = await prisma.payrollBatch.findMany({
    where: { status: "AUTHORIZED" },
    include: {
      period: true,
      records: {
        include: {
          employee: {
            select: { id: true, matricule: true, firstName: true, lastName: true, rib: true, bankName: true }
          }
        }
      },
      workflowActions: {
        include: { actor: { select: { email: true, role: { select: { code: true } } } } }
      }
    }
  });

  console.log("AUTHORIZED BATCHES COUNT:", authBatches.length);
  for (const b of authBatches) {
    console.log({
      id: b.id,
      label: b.label,
      status: b.status,
      period: b.period?.label,
      recordCount: b.records.length,
      records: b.records.map(r => ({
        id: r.id,
        matricule: r.snapshotMatricule,
        netAmount: Number(r.netAmount),
        employeeId: r.employeeId,
        rib: r.employee?.rib,
        bankName: r.employee?.bankName
      })),
      actions: b.workflowActions.map(a => ({
        action: a.action,
        from: a.fromStatus,
        to: a.toStatus,
        user: a.actor?.email,
        role: a.actor?.role.code,
        createdAt: a.createdAt
      }))
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
