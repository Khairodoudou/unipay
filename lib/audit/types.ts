export type FindingType =
  | "SALARY_VARIATION"
  | "DUPLICATE_EMPLOYEE"
  | "MISSING_DATA"
  | "INVALID_VALUE"
  | "ATTENDANCE_ANOMALY"
  | "ALLOWANCE_ANOMALY"
  | "DEDUCTION_ANOMALY"
  | "PAYROLL_TOTAL_VARIATION"
  | "RIB_DATA_ANOMALY"
  | "OTHER";

export type FindingSeverity = "INFO" | "WARNING" | "HIGH" | "CRITICAL";

export type FindingStatus =
  | "OPEN"
  | "REVIEWED"
  | "CONFIRMED"
  | "FALSE_POSITIVE"
  | "RESOLVED";

export type FindingSource = "RULE_ENGINE" | "AI_ASSISTANT";

export interface FindingTypeMeta {
  code: FindingType;
  labelAr: string;
  labelFr: string;
  descriptionAr: string;
}

export const FINDING_TYPES: Record<FindingType, FindingTypeMeta> = {
  SALARY_VARIATION: {
    code: "SALARY_VARIATION",
    labelAr: "تغير غير اعتيادي في الراتب",
    labelFr: "Variation inhabituelle de salaire",
    descriptionAr: "فارق كبير في صافي أو إجمالي الراتب مقارنة بالفترات السابقة",
  },
  DUPLICATE_EMPLOYEE: {
    code: "DUPLICATE_EMPLOYEE",
    labelAr: "اشتباه تكرار موظف أو بيانات",
    labelFr: "Doublon potentiel employé / données",
    descriptionAr: "تطابق في رقم الهوية الوطنية، الحساب البنكي، أو البريد الإلكتروني",
  },
  MISSING_DATA: {
    code: "MISSING_DATA",
    labelAr: "بيانات إلزامية ناقصة",
    labelFr: "Données obligatoires manquantes",
    descriptionAr: "غياب الرتبة، الراتب الأساسي، أو المعطيات الإلزامية للاحتساب والصرف",
  },
  INVALID_VALUE: {
    code: "INVALID_VALUE",
    labelAr: "قيمة حسابية غير مقبولة",
    labelFr: "Valeur numérique invalide",
    descriptionAr: "قيم سالبة غير منطقية، أو تجاوز عدد أيام العمل القانونية",
  },
  ATTENDANCE_ANOMALY: {
    code: "ATTENDANCE_ANOMALY",
    labelAr: "شذوذ في سجل الحضور والغياب",
    labelFr: "Anomalie d'assiduité / présence",
    descriptionAr: "غياب كامل خلال الشهر أو تجاوز مجموع الغيابات لأيام العمل",
  },
  ALLOWANCE_ANOMALY: {
    code: "ALLOWANCE_ANOMALY",
    labelAr: "مفارقة في المنح والتعويضات",
    labelFr: "Anomalie sur les indemnités",
    descriptionAr: "مبالغ منح غير متناسبة أو بنود مكررة لنفس الموظف",
  },
  DEDUCTION_ANOMALY: {
    code: "DEDUCTION_ANOMALY",
    labelAr: "شذوذ في الاقتطاعات والاشتراكات",
    labelFr: "Anomalie sur les retenues",
    descriptionAr: "اقتطاعات تفوق الراتب الإجمالي أو نسب اشتراك غير مطابقة",
  },
  PAYROLL_TOTAL_VARIATION: {
    code: "PAYROLL_TOTAL_VARIATION",
    labelAr: "تباين إجمالي الكتلة السنوية للدفعة",
    labelFr: "Variation de la masse salariale du lot",
    descriptionAr: "تفاوت حاد في مجموع نفقات الدفعة مقارنة بالدفعة السابقة",
  },
  RIB_DATA_ANOMALY: {
    code: "RIB_DATA_ANOMALY",
    labelAr: "نقص أو عدم مطابقة الحساب البنكي",
    labelFr: "Anomalie sur le RIB / compte bancaire",
    descriptionAr: "غياب رقم الحساب البنكي أو عدم صحة تركيبة المعرف البنكي",
  },
  OTHER: {
    code: "OTHER",
    labelAr: "ملاحظة تدقيق أخرى",
    labelFr: "Autre anomalie de contrôle",
    descriptionAr: "تنبيه تدقيق عام يتطلب معاينة المراقب",
  },
};

export interface FindingSeverityMeta {
  code: FindingSeverity;
  labelAr: string;
  labelFr: string;
  badgeClass: string;
}

export const SEVERITY_CONFIG: Record<FindingSeverity, FindingSeverityMeta> = {
  INFO: {
    code: "INFO",
    labelAr: "إعلامي",
    labelFr: "Information",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  WARNING: {
    code: "WARNING",
    labelAr: "تنبيه",
    labelFr: "Avertissement",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  HIGH: {
    code: "HIGH",
    labelAr: "مرتفع",
    labelFr: "Élevé",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  CRITICAL: {
    code: "CRITICAL",
    labelAr: "حرج (مانع)",
    labelFr: "Critique",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export interface FindingStatusMeta {
  code: FindingStatus;
  labelAr: string;
  labelFr: string;
  badgeClass: string;
}

export const STATUS_CONFIG: Record<FindingStatus, FindingStatusMeta> = {
  OPEN: {
    code: "OPEN",
    labelAr: "مفتوح (بانتظار المعاينة)",
    labelFr: "Ouvert",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
  REVIEWED: {
    code: "REVIEWED",
    labelAr: "تمت المعاينة",
    labelFr: "Examiné",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CONFIRMED: {
    code: "CONFIRMED",
    labelAr: "مؤكد (خلل حقيقي)",
    labelFr: "Confirmé",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  FALSE_POSITIVE: {
    code: "FALSE_POSITIVE",
    labelAr: "إنذار خاطئ (معتمد)",
    labelFr: "Faux positif",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  RESOLVED: {
    code: "RESOLVED",
    labelAr: "تمت التسوية والمعالجة",
    labelFr: "Résolu",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
  },
};

export interface AuditSummaryData {
  totalFindings: number;
  critical: number;
  high: number;
  warning: number;
  info: number;
  open: number;
  reviewed: number;
  confirmed: number;
  falsePositive: number;
  resolved: number;
}
