/**
 * scripts/seed_phase8_permissions.ts
 * Ajoute les permissions Phase 8 en base et les associe aux rôles concernés.
 */

import prisma from "../lib/db/prisma";
import { INITIAL_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from "../lib/rbac/permissions";

async function main() {
  const phase8Codes = [
    "payment.read",
    "payment.prepare",
    "payment.process",
    "payment.confirm",
    "payment.reconcile",
    "payment.close",
  ];

  // 1. Créer les permissions manquantes
  for (const perm of INITIAL_PERMISSIONS) {
    if (!phase8Codes.includes(perm.code)) continue;
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { nameAr: perm.nameAr, category: perm.category },
      create: { code: perm.code, nameAr: perm.nameAr, category: perm.category },
    });
    console.log(`✅ Permission upserted: ${perm.code}`);
  }

  // 2. Associer aux rôles
  const roles = await prisma.role.findMany({ include: { rolePermissions: { include: { permission: true } } } });

  for (const role of roles) {
    const expectedPerms: string[] = ROLE_DEFAULT_PERMISSIONS[role.code as keyof typeof ROLE_DEFAULT_PERMISSIONS] ?? [];
    const phase8Perms = expectedPerms.filter(p => phase8Codes.includes(p));

    for (const permCode of phase8Perms) {
      const permission = await prisma.permission.findUnique({ where: { code: permCode } });
      if (!permission) continue;

      const alreadyLinked = role.rolePermissions.some(rp => rp.permission.code === permCode);
      if (!alreadyLinked) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permission.id },
        });
        console.log(`✅ Linked ${permCode} → ${role.code}`);
      } else {
        console.log(`  Already linked: ${permCode} → ${role.code}`);
      }
    }
  }

  // 3. Vérification
  const total = await prisma.permission.count();
  console.log(`\n📊 Total permissions en base : ${total}`);
  console.log("✅ Phase 8 permissions seed completed.");
}

main().finally(async () => {
  await prisma.$disconnect();
});
