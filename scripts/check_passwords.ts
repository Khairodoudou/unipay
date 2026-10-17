import prisma from "@/lib/db/prisma";

async function main() {
  // Check CLOSED batches
  const closedBatches = await prisma.payrollBatch.findMany({
    where: { status: "CLOSED" },
    include: { workflowActions: true, records: true },
    take: 5
  });
  for (const b of closedBatches) {
    console.log(`Batch ${b.id}: workflowActions=${b.workflowActions.length}, records=${b.records.length}`);
  }
  
  // Check EMP-PROF-001
  const profEmp = await prisma.employee.findUnique({ where: { matricule: "EMP-PROF-001" } });
  console.log("EMP-PROF-001:", profEmp ? profEmp.id : "NOT FOUND");
  if (profEmp) {
    const records = await prisma.payrollRecord.count({ where: { employeeId: profEmp.id } });
    console.log("Records for EMP-PROF-001:", records);
  }
  
  // Check AuditLog entries with 'password'
  const logs = await prisma.auditLog.findMany({
    where: { details: { contains: "password" } },
    select: { id: true, action: true, details: true },
    take: 5
  });
  console.log("AuditLog with 'password':");
  for (const log of logs) {
    console.log(`  ${log.action}: ${JSON.stringify(log.details).substring(0, 100)}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
