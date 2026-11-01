/**
 * scripts/seed-turso-full.ts
 * Seed complet des données de base sur Turso Cloud (rôles, permissions, settings, règles)
 * + SUPER_ADMIN
 */

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const TURSO_URL =
  process.env.TURSO_DATABASE_URL ||
  "libsql://unipay-twiskou.aws-eu-west-1.turso.io";

const TURSO_TOKEN =
  process.env.TURSO_AUTH_TOKEN ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMxMzc4MjEsImlkIjoiMDFhMTdmNTctNDAwMS03YzViLTg2YjktYjhkZWExMzA0OThlIiwia2lkIjoia3lpcUFXdzQ0TVMwYWhnbGt0aWdwOGZldEk2N3lhWmctRm11YV9tdnU5cyIsInJpZCI6IjQyNTRmOWY4LTI3YzEtNGVkZi04YzQ0LTQyNWMzMDE2NjdhNiJ9.Mrtn3W4kT_YOw3VVB8qOqA3tyaOS0w8O1l3Mx1Qfx1e9S3EybSpPx1HxA0B3DTOnFsJLYjMX4HtbaHyFb079CA";

let _counter = 0;
function cuid(): string {
  _counter++;
  return "c" + Date.now().toString(36) + _counter.toString(36) + Math.random().toString(36).slice(2, 6);
}

const ROLES_DATA = [
  { code: "SUPER_ADMIN", nameAr: "المدير الوطني العام", descriptionAr: "إدارة المنصة المركزية، تسجيل واعتماد الجامعات، وحوكمة النظام الوطني" },
  { code: "ADMIN", nameAr: "مدير النظام", descriptionAr: "إدارة النظام، المستخدمين، الصلاحيات، والتكوين العام للمنصة" },
  { code: "AGENT_RH", nameAr: "عون الموارد البشرية والأجور", descriptionAr: "إعداد عناصر الأجور، كشوف الحضور، والتجهيز الأولي لمسيرات الرواتب" },
  { code: "CHEF_SERVICE", nameAr: "رئيس المصلحة", descriptionAr: "مراجعة جداول الرواتب والتدقيق في عناصر الأجر والمصادقة الأولية" },
  { code: "DIRECTEUR", nameAr: "مدير الجامعة", descriptionAr: "الاعتماد النهائي لمسيرات الرواتب وتفويض عمليات الصرف المالي" },
  { code: "COMPTABLE", nameAr: "المحاسب المالي", descriptionAr: "التدقيق المحاسبي وإعداد أوامر الصرف المالي والتسويات المحاسبية" },
  { code: "CONTROLEUR_FINANCIER", nameAr: "المراقب المالي", descriptionAr: "التأشيرة المالية المسبقة والرقابة على مشروعية النفقات والمرتبات" },
  { code: "EMPLOYE", nameAr: "الموظف", descriptionAr: "الاطلاع على كشوف الراتب الشهرية والشهادات السنوية والتنبيهات" },
];

const ALL_PERMISSIONS = [
  // Super Admin
  { code: "superadmin.access",          nameAr: "الوصول إلى لوحة الإدارة المركزية الوطنية", category: "SYSTEM" },
  { code: "universities.read",          nameAr: "عرض قائمة الجامعات المسجلة",               category: "SYSTEM" },
  { code: "universities.create",        nameAr: "تسجيل جامعة جديدة في المنصة الوطنية",     category: "SYSTEM" },
  { code: "universities.update",        nameAr: "تعديل بيانات جامعة مسجلة",                 category: "SYSTEM" },
  { code: "universities.suspend",       nameAr: "تجميد أو إعادة تنشيط جامعة",              category: "SYSTEM" },
  { code: "universities.archive",       nameAr: "أرشفة أو حذف جامعة نهائياً",              category: "SYSTEM" },
  { code: "superadmin.audit.read",      nameAr: "الاطلاع على سجل التدقيق المركزي الوطني", category: "AUDIT"  },
  { code: "superadmin.settings.update", nameAr: "تعديل إعدادات المنصة الوطنية",            category: "SYSTEM" },
  { code: "superadmin.rules.manage",    nameAr: "إدارة قواعد الأجور على المستوى الوطني",  category: "SYSTEM" },
  // Admin
  { code: "admin.access",               nameAr: "الوصول إلى لوحة الإدارة",                 category: "SYSTEM" },
  { code: "system.settings",            nameAr: "تعديل إعدادات المنصة",                    category: "SYSTEM" },
  { code: "settings.read",              nameAr: "عرض إعدادات النظام",                      category: "SYSTEM" },
  { code: "settings.update",            nameAr: "تعديل إعدادات النظام",                    category: "SYSTEM" },
  { code: "roles.read",                 nameAr: "عرض الأدوار والصلاحيات",                  category: "SYSTEM" },
  { code: "roles.update",               nameAr: "تعديل صلاحيات الأدوار",                   category: "SYSTEM" },
  { code: "permissions.read",           nameAr: "عرض قائمة الصلاحيات",                     category: "SYSTEM" },
  { code: "permissions.update",         nameAr: "إدارة الصلاحيات",                         category: "SYSTEM" },
  { code: "organization.read",          nameAr: "عرض بيانات المؤسسة والهيكل",              category: "SYSTEM" },
  { code: "organization.update",        nameAr: "تعديل بيانات المؤسسة والهيكل التنظيمي",  category: "SYSTEM" },
  { code: "users.read",                 nameAr: "عرض قائمة المستخدمين",                    category: "USERS"  },
  { code: "users.create",               nameAr: "إنشاء مستخدمين جدد",                      category: "USERS"  },
  { code: "users.update",               nameAr: "تعديل بيانات المستخدمين",                 category: "USERS"  },
  { code: "users.disable",              nameAr: "تعطيل وتفعيل الحسابات",                   category: "USERS"  },
  { code: "audit.read",                 nameAr: "الاطلاع على سجل التدقيق والرقابة",        category: "AUDIT"  },
  { code: "payroll_rules.read",         nameAr: "عرض قواعد الأجور والمتغيرات",             category: "PAYROLL" },
  { code: "payroll_rules.create",       nameAr: "إنشاء قواعد أجور جديدة",                  category: "PAYROLL" },
  { code: "payroll_rules.update",       nameAr: "تحيين وتعديل قواعد الأجور",               category: "PAYROLL" },
  { code: "payroll_rules.activate",     nameAr: "تفعيل وتعطيل قواعد الأجور",               category: "PAYROLL" },
  // Agent RH
  { code: "agent.access",               nameAr: "الوصول إلى مساحة الموارد البشرية",        category: "PAYROLL" },
  { code: "employees.read",             nameAr: "عرض ملفات الموظفين",                       category: "EMPLOYEE" },
  { code: "employees.create",           nameAr: "تسجيل موظف جديد",                          category: "EMPLOYEE" },
  { code: "employees.update",           nameAr: "تحيين بيانات الموظف والترقيات",            category: "EMPLOYEE" },
  { code: "payroll.prepare",            nameAr: "إعداد مسيرة الرواتب الشهرية",              category: "PAYROLL" },
  { code: "payroll.read",               nameAr: "الاطلاع على جداول الرواتب",                category: "PAYROLL" },
  { code: "batch.submit",               nameAr: "إرسال دفعة الأجور للمراجعة",              category: "PAYROLL" },
  // Chef Service
  { code: "chef.access",                nameAr: "الوصول إلى مساحة رئيس المصلحة",           category: "PAYROLL" },
  { code: "payroll.verify",             nameAr: "التدقيق الأولي في كشوف الأجور",           category: "PAYROLL" },
  // Directeur
  { code: "directeur.access",           nameAr: "الوصول إلى مساحة مدير الجامعة",           category: "PAYROLL" },
  { code: "payroll.approve",            nameAr: "الاعتماد النهائي لمسيرة الرواتب",         category: "PAYROLL" },
  // Comptable
  { code: "comptable.access",           nameAr: "الوصول إلى مساحة المحاسب المالي",         category: "ACCOUNTING" },
  { code: "accounting.review",          nameAr: "مراجعة القيود المحاسبية للرواتب",         category: "ACCOUNTING" },
  { code: "accounting.validate",        nameAr: "المصادقة على أوامر الصرف المالي",         category: "ACCOUNTING" },
  // Contrôleur financier
  { code: "controleur.access",          nameAr: "الوصول إلى مساحة المراقب المالي",         category: "FINANCIAL_CONTROL" },
  { code: "financial_control.review",   nameAr: "فحص قانونية الاعتمادات المالية",          category: "FINANCIAL_CONTROL" },
  { code: "financial_control.visa",     nameAr: "منح التأشيرة المالية المسبقة",            category: "FINANCIAL_CONTROL" },
  // Employé
  { code: "employe.access",             nameAr: "الوصول إلى مساحة الموظف الشخصية",        category: "EMPLOYEE" },
  { code: "payslips.read",              nameAr: "تحميل كشوف الراتب الشهرية",              category: "EMPLOYEE" },
  // Paiement
  { code: "payment.authorize",          nameAr: "ترخيص صرف مسيرة الأجور",                 category: "FINANCIAL_CONTROL" },
  { code: "payment.read",               nameAr: "الاطلاع على أوامر الدفع وحالة التسوية",  category: "PAYMENT" },
  { code: "payment.prepare",            nameAr: "تحضير أمر الدفع وتحقق ما قبل التنفيذ",  category: "PAYMENT" },
  { code: "payment.process",            nameAr: "إطلاق معالجة الدفع",                      category: "PAYMENT" },
  { code: "payment.confirm",            nameAr: "تأكيد تنفيذ الدفع",                       category: "PAYMENT" },
  { code: "payment.reconcile",          nameAr: "مطابقة كشوف التسوية",                     category: "PAYMENT" },
  { code: "payment.close",              nameAr: "إقفال الدفعة نهائياً",                    category: "PAYMENT" },
];

const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  SUPER_ADMIN: ["superadmin.access","universities.read","universities.create","universities.update","universities.suspend","universities.archive","superadmin.audit.read","superadmin.settings.update","superadmin.rules.manage"],
  ADMIN: ["admin.access","users.read","users.create","users.update","users.disable","roles.read","roles.update","permissions.read","permissions.update","organization.read","organization.update","settings.read","settings.update","system.settings","payroll_rules.read","payroll_rules.create","payroll_rules.update","payroll_rules.activate","audit.read"],
  AGENT_RH: ["agent.access","employees.read","employees.create","employees.update","payroll.prepare","payroll.read","batch.submit"],
  CHEF_SERVICE: ["chef.access","payroll.read","payroll.verify","employees.read"],
  DIRECTEUR: ["directeur.access","payroll.read","payroll.approve","payment.read","payment.close"],
  COMPTABLE: ["comptable.access","payroll.read","accounting.review","accounting.validate","payment.read","payment.prepare","payment.process","payment.confirm","payment.reconcile","payment.close"],
  CONTROLEUR_FINANCIER: ["controleur.access","payroll.read","financial_control.review","financial_control.visa","payment.authorize","payment.read"],
  EMPLOYE: ["employe.access","payslips.read"],
};

async function main() {
  console.log("🔌 Connexion à Turso Cloud...");
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  await client.execute("SELECT 1;");
  console.log("✅ Connecté !");

  // ── Vider toutes les tables ─────────────────────────────────────────────────
  const TABLES_TO_DROP = [
    "payment_transactions","payment_orders","ai_analyses","audit_findings",
    "workflow_actions","payroll_line_items","attendance_records","payroll_records",
    "batch_employees","payroll_batches","payroll_periods","employee_history",
    "employees","notifications","sessions","audit_logs","users",
    "role_permissions","permissions","roles","organization_units",
    "university_settings","organizations","system_settings",
    "payroll_rule_versions","payroll_rules",
  ];
  console.log("\n🗑️  Vidage de toutes les tables Turso...");
  for (const t of TABLES_TO_DROP) {
    try { await client.execute(`DELETE FROM "${t}";`); console.log(`   ✓ ${t}`); }
    catch { /* table may not exist */ }
  }
  console.log("✅ Tables vidées !");

  // ── Rôles ───────────────────────────────────────────────────────────────────
  console.log("\n📋 Création des rôles...");
  const roleIds: Record<string, string> = {};
  for (const r of ROLES_DATA) {
    const id = cuid();
    roleIds[r.code] = id;
    await client.execute({
      sql: `INSERT INTO roles (id, code, nameAr, descriptionAr, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'));`,
      args: [id, r.code, r.nameAr, r.descriptionAr],
    });
  }
  console.log(`✅ ${ROLES_DATA.length} rôles créés`);

  // ── Permissions ──────────────────────────────────────────────────────────────
  console.log("🔐 Création des permissions...");
  const permIds: Record<string, string> = {};
  for (const p of ALL_PERMISSIONS) {
    const id = cuid();
    permIds[p.code] = id;
    await client.execute({
      sql: `INSERT INTO permissions (id, code, nameAr, category, createdAt)
            VALUES (?, ?, ?, ?, datetime('now'));`,
      args: [id, p.code, p.nameAr, p.category],
    });
  }
  console.log(`✅ ${ALL_PERMISSIONS.length} permissions créées`);

  // ── Associations Rôle-Permissions ───────────────────────────────────────────
  console.log("🔗 Liaison rôles-permissions...");
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS_MAP)) {
    for (const permCode of permCodes) {
      if (!roleIds[roleCode] || !permIds[permCode]) continue;
      await client.execute({
        sql: `INSERT INTO role_permissions (id, roleId, permissionId) VALUES (?, ?, ?);`,
        args: [cuid(), roleIds[roleCode], permIds[permCode]],
      });
    }
  }
  console.log("✅ Associations établies");

  // ── SUPER_ADMIN user ────────────────────────────────────────────────────────
  console.log("\n🧑‍💼 Création du compte SUPER_ADMIN...");
  const passwordHash = await bcrypt.hash("superadmin@2026", 12);
  await client.execute({
    sql: `INSERT INTO users (id, email, passwordHash, firstName, lastName, roleId, organizationId, isActive, createdAt, updatedAt)
          VALUES (?, 'superadmin@gmail.com', ?, 'Admin', 'National', ?, NULL, 1, datetime('now'), datetime('now'));`,
    args: [cuid(), passwordHash, roleIds["SUPER_ADMIN"]],
  });

  console.log(`
╔══════════════════════════════════════════════════╗
║  ✅ TURSO — SEED COMPLET RÉUSSI                  ║
║  Email    : superadmin@gmail.com                 ║
║  Password : superadmin@2026                      ║
║  Rôles    : ${ROLES_DATA.length} créés                                ║
║  Permissions : ${ALL_PERMISSIONS.length} créées                          ║
╚══════════════════════════════════════════════════╝
  `);
}

main().catch((err) => { console.error("❌", err); process.exit(1); });
