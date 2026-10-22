/**
 * lib/workflow/states.ts
 * Machine d'états centralisée pour PayrollBatch — Phase 6 + Phase 8
 * Ne jamais utiliser des chaînes de statut en dur dans les pages/actions.
 */

export const BATCH_STATUS = {
  DRAFT:                 "DRAFT",
  CALCULATING:           "CALCULATING",
  CALCULATED:            "CALCULATED",
  AUDITING:              "AUDITING",
  READY_FOR_REVIEW:      "READY_FOR_REVIEW",
  // Workflow Chef
  CHEF_REVIEW:           "CHEF_REVIEW",
  APPROVED_BY_CHEF:      "APPROVED_BY_CHEF",
  // Workflow Directeur
  DIRECTOR_REVIEW:       "DIRECTOR_REVIEW",
  APPROVED_BY_DIRECTOR:  "APPROVED_BY_DIRECTOR",
  // Workflow Comptable
  ACCOUNTING_REVIEW:     "ACCOUNTING_REVIEW",
  ACCOUNTING_VALIDATED:  "ACCOUNTING_VALIDATED",
  // Workflow Contrôleur Financier
  FINANCIAL_CONTROL:     "FINANCIAL_CONTROL",
  AUTHORIZED:            "AUTHORIZED",
  // Phases futures — ne pas transitionner vers ces statuts en Phase 6
  PAYMENT_PROCESSING:    "PAYMENT_PROCESSING",
  PAID:                  "PAID",
  CLOSED:                "CLOSED",
  // Retour pour correction (transversal aux 4 étapes de revue)
  RETURNED_FOR_CORRECTION: "RETURNED_FOR_CORRECTION",
} as const;

export type BatchStatus = (typeof BATCH_STATUS)[keyof typeof BATCH_STATUS];

export const WORKFLOW_ACTIONS = {
  // Agent RH
  SUBMIT_TO_CHEF:         "SUBMIT_TO_CHEF",
  // Chef de Service
  TAKE_CHEF_REVIEW:       "TAKE_CHEF_REVIEW",
  APPROVE_CHEF:           "APPROVE_CHEF",
  RETURN_BY_CHEF:         "RETURN_BY_CHEF",
  // Directeur
  TAKE_DIRECTOR_REVIEW:   "TAKE_DIRECTOR_REVIEW",
  APPROVE_DIRECTOR:       "APPROVE_DIRECTOR",
  RETURN_BY_DIRECTOR:     "RETURN_BY_DIRECTOR",
  // Comptable
  TAKE_ACCOUNTING_REVIEW: "TAKE_ACCOUNTING_REVIEW",
  VALIDATE_ACCOUNTING:    "VALIDATE_ACCOUNTING",
  RETURN_BY_ACCOUNTING:   "RETURN_BY_ACCOUNTING",
  // Contrôleur Financier
  TAKE_FINANCIAL_CONTROL: "TAKE_FINANCIAL_CONTROL",
  GRANT_FINANCIAL_VISA:   "GRANT_FINANCIAL_VISA",
  RETURN_BY_FINANCIAL:    "RETURN_BY_FINANCIAL",
  // Phase 8 — Paiement (activés)
  START_PAYMENT_PROCESSING: "START_PAYMENT_PROCESSING",
  CONFIRM_PAYMENT:          "CONFIRM_PAYMENT",
  CLOSE_BATCH:              "CLOSE_BATCH",
} as const;

export type WorkflowActionType = (typeof WORKFLOW_ACTIONS)[keyof typeof WORKFLOW_ACTIONS];

/** Libellés arabes des actions de workflow pour l'UI */
export const WORKFLOW_ACTION_LABELS: Record<string, string> = {
  SUBMIT_TO_CHEF:         "إحالة إلى رئيس المصلحة",
  TAKE_CHEF_REVIEW:       "بدء مراجعة رئيس المصلحة",
  APPROVE_CHEF:           "مصادقة رئيس المصلحة",
  RETURN_BY_CHEF:         "إعادة للتصحيح من رئيس المصلحة",
  TAKE_DIRECTOR_REVIEW:   "بدء مراجعة المدير",
  APPROVE_DIRECTOR:       "مصادقة مدير المؤسسة",
  RETURN_BY_DIRECTOR:     "إعادة للتصحيح من المدير",
  TAKE_ACCOUNTING_REVIEW: "بدء المراجعة المحاسبية",
  VALIDATE_ACCOUNTING:    "تأشير ومصادقة المحاسب",
  RETURN_BY_ACCOUNTING:   "إعادة للتصحيح من المحاسب",
  TAKE_FINANCIAL_CONTROL: "بدء الرقابة المالية",
  GRANT_FINANCIAL_VISA:   "منح التأشيرة المالية والترخيص بالصرف",
  RETURN_BY_FINANCIAL:    "إعادة للتصحيح من المراقب المالي",
  // Phase 8 — Paiement
  START_PAYMENT_PROCESSING: "إطلاق معالجة الدفع وتوليد الملف التقني",
  CONFIRM_PAYMENT:          "تأكيد تنفيذ الدفع المتحكّم فيه (MANUAL_CONTROLLED)",
  CLOSE_BATCH:              "إقفال الدفعة بعد إتمام التسوية",
};

/** Libellés arabes des statuts pour l'UI */
export const BATCH_STATUS_LABELS: Record<string, { ar: string; fr: string; color: string }> = {
  DRAFT:                  { ar: "مسودة",             fr: "Brouillon",           color: "gray" },
  CALCULATING:            { ar: "جاري الاحتساب",     fr: "Calcul en cours",     color: "blue" },
  CALCULATED:             { ar: "محتسب",              fr: "Calculé",             color: "cyan" },
  AUDITING:               { ar: "جاري التدقيق",      fr: "Audit en cours",      color: "purple" },
  READY_FOR_REVIEW:       { ar: "جاهز للمراجعة",     fr: "Prêt pour révision",  color: "amber" },
  CHEF_REVIEW:            { ar: "مراجعة رئيس المصلحة",fr: "Révision Chef",      color: "orange" },
  APPROVED_BY_CHEF:       { ar: "مصادق من رئيس المصلحة", fr: "Approuvé Chef",  color: "teal" },
  DIRECTOR_REVIEW:        { ar: "مراجعة المدير",     fr: "Révision Directeur",  color: "orange" },
  APPROVED_BY_DIRECTOR:   { ar: "مصادق من المدير",   fr: "Approuvé Directeur", color: "teal" },
  ACCOUNTING_REVIEW:      { ar: "مراجعة المحاسب",    fr: "Révision Comptable",  color: "orange" },
  ACCOUNTING_VALIDATED:   { ar: "صادق عليه المحاسب", fr: "Validé Comptable",   color: "teal" },
  FINANCIAL_CONTROL:      { ar: "المراقبة المالية",  fr: "Contrôle financier",  color: "orange" },
  AUTHORIZED:             { ar: "مرخص للصرف",        fr: "Autorisé",            color: "green" },
  PAYMENT_PROCESSING:     { ar: "جاري الدفع",        fr: "Paiement en cours",   color: "blue" },
  PAID:                   { ar: "مدفوع",              fr: "Payé",                color: "green" },
  CLOSED:                 { ar: "مغلق",               fr: "Clôturé",             color: "slate" },
  RETURNED_FOR_CORRECTION:{ ar: "مُعاد للتصحيح",    fr: "Retourné",            color: "red" },
};

/** Étapes de la timeline workflow dans l'ordre */
export const WORKFLOW_STEPS = [
  {
    key: "AGENT",
    labelAr: "عون الأجور",
    labelFr: "Agent RH",
    activeStatuses: ["READY_FOR_REVIEW", "RETURNED_FOR_CORRECTION"],
    doneStatuses:   [
      "CHEF_REVIEW", "APPROVED_BY_CHEF",
      "DIRECTOR_REVIEW", "APPROVED_BY_DIRECTOR",
      "ACCOUNTING_REVIEW", "ACCOUNTING_VALIDATED",
      "FINANCIAL_CONTROL", "AUTHORIZED",
      "PAYMENT_PROCESSING", "PAID", "CLOSED",
    ],
  },
  {
    key: "SMART_AUDIT",
    labelAr: "التدقيق الذكي",
    labelFr: "Smart Audit",
    activeStatuses: ["AUDITING"],
    doneStatuses:   [
      "READY_FOR_REVIEW", "CHEF_REVIEW", "APPROVED_BY_CHEF",
      "DIRECTOR_REVIEW", "APPROVED_BY_DIRECTOR",
      "ACCOUNTING_REVIEW", "ACCOUNTING_VALIDATED",
      "FINANCIAL_CONTROL", "AUTHORIZED",
      "PAYMENT_PROCESSING", "PAID", "CLOSED",
    ],
  },
  {
    key: "CHEF",
    labelAr: "رئيس المصلحة",
    labelFr: "Chef de Service",
    activeStatuses: ["CHEF_REVIEW"],
    doneStatuses:   [
      "APPROVED_BY_CHEF", "DIRECTOR_REVIEW", "APPROVED_BY_DIRECTOR",
      "ACCOUNTING_REVIEW", "ACCOUNTING_VALIDATED",
      "FINANCIAL_CONTROL", "AUTHORIZED",
      "PAYMENT_PROCESSING", "PAID", "CLOSED",
    ],
  },
  {
    key: "DIRECTEUR",
    labelAr: "المدير",
    labelFr: "Directeur",
    activeStatuses: ["DIRECTOR_REVIEW"],
    doneStatuses:   [
      "APPROVED_BY_DIRECTOR",
      "ACCOUNTING_REVIEW", "ACCOUNTING_VALIDATED",
      "FINANCIAL_CONTROL", "AUTHORIZED",
      "PAYMENT_PROCESSING", "PAID", "CLOSED",
    ],
  },
  {
    key: "COMPTABLE",
    labelAr: "المحاسب المالي",
    labelFr: "Comptable",
    activeStatuses: ["ACCOUNTING_REVIEW"],
    doneStatuses:   [
      "ACCOUNTING_VALIDATED",
      "FINANCIAL_CONTROL", "AUTHORIZED",
      "PAYMENT_PROCESSING", "PAID", "CLOSED",
    ],
  },
  {
    key: "CONTROLEUR",
    labelAr: "المراقب المالي",
    labelFr: "Contrôleur Financier",
    activeStatuses: ["FINANCIAL_CONTROL"],
    doneStatuses:   [
      "AUTHORIZED",
      "PAYMENT_PROCESSING", "PAID", "CLOSED",
    ],
  },
  {
    key: "PAIEMENT",
    labelAr: "أمر الدفع والتسوية",
    labelFr: "Paiement & Clôture",
    activeStatuses: ["AUTHORIZED", "PAYMENT_PROCESSING"],
    doneStatuses:   ["PAID", "CLOSED"],
  },
] as const;
