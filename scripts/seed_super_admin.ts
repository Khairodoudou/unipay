/**
 * scripts/seed_super_admin.ts
 * Crée ou recrée le compte central SUPER_ADMIN de la plateforme أكاديميا شفاف
 * ⚠️ Ne doit être exécuté qu'une seule fois sur un environnement vierge ou de test
 */

import prisma from "../lib/db/prisma";
import bcrypt from "bcryptjs";

const SUPER_ADMIN_PERMISSIONS = [
  { code: "superadmin.access",          nameAr: "الوصول إلى لوحة الإدارة المركزية الوطنية", category: "SYSTEM" },
  { code: "universities.read",          nameAr: "عرض قائمة الجامعات المسجلة",               category: "SYSTEM" },
  { code: "universities.create",        nameAr: "تسجيل جامعة جديدة في المنصة الوطنية",     category: "SYSTEM" },
  { code: "universities.update",        nameAr: "تعديل بيانات جامعة مسجلة",                 category: "SYSTEM" },
  { code: "universities.suspend",       nameAr: "تجميد أو إعادة تنشيط جامعة",              category: "SYSTEM" },
  { code: "universities.archive",       nameAr: "أرشفة أو حذف جامعة نهائياً",              category: "SYSTEM" },
  { code: "superadmin.audit.read",      nameAr: "الاطلاع على سجل التدقيق المركزي الوطني", category: "AUDIT"  },
  { code: "superadmin.settings.update", nameAr: "تعديل إعدادات المنصة الوطنية",            category: "SYSTEM" },
  { code: "superadmin.rules.manage",    nameAr: "إدارة قواعد الأجور على المستوى الوطني",  category: "SYSTEM" },
];

async function main() {
  console.log("=== SEED: SUPER_ADMIN ACCOUNT ===");

  // 1. Ensure SUPER_ADMIN role exists
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

  // 2. Ensure all SUPER_ADMIN permissions exist and are linked to the role
  for (const permData of SUPER_ADMIN_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { code: permData.code },
      update: { nameAr: permData.nameAr, category: permData.category },
      create: { code: permData.code, nameAr: permData.nameAr, category: permData.category },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log(`✅ ${SUPER_ADMIN_PERMISSIONS.length} permissions SUPER_ADMIN configurées et liées au rôle`);

  // 3. Create or update the SUPER_ADMIN user
  const email = "superadmin@gmail.com";
  const password = "superadmin@2026";
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
║  Email    : superadmin@gmail.com             ║
║  Password : superadmin@2026                  ║
╚══════════════════════════════════════════════╝
  `);
}

main().catch(console.error).finally(() => prisma.$disconnect());
