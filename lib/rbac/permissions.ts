import { RoleCode } from "./roles";

export interface PermissionDefinition {
  code: string;
  nameAr: string;
  category: "USERS" | "PAYROLL" | "ACCOUNTING" | "FINANCIAL_CONTROL" | "AUDIT" | "EMPLOYEE" | "SYSTEM";
}

export const INITIAL_PERMISSIONS: PermissionDefinition[] = [
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

  // Employés & RH
  { code: "agent.access", nameAr: "الوصول إلى مساحة الموارد البشرية", category: "PAYROLL" },
  { code: "employees.read", nameAr: "عرض ملفات الموظفين", category: "EMPLOYEE" },
  { code: "employees.create", nameAr: "تسجيل موظف جديد", category: "EMPLOYEE" },
  { code: "employees.update", nameAr: "تحيين بيانات الموظف والترقيات", category: "EMPLOYEE" },
  { code: "payroll.prepare", nameAr: "إعداد مسيرة الرواتب الشهرية", category: "PAYROLL" },
  { code: "payroll.read", nameAr: "الاطلاع على جداول الرواتب", category: "PAYROLL" },

  // Chef de Service
  { code: "chef.access", nameAr: "الوصول إلى مساحة رئيس المصلحة", category: "PAYROLL" },
  { code: "payroll.verify", nameAr: "التدقيق الأولي في كشوف الأجور", category: "PAYROLL" },

  // Direction
  { code: "directeur.access", nameAr: "الوصول إلى مساحة مدير الجامعة", category: "PAYROLL" },
  { code: "payroll.approve", nameAr: "الاعتماد النهائي لمسيرة الرواتب", category: "PAYROLL" },

  // Comptabilité
  { code: "comptable.access", nameAr: "الوصول إلى مساحة المحاسب المالي", category: "ACCOUNTING" },
  { code: "accounting.review", nameAr: "مراجعة القيود المحاسبية للرواتب", category: "ACCOUNTING" },
  { code: "accounting.validate", nameAr: "المصادقة على أوامر الصرف المالي", category: "ACCOUNTING" },

  // Contrôle Financier
  { code: "controleur.access", nameAr: "الوصول إلى مساحة المراقب المالي", category: "FINANCIAL_CONTROL" },
  { code: "financial_control.review", nameAr: "فحص قانونية الاعتمادات المالية", category: "FINANCIAL_CONTROL" },
  { code: "financial_control.visa", nameAr: "منح التأشيرة المالية المسبقة", category: "FINANCIAL_CONTROL" },

  // Espace Employé
  { code: "employe.access", nameAr: "الوصول إلى مساحة الموظف الشخصية", category: "EMPLOYEE" },
  { code: "payslips.read", nameAr: "تحميل كشوف الراتب الشهرية", category: "EMPLOYEE" },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<RoleCode, string[]> = {
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
