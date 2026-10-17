import prisma from "../lib/db/prisma";

async function link() {
  const user = await prisma.user.findUnique({ where: { email: "employe@unipay.dz" } });
  if (!user) {
    console.log("User employe@unipay.dz not found");
    return;
  }
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log("Organization not found");
    return;
  }
  const emp = await prisma.employee.upsert({
    where: { matricule: "EMP-PROF-001" },
    update: {
      email: "employe@unipay.dz",
      firstName: "يوسف",
      lastName: "طاهري",
      position: "أستاذ محاضر أ",
      grade: "MC-A",
      category: "Permanent",
      status: "ACTIVE",
      baseSalary: 85000,
      index: 780,
      rib: "00100234567890123456",
      bankName: "BNA",
      organizationId: org.id,
    },
    create: {
      matricule: "EMP-PROF-001",
      email: "employe@unipay.dz",
      firstName: "يوسف",
      lastName: "طاهري",
      position: "أستاذ محاضر أ",
      grade: "MC-A",
      category: "Permanent",
      status: "ACTIVE",
      baseSalary: 85000,
      index: 780,
      rib: "00100234567890123456",
      bankName: "BNA",
      organizationId: org.id,
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { employeeId: emp.id },
  });
  // Ensure EMP-PROF-001 has payroll records for demo
  const closedBatch = await prisma.payrollBatch.findFirst({
    where: { status: "CLOSED" },
  });
  if (closedBatch) {
    await prisma.payrollRecord.upsert({
      where: {
        batchId_employeeId: {
          batchId: closedBatch.id,
          employeeId: emp.id,
        },
      },
      update: {},
      create: {
        batchId: closedBatch.id,
        employeeId: emp.id,
        snapshotMatricule: emp.matricule,
        snapshotName: `${emp.firstName} ${emp.lastName}`,
        snapshotGrade: emp.grade,
        snapshotBaseSalary: 85000,
        grossAmount: 110000,
        totalAllowances: 25000,
        totalDeductions: 0,
        totalContributions: 9900,
        totalTaxes: 15100,
        netAmount: 85000,
        status: "CALCULATED",
      },
    });
    console.log(`Linked EMP-PROF-001 to CLOSED batch ${closedBatch.id}`);
  }

  const authBatch = await prisma.payrollBatch.findFirst({
    where: { status: "AUTHORIZED" },
  });
  if (authBatch) {
    await prisma.payrollRecord.upsert({
      where: {
        batchId_employeeId: {
          batchId: authBatch.id,
          employeeId: emp.id,
        },
      },
      update: {},
      create: {
        batchId: authBatch.id,
        employeeId: emp.id,
        snapshotMatricule: emp.matricule,
        snapshotName: `${emp.firstName} ${emp.lastName}`,
        snapshotGrade: emp.grade,
        snapshotBaseSalary: 85000,
        grossAmount: 110000,
        totalAllowances: 25000,
        totalDeductions: 0,
        totalContributions: 9900,
        totalTaxes: 15100,
        netAmount: 85000,
        status: "CALCULATED",
      },
    });
    console.log(`Linked EMP-PROF-001 to AUTHORIZED batch ${authBatch.id}`);
  }

  console.log(`✅ Successfully linked user ${user.email} to employee ${emp.matricule} (id: ${emp.id})`);
}

link()
  .catch((e) => {
    console.error("Error linking employee:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
