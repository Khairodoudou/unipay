import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

// Rôles institutionnels UNI-PAY
const ROLES_DATA = [
  {
    code: "ADMIN",
    nameAr: "مدير النظام",
    descriptionAr: "إدارة النظام، المستخدمين، الصلاحيات، والتكوين العام للمنصة",
  },
  {
    code: "AGENT_RH",
    nameAr: "عون الموارد البشرية والأجور",
    descriptionAr: "إعداد عناصر الأجور، كشوف الحضور، والتجهيز الأولي لمسيرات الرواتب",
  },
  {
    code: "CHEF_SERVICE",
    nameAr: "رئيس المصلحة",
    descriptionAr: "مراجعة جداول الرواتب والتدقيق في عناصر الأجر والمصادقة الأولية",
  },
  {
    code: "DIRECTEUR",
    nameAr: "مدير الجامعة",
    descriptionAr: "الاعتماد النهائي لمسيرات الرواتب وتفويض عمليات الصرف المالي",
  },
  {
    code: "COMPTABLE",
    nameAr: "المحاسب المالي",
    descriptionAr: "التدقيق المحاسبي وإعداد أوامر الصرف المالي والتسويات المحاسبية",
  },
  {
    code: "CONTROLEUR_FINANCIER",
    nameAr: "المراقب المالي",
    descriptionAr: "التأشيرة المالية المسبقة والرقابة على مشروعية النفقات والمرتبات",
  },
  {
    code: "EMPLOYE",
    nameAr: "الموظف",
    descriptionAr: "الاطلاع على كشوف الراتب الشهرية والشهادات السنوية والتنبيهات",
  },
];

// Permissions fondamentales
const PERMISSIONS_DATA = [
  // Administration & Système
  { code: "admin.access", nameAr: "الوصول إلى لوحة الإدارة", category: "SYSTEM" },
  { code: "system.settings", nameAr: "تعديل إعدادات المنصة", category: "SYSTEM" },
  { code: "settings.read", nameAr: "عرض إعدادات النظام", category: "SYSTEM" },
  { code: "settings.update", nameAr: "تعديل إعدادات النظام", category: "SYSTEM" },
  { code: "roles.read", nameAr: "عرض الأدوار والصلاحيات", category: "SYSTEM" },
  { code: "roles.update", nameAr: "تعديل صلاحيات الأدوار", category: "SYSTEM" },
  { code: "permissions.read", nameAr: "عرض قائمة الصلاحيات", category: "SYSTEM" },
  { code: "permissions.update", nameAr: "إدارة الصلاحيات", category: "SYSTEM" },
  { code: "organization.read", nameAr: "عرض بيانات المؤسسة والهيكل", category: "SYSTEM" },
  { code: "organization.update", nameAr: "تعديل بيانات المؤسسة والهيكل التنظيمي", category: "SYSTEM" },

  // Utilisateurs
  { code: "users.read", nameAr: "عرض قائمة المستخدمين", category: "USERS" },
  { code: "users.create", nameAr: "إنشاء مستخدمين جدد", category: "USERS" },
  { code: "users.update", nameAr: "تعديل بيانات المستخدمين", category: "USERS" },
  { code: "users.disable", nameAr: "تعطيل وتفعيل الحسابات", category: "USERS" },

  // Audit
  { code: "audit.read", nameAr: "الاطلاع على سجل التدقيق والرقابة", category: "AUDIT" },

  // Règles de Paie (Configuration)
  { code: "payroll_rules.read", nameAr: "عرض قواعد الأجور والمتغيرات", category: "PAYROLL" },
  { code: "payroll_rules.create", nameAr: "إنشاء قواعد أجور جديدة", category: "PAYROLL" },
  { code: "payroll_rules.update", nameAr: "تحيين وتعديل قواعد الأجور", category: "PAYROLL" },
  { code: "payroll_rules.activate", nameAr: "تفعيل وتعطيل قواعد الأجور", category: "PAYROLL" },

  { code: "agent.access", nameAr: "الوصول إلى مساحة الموارد البشرية", category: "PAYROLL" },
  { code: "employees.read", nameAr: "عرض ملفات الموظفين", category: "EMPLOYEE" },
  { code: "employees.create", nameAr: "تسجيل موظف جديد", category: "EMPLOYEE" },
  { code: "employees.update", nameAr: "تحيين بيانات الموظف والترقيات", category: "EMPLOYEE" },
  { code: "payroll.prepare", nameAr: "إعداد مسيرة الرواتب الشهرية", category: "PAYROLL" },
  { code: "payroll.read", nameAr: "الاطلاع على جداول الرواتب", category: "PAYROLL" },

  { code: "chef.access", nameAr: "الوصول إلى مساحة رئيس المصلحة", category: "PAYROLL" },
  { code: "payroll.verify", nameAr: "التدقيق الأولي في كشوف الأجور", category: "PAYROLL" },

  { code: "directeur.access", nameAr: "الوصول إلى مساحة مدير الجامعة", category: "PAYROLL" },
  { code: "payroll.approve", nameAr: "الاعتماد النهائي لمسيرة الرواتب", category: "PAYROLL" },

  { code: "comptable.access", nameAr: "الوصول إلى مساحة المحاسب المالي", category: "ACCOUNTING" },
  { code: "accounting.review", nameAr: "مراجعة القيود المحاسبية للرواتب", category: "ACCOUNTING" },
  { code: "accounting.validate", nameAr: "المصادقة على أوامر الصرف المالي", category: "ACCOUNTING" },

  { code: "controleur.access", nameAr: "الوصول إلى مساحة المراقب المالي", category: "FINANCIAL_CONTROL" },
  { code: "financial_control.review", nameAr: "فحص قانونية الاعتمادات المالية", category: "FINANCIAL_CONTROL" },
  { code: "financial_control.visa", nameAr: "منح التأشيرة المالية المسبقة", category: "FINANCIAL_CONTROL" },

  { code: "employe.access", nameAr: "الوصول إلى مساحة الموظف الشخصية", category: "EMPLOYEE" },
  { code: "payslips.read", nameAr: "تحميل كشوف الراتب الشهرية", category: "EMPLOYEE" },
];

const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  ADMIN: [
    "admin.access",
    "users.read",
    "users.create",
    "users.update",
    "users.disable",
    "roles.read",
    "roles.update",
    "permissions.read",
    "permissions.update",
    "organization.read",
    "organization.update",
    "settings.read",
    "settings.update",
    "system.settings",
    "payroll_rules.read",
    "payroll_rules.create",
    "payroll_rules.update",
    "payroll_rules.activate",
    "audit.read",
  ],
  AGENT_RH: [
    "agent.access",
    "employees.read",
    "employees.create",
    "employees.update",
    "payroll.prepare",
    "payroll.read",
  ],
  CHEF_SERVICE: [
    "chef.access",
    "payroll.read",
    "payroll.verify",
    "employees.read",
  ],
  DIRECTEUR: [
    "directeur.access",
    "payroll.read",
    "payroll.approve",
  ],
  COMPTABLE: [
    "comptable.access",
    "payroll.read",
    "accounting.review",
    "accounting.validate",
  ],
  CONTROLEUR_FINANCIER: [
    "controleur.access",
    "payroll.read",
    "financial_control.review",
    "financial_control.visa",
  ],
  EMPLOYE: [
    "employe.access",
    "payslips.read",
  ],
};

async function main() {
  console.log("🌱 [UNI-PAY] Démarrage du seed de la base de données...");

  // 1. Organisation initiale
  const organization = await prisma.organization.upsert({
    where: { code: "UNIPAY-DZ" },
    update: {
      name: "جامعة الجزائر 1 — بن يوسف بن خدة",
      address: "2 شارع ديدوش مراد، الجزائر الوسطى",
      wilaya: "الجزائر (16)",
      phone: "+213 21 64 68 00",
      email: "rectorat@univ-alger.dz",
      website: "https://www.univ-alger.dz",
      description: "مؤسسة جامعية وطنية جزائرية عريقة للتعليم العالي والبحث العلمي",
      isActive: true,
    },
    create: {
      name: "جامعة الجزائر 1 — بن يوسف بن خدة",
      code: "UNIPAY-DZ",
      address: "2 شارع ديدوش مراد، الجزائر الوسطى",
      wilaya: "الجزائر (16)",
      phone: "+213 21 64 68 00",
      email: "rectorat@univ-alger.dz",
      website: "https://www.univ-alger.dz",
      description: "مؤسسة جامعية وطنية جزائرية عريقة للتعليم العالي والبحث العلمي",
      isActive: true,
    },
  });
  console.log(`✅ Organisation créée/mise à jour : ${organization.name} (${organization.code})`);

  // 2. Rôles
  const rolesByCode: Record<string, { id: string; code: string; nameAr: string }> = {};
  for (const roleData of ROLES_DATA) {
    const role = await prisma.role.upsert({
      where: { code: roleData.code },
      update: {
        nameAr: roleData.nameAr,
        descriptionAr: roleData.descriptionAr,
      },
      create: {
        code: roleData.code,
        nameAr: roleData.nameAr,
        descriptionAr: roleData.descriptionAr,
      },
    });
    rolesByCode[role.code] = role;
  }
  console.log(`✅ ${Object.keys(rolesByCode).length} Rôles configurés.`);

  // 3. Permissions
  const permissionsByCode: Record<string, { id: string; code: string; nameAr: string }> = {};
  for (const permData of PERMISSIONS_DATA) {
    const perm = await prisma.permission.upsert({
      where: { code: permData.code },
      update: {
        nameAr: permData.nameAr,
        category: permData.category,
      },
      create: {
        code: permData.code,
        nameAr: permData.nameAr,
        category: permData.category,
      },
    });
    permissionsByCode[perm.code] = perm;
  }
  console.log(`✅ ${Object.keys(permissionsByCode).length} Permissions configurées.`);

  // 4. Associations Rôle - Permissions
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS_MAP)) {
    const role = rolesByCode[roleCode];
    if (!role) continue;

    for (const permCode of permCodes) {
      const perm = permissionsByCode[permCode];
      if (!perm) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }
  console.log("✅ Associations Rôles-Permissions établies.");

  // 5. Compte Administrateur Initial via variables d'environnement
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@unipay.dz";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminPassword2026!";
  const adminFirstName = process.env.SEED_ADMIN_FIRSTNAME || "أدمن";
  const adminLastName = process.env.SEED_ADMIN_LASTNAME || "النظام";

  const adminPasswordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      roleId: rolesByCode["ADMIN"].id,
      organizationId: organization.id,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      roleId: rolesByCode["ADMIN"].id,
      organizationId: organization.id,
      isActive: true,
    },
  });
  console.log(`✅ Compte Administrateur créé : ${adminUser.email}`);

  // 6. Comptes de démonstration pour les 6 autres rôles & compte inactif de test
  const demoAccounts = [
    {
      email: "agent@unipay.dz",
      password: "DemoPassword2026!",
      firstName: "أحمد",
      lastName: "بوزيد (عون أجور)",
      roleCode: "AGENT_RH",
      isActive: true,
    },
    {
      email: "chef@unipay.dz",
      password: "DemoPassword2026!",
      firstName: "كريم",
      lastName: "بن سالم (رئيس مصلحة)",
      roleCode: "CHEF_SERVICE",
      isActive: true,
    },
    {
      email: "directeur@unipay.dz",
      password: "DemoPassword2026!",
      firstName: "أ.د. عبد الرحمن",
      lastName: "قاسمي (مدير الجامعة)",
      roleCode: "DIRECTEUR",
      isActive: true,
    },
    {
      email: "comptable@unipay.dz",
      password: "DemoPassword2026!",
      firstName: "سليم",
      lastName: "مفتاح (محاسب مالي)",
      roleCode: "COMPTABLE",
      isActive: true,
    },
    {
      email: "controleur@unipay.dz",
      password: "DemoPassword2026!",
      firstName: "جمال",
      lastName: "حيمود (مراقب مالي)",
      roleCode: "CONTROLEUR_FINANCIER",
      isActive: true,
    },
    {
      email: "employe@unipay.dz",
      password: "DemoPassword2026!",
      firstName: "يوسف",
      lastName: "طاهري (أستاذ باحث)",
      roleCode: "EMPLOYE",
      isActive: true,
    },
    // Compte désactivé pour vérifier l'interdiction de connexion
    {
      email: "desactive@unipay.dz",
      password: "DemoPassword2026!",
      firstName: "حساب",
      lastName: "معطل (للاختبار)",
      roleCode: "EMPLOYE",
      isActive: false,
    },
  ];

  for (const account of demoAccounts) {
    const passwordHash = await bcrypt.hash(account.password, BCRYPT_ROUNDS);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        passwordHash,
        firstName: account.firstName,
        lastName: account.lastName,
        roleId: rolesByCode[account.roleCode].id,
        organizationId: organization.id,
        isActive: account.isActive,
      },
      create: {
        email: account.email,
        passwordHash,
        firstName: account.firstName,
        lastName: account.lastName,
        roleId: rolesByCode[account.roleCode].id,
        organizationId: organization.id,
        isActive: account.isActive,
      },
    });
  }
  console.log("✅ 7 Comptes de test créés (6 rôles + 1 compte désactivé).");

  // 7. Structure Organisationnelle (Unités)
  const presidence = await prisma.organizationUnit.upsert({
    where: { code: "UO-PRES" },
    update: { name: "رئاسة الجامعة", type: "PRESIDENCY", isActive: true },
    create: {
      name: "رئاسة الجامعة",
      code: "UO-PRES",
      type: "PRESIDENCY",
      organizationId: organization.id,
      isActive: true,
    },
  });

  const sg = await prisma.organizationUnit.upsert({
    where: { code: "UO-SG" },
    update: { name: "الأمانة العامة للجامعة", type: "SECRETARIAT_GENERAL", parentId: presidence.id, isActive: true },
    create: {
      name: "الأمانة العامة للجامعة",
      code: "UO-SG",
      type: "SECRETARIAT_GENERAL",
      parentId: presidence.id,
      organizationId: organization.id,
      isActive: true,
    },
  });

  await prisma.organizationUnit.upsert({
    where: { code: "UO-SG-SDRH" },
    update: { name: "المديرية الفرعية للمستخدمين والأجور", type: "SERVICE", parentId: sg.id, isActive: true },
    create: {
      name: "المديرية الفرعية للمستخدمين والأجور",
      code: "UO-SG-SDRH",
      type: "SERVICE",
      parentId: sg.id,
      organizationId: organization.id,
      isActive: true,
    },
  });

  await prisma.organizationUnit.upsert({
    where: { code: "UO-SG-SDFIN" },
    update: { name: "المديرية الفرعية للمالية والمحاسبة", type: "SERVICE", parentId: sg.id, isActive: true },
    create: {
      name: "المديرية الفرعية للمالية والمحاسبة",
      code: "UO-SG-SDFIN",
      type: "SERVICE",
      parentId: sg.id,
      organizationId: organization.id,
      isActive: true,
    },
  });

  await prisma.organizationUnit.upsert({
    where: { code: "UO-FAC-ST" },
    update: { name: "كلية العلوم والتكنولوجيا", type: "FACULTY", parentId: presidence.id, isActive: true },
    create: {
      name: "كلية العلوم والتكنولوجيا",
      code: "UO-FAC-ST",
      type: "FACULTY",
      parentId: presidence.id,
      organizationId: organization.id,
      isActive: true,
    },
  });
  console.log("✅ 5 Unités organisationnelles créées/mises à jour.");

  // 8. Paramètres Système (Strictement non sensibles - aucun secret en DB)
  const systemSettings = [
    {
      key: "PLATFORM_NAME",
      value: "UNI-PAY — المنصة الرقمية للأجور الجامعية",
      category: "GENERAL",
      labelAr: "اسم المنصة",
      descriptionAr: "الاسم الرسمي الظاهر في ترويسة المنصة والمراسلات",
      isPublic: true,
    },
    {
      key: "INSTITUTION_NAME",
      value: "جامعة الجزائر 1 — بن يوسف بن خدة",
      category: "GENERAL",
      labelAr: "اسم المؤسسة الجامعية",
      descriptionAr: "الاسم الرسمي للمؤسسة الجامعية المعتمدة",
      isPublic: true,
    },
    {
      key: "DEFAULT_LANGUAGE",
      value: "ar",
      category: "GENERAL",
      labelAr: "اللغة الافتراضية",
      descriptionAr: "اللغة الرسمية لواجهة الاستخدام (العربية)",
      isPublic: true,
    },
    {
      key: "DEFAULT_TIMEZONE",
      value: "Africa/Algiers",
      category: "GENERAL",
      labelAr: "المنطقة الزمنية",
      descriptionAr: "التوقيت المعتمد لتسجيل العمليات وسجلات التدقيق",
      isPublic: true,
    },
    {
      key: "SESSION_TTL_HOURS",
      value: "168",
      category: "SECURITY",
      labelAr: "مدة صلاحية الجلسة (بالساعات)",
      descriptionAr: "المدة الزمنية القصوى لصلاحية جلسة تسجيل الدخول قبل التجديد",
      isPublic: false,
    },
    {
      key: "PASSWORD_MIN_LENGTH",
      value: "8",
      category: "SECURITY",
      labelAr: "الحد الأدنى لطول كلمة المرور",
      descriptionAr: "العدد الأدنى من الخانات المقبول في كلمات المرور الجديدة",
      isPublic: false,
    },
    {
      key: "AUDIT_RETENTION_DAYS",
      value: "365",
      category: "SYSTEM",
      labelAr: "مدة الاحتفاظ بسجلات التدقيق (أيام)",
      descriptionAr: "عدد الأيام الأدنى لأرشفة سجلات الأنشطة والتدقيق الرقابي",
      isPublic: false,
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        category: setting.category,
        labelAr: setting.labelAr,
        descriptionAr: setting.descriptionAr,
        isPublic: setting.isPublic,
      },
      create: setting,
    });
  }
  console.log(`✅ ${systemSettings.length} Paramètres système configurés (aucun secret stocké).`);

  // 9. Règles de Paie (Configuration architecturale de base)
  const initialRules = [
    {
      code: "CNAS_COTISATION_SALARIALE",
      nameAr: "اشتراك الضمان الاجتماعي (الحصة العاملة)",
      category: "SOCIAL_CONTRIBUTION",
      descriptionAr: "نسبة اقتطاع الضمان الاجتماعي من الأجر الخاضع للاشتراك",
      isActive: true,
      version: {
        versionNumber: 1,
        value: "0.09",
        unit: "PERCENTAGE",
        effectiveFrom: new Date("2020-01-01"),
        notes: "قيمة تجريبية قابلة للضبط والتحيين (9%)",
      },
    },
    {
      code: "IEP_TAUX_ECHELON",
      nameAr: "تعويض الخبرة المهنية لكل درجة",
      category: "ALLOWANCE",
      descriptionAr: "معدل حساب تعويض الخبرة المهنية (الدرجة) عن كل رتبة ودرجة",
      isActive: true,
      version: {
        versionNumber: 1,
        value: "0.05",
        unit: "PERCENTAGE",
        effectiveFrom: new Date("2020-01-01"),
        notes: "معدل تجريبي أولي (5%) قابل للتعديل",
      },
    },
    {
      code: "BASE_POINT_INDICE",
      nameAr: "قيمة النقطة الاستدلالية",
      category: "BASE_INDEX",
      descriptionAr: "القيمة المالية المعتمدة للنقطة الاستدلالية في حساب الأجر الأساسي",
      isActive: true,
      version: {
        versionNumber: 1,
        value: "45",
        unit: "FIXED_AMOUNT",
        effectiveFrom: new Date("2022-01-01"),
        notes: "قيمة النقطة الاستدلالية المرجعية (د.ج)",
      },
    },
  ];

  for (const ruleData of initialRules) {
    const rule = await prisma.payrollRule.upsert({
      where: { code: ruleData.code },
      update: {
        nameAr: ruleData.nameAr,
        category: ruleData.category,
        descriptionAr: ruleData.descriptionAr,
        isActive: ruleData.isActive,
      },
      create: {
        code: ruleData.code,
        nameAr: ruleData.nameAr,
        category: ruleData.category,
        descriptionAr: ruleData.descriptionAr,
        isActive: ruleData.isActive,
      },
    });

    await prisma.payrollRuleVersion.upsert({
      where: {
        ruleId_versionNumber: {
          ruleId: rule.id,
          versionNumber: ruleData.version.versionNumber,
        },
      },
      update: {
        value: ruleData.version.value,
        unit: ruleData.version.unit,
        effectiveFrom: ruleData.version.effectiveFrom,
        notes: ruleData.version.notes,
      },
      create: {
        ruleId: rule.id,
        versionNumber: ruleData.version.versionNumber,
        value: ruleData.version.value,
        unit: ruleData.version.unit,
        effectiveFrom: ruleData.version.effectiveFrom,
        notes: ruleData.version.notes,
      },
    });
  }
  console.log(`✅ ${initialRules.length} Règles de paie configurables initialisées avec version 1.`);

  // 10. Audit log initial
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "LOGIN_SUCCESS",
      resourceType: "SYSTEM_INIT",
      details: JSON.stringify({ message: "Initialisation et seed de la base UNI-PAY Phase 3 réussis" }),
    },
  });

  console.log("🚀 [UNI-PAY] Seed complété avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
