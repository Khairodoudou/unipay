/**
 * fix_phase9_data.ts
 * Fix data issues detected during Phase 9 audit:
 * 1. Hash plaintext passwords for test users
 * 2. Set organizationId on batches that are missing it
 */
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // ── 1. Fix plaintext passwords ────────────────────────────────────────────
  console.log("=== Fixing plaintext passwords ===");
  const usersWithPlainPwd = await prisma.user.findMany({
    where: { passwordHash: { not: { startsWith: "$2" } } },
    select: { id: true, email: true }
  });
  
  for (const user of usersWithPlainPwd) {
    const hash = await bcrypt.hash("Demo@unipay2024!", 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash }
    });
    console.log(`  ✅ Hashed password for: ${user.email}`);
  }
  console.log(`Fixed ${usersWithPlainPwd.length} user(s).`);

  // ── 2. Fix batches without organizationId ────────────────────────────────
  console.log("\n=== Fixing batches without organizationId ===");
  
  // Get the main organization
  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" }
  });
  if (!org) {
    console.error("No organization found! Cannot fix batches.");
    return;
  }
  console.log(`  Using organization: ${org.name} (${org.id})`);

  const batchesWithoutOrg = await prisma.payrollBatch.findMany({
    where: { organizationId: null },
    select: { id: true, status: true }
  });
  
  if (batchesWithoutOrg.length === 0) {
    console.log("  No batches to fix.");
  } else {
    const result = await prisma.payrollBatch.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    });
    console.log(`  ✅ Updated ${result.count} batches with organizationId: ${org.id}`);
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  console.log("\n=== Verification ===");
  const remainingUnhashed = await prisma.user.count({
    where: { passwordHash: { not: { startsWith: "$2" } } }
  });
  console.log(`  Unhashed passwords remaining: ${remainingUnhashed}`);
  
  const remainingBatchesNoOrg = await prisma.payrollBatch.count({
    where: { organizationId: null, status: { notIn: ["DRAFT", "CALCULATED", "AUDITING"] } }
  });
  console.log(`  Batches without org (active): ${remainingBatchesNoOrg}`);
  
  console.log("\n✅ Done!");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
