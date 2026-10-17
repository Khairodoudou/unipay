import prisma from "../lib/db/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: { select: { code: true } }
    }
  });

  console.log("Users count:", users.length);

  users.forEach(u =>
    console.log(`  - ${u.email} (${u.role.code})`)
  );

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      matricule: true,
      firstName: true,
      lastName: true,
      email: true
    }
  });

  console.log("Employees count:", employees.length);

  employees.slice(0, 5).forEach(e =>
    console.log(
      `  - ${e.matricule}: ${e.firstName} ${e.lastName} (${e.email})`
    )
  );

  const batches = await prisma.payrollBatch.findMany({
    select: {
      id: true,
      status: true,
      versionNumber: true
    }
  });

  console.log("Batches count:", batches.length);

  batches.slice(0, 5).forEach(b =>
    console.log(
      `  - Batch ${b.id}: status=${b.status}, v=${b.versionNumber}`
    )
  );

  // Check specific statuses
  const statusCounts = await prisma.payrollBatch.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log("Batches by status:", statusCounts.map(s => `${s.status}: ${s._count.id}`).join(', '));

  const records = await prisma.payrollRecord.count();
  console.log("Payroll records count:", records);

  // Check authorized records
  const authorizedRecords = await prisma.payrollRecord.count({
    where: { batch: { status: 'AUTHORIZED' } }
  });
  console.log("Authorized Payroll records count:", authorizedRecords);
}

main()
  .catch((e) => {
    console.error("Error running check:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
