/**
 * scripts/seed_super_admin.ts
 * Crée ou recrée le compte central SUPER_ADMIN de la plateforme أكاديميا شفاف
 * ⚠️ Ne doit être exécuté qu'une seule fois sur un environnement vierge ou de test
 */

import prisma from "../lib/db/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("=== SEED: SUPER_ADMIN ACCOUNT ===");

  // Ensure SUPER_ADMIN role exists
  let superAdminRole = await prisma.role.findUnique({
    where: { code: "SUPER_ADMIN" },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        code: "SUPER_ADMIN",
        nameAr: "المدير الوطني العام",
        descriptionAr: "إدارة المنصة المركزية، تسجيل واعتماد الجامعات، وحوكمة النظام الوطني",
      },
    });
    console.log("✅ Rôle SUPER_ADMIN créé");
  } else {
    console.log("ℹ️ Rôle SUPER_ADMIN déjà existant");
  }

  // Create or update the SUPER_ADMIN user
  const email = "superadmin@unipay.dz";
  const password = "superadmin1235";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        firstName: "Admin",
        lastName: "National",
        roleId: superAdminRole.id,
        organizationId: null,
        isActive: true,
      },
    });
    console.log("✅ Compte SUPER_ADMIN mis à jour:", email);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: "Admin",
        lastName: "National",
        roleId: superAdminRole.id,
        organizationId: null,
        isActive: true,
      },
    });
    console.log("✅ Compte SUPER_ADMIN créé:", email);
  }

  console.log(`
╔══════════════════════════════════════════════╗
║  IDENTIFIANTS DE L'ADMINISTRATEUR NATIONAL   ║
║  Email    : superadmin@unipay.dz             ║
║  Password : superadmin1235                   ║
╚══════════════════════════════════════════════╝
  `);
}

main().catch(console.error).finally(() => prisma.$disconnect());
