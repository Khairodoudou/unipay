import prisma from "../lib/db/prisma";

async function main() {
  const batches = await prisma.payrollBatch.findMany({
    where: { status: "CLOSED" },
    include: {
      period: true,
      records: { select: { id: true, snapshotName: true, snapshotMatricule: true, netAmount: true } },
      workflowActions: true,
    },
  });

  console.log(`Total CLOSED batches: ${batches.length}`);
  for (const b of batches) {
    console.log({
      id: b.id,
      label: b.label,
      version: b.versionNumber,
      status: b.status,
      periodLabel: b.period?.label,
      periodYear: b.period?.year,
      periodMonth: b.period?.month,
      periodStatus: b.period?.status,
      createdAt: b.createdAt.toISOString(),
      recordCount: b.records.length,
      records: b.records,
      workflowActionsCount: b.workflowActions.length,
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
