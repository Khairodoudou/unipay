import prisma from "../lib/db/prisma";
import { INITIAL_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from "../lib/rbac/permissions";

async function syncPermissions() {
  console.log("🔄 Starting permissions synchronization...");

  // 1. Upsert all permissions from lib/rbac/permissions.ts
  const permMap: Record<string, string> = {};
  for (const p of INITIAL_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        nameAr: p.nameAr,
        category: p.category,
      },
      create: {
        code: p.code,
        nameAr: p.nameAr,
        category: p.category,
      },
    });
    permMap[perm.code] = perm.id;
  }
  console.log(`✅ Upserted ${Object.keys(permMap).length} permissions into database.`);

  // 2. Associate permissions with roles according to ROLE_DEFAULT_PERMISSIONS
  for (const [roleCode, permCodes] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
    });
    if (!role) {
      console.log(`⚠️ Role ${roleCode} not found in DB, skipping.`);
      continue;
    }

    let linkedCount = 0;
    for (const permCode of permCodes) {
      const permId = permMap[permCode];
      if (!permId) {
        console.log(`⚠️ Permission ${permCode} not in permMap!`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permId,
        },
      });
      linkedCount++;
    }
    console.log(`✅ Role ${roleCode}: verified/linked ${linkedCount} permissions.`);
  }

  // 3. Verify AGENT_RH permissions
  const agentRole = await prisma.role.findUnique({
    where: { code: "AGENT_RH" },
    include: { rolePermissions: { include: { permission: true } } },
  });
  console.log(
    "🎉 AGENT_RH now has permissions:",
    agentRole?.rolePermissions.map((rp) => rp.permission.code)
  );
}

syncPermissions()
  .then(() => {
    console.log("🚀 Permissions sync completed successfully!");
  })
  .catch((err) => {
    console.error("❌ Error syncing permissions:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
