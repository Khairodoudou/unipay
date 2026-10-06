export type RoleCode =
  | "ADMIN"
  | "AGENT_RH"
  | "CHEF_SERVICE"
  | "DIRECTEUR"
  | "COMPTABLE"
  | "CONTROLEUR_FINANCIER"
  | "EMPLOYE";

export interface RoleMetadata {
  code: RoleCode;
  nameAr: string;
  descriptionAr: string;
  dashboardPath: string;
}

export const ROLES: Record<RoleCode, RoleMetadata> = {
  ADMIN: {
    code: "ADMIN",
    nameAr: "مدير النظام",
    descriptionAr: "إدارة النظام، المستخدمين، الصلاحيات، والتكوين العام للمنصة",
    dashboardPath: "/admin/dashboard",
  },
  AGENT_RH: {
    code: "AGENT_RH",
    nameAr: "عون الموارد البشرية والأجور",
    descriptionAr: "إعداد عناصر الأجور، كشوف الحضور، والتجهيز الأولي لمسيرات الرواتب",
    dashboardPath: "/agent/dashboard",
  },
  CHEF_SERVICE: {
    code: "CHEF_SERVICE",
    nameAr: "رئيس المصلحة",
    descriptionAr: "مراجعة جداول الرواتب والتدقيق في عناصر الأجر والمصادقة الأولية",
    dashboardPath: "/chef/dashboard",
  },
  DIRECTEUR: {
    code: "DIRECTEUR",
    nameAr: "مدير الجامعة",
    descriptionAr: "الاعتماد النهائي لمسيرات الرواتب وتفويض عمليات الصرف المالي",
    dashboardPath: "/directeur/dashboard",
  },
  COMPTABLE: {
    code: "COMPTABLE",
    nameAr: "المحاسب المالي",
    descriptionAr: "التدقيق المحاسبي وإعداد أوامر الصرف المالي والتسويات المحاسبية",
    dashboardPath: "/comptable/dashboard",
  },
  CONTROLEUR_FINANCIER: {
    code: "CONTROLEUR_FINANCIER",
    nameAr: "المراقب المالي",
    descriptionAr: "التأشيرة المالية المسبقة والرقابة على مشروعية النفقات والمرتبات",
    dashboardPath: "/controle-financier/dashboard",
  },
  EMPLOYE: {
    code: "EMPLOYE",
    nameAr: "الموظف",
    descriptionAr: "الاطلاع على كشوف الراتب الشهرية والشهادات السنوية والتنبيهات",
    dashboardPath: "/employe/dashboard",
  },
};

export const ROLE_CODES = Object.keys(ROLES) as RoleCode[];

export function getRoleMetadata(code: string): RoleMetadata | undefined {
  return ROLES[code as RoleCode];
}

export function getDashboardForRole(roleCode: string): string {
  const meta = getRoleMetadata(roleCode);
  return meta ? meta.dashboardPath : "/unauthorized";
}
