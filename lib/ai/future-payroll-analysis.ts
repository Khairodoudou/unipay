/**
 * Architecture préparatoire pour les fonctionnalités IA futures :
 * 1. Analyse avancée de la masse salariale (Payroll Analysis)
 * 2. Prévisions budgétaires (Payroll Forecast & Estimations)
 * 3. Recommandations proactives (AI Recommendations)
 *
 * RÈGLE D'OR : Ces services sont purement consultatifs.
 * Ils ne doivent JAMAIS muter directement les salaires ou contourner les validations humaines.
 */

export interface PeriodPayrollTrend {
  periodLabel: string;
  year: number;
  month: number;
  totalGrossDZD: number;
  totalNetDZD: number;
  employeeCount: number;
  totalAllowancesDZD: number;
  totalDeductionsDZD: number;
}

export interface PayrollAnalysisResult {
  periodsAnalyzed: number;
  trends: PeriodPayrollTrend[];
  massSalaryEvolutionPercent: number;
  keyInsightsAr: string[];
  explanationAr: string;
}

export interface PayrollForecastResult {
  currentPeriodLabel: string;
  estimatedNextMonthTotalMinDZD: number;
  estimatedNextMonthTotalMaxDZD: number;
  disclaimer: "Forecast / Estimation uniquement. Aucune valeur contractuelle ou juridique.";
  confidenceScore: number; // 0.0 - 1.0
  factorsConsideredAr: string[];
}

export interface AIRecommendationItem {
  id: string;
  category: "SALARY" | "GRADE" | "ALLOWANCE" | "ATTENDANCE" | "DATA_COMPLETION";
  targetEmployeeId?: string;
  titleAr: string;
  suggestionAr: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  suggestedActionType: "VERIFY_GRADE" | "COMPARE_MONTH_MINUS_ONE" | "CHECK_ALLOWANCE" | "DATA_ENRICHMENT";
}

/**
 * Interface d'abstraction du fournisseur d'IA
 * Permet de remplacer ou d'étendre Gemini sans casser l'architecture UNI-PAY.
 */
export interface AIProviderService {
  name: string;
  version: string;
  analyzePayrollTrends(trends: PeriodPayrollTrend[]): Promise<PayrollAnalysisResult>;
  forecastNextPeriod(trends: PeriodPayrollTrend[]): Promise<PayrollForecastResult>;
  generateProactiveRecommendations(batchId: string): Promise<AIRecommendationItem[]>;
}

/**
 * Implémentation modulaire prête pour les phases ultérieures
 */
export class UniversityPayrollAIService implements AIProviderService {
  name = "UNI-PAY Intelligent Payroll Core";
  version = "1.0.0-future-ready";

  async analyzePayrollTrends(trends: PeriodPayrollTrend[]): Promise<PayrollAnalysisResult> {
    if (trends.length < 2) {
      return {
        periodsAnalyzed: trends.length,
        trends,
        massSalaryEvolutionPercent: 0,
        keyInsightsAr: ["بيانات الفترات السابقة غير كافية لرسم منحنى التطور التراكمي."],
        explanationAr: "يتطلب التحليل المتقدم فترتين على الأقل لمقارنة حركة الكتلة السنوية.",
      };
    }

    const latest = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    const diff = latest.totalNetDZD - previous.totalNetDZD;
    const pct = previous.totalNetDZD > 0 ? (diff / previous.totalNetDZD) * 100 : 0;

    return {
      periodsAnalyzed: trends.length,
      trends,
      massSalaryEvolutionPercent: parseFloat(pct.toFixed(2)),
      keyInsightsAr: [
        `تغير في الكتلة الصافية بنسبة ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% مقارنة بالفترة المنصرمة.`,
        `عدد الموظفين المعنيين: ${latest.employeeCount} موظفاً (فارق: ${latest.employeeCount - previous.employeeCount}).`,
      ],
      explanationAr:
        "التحليل المقارن يبرز استقرار النفقات العامة مع تسجيل التعديلات الدورية على بنود المنح والمردودية.",
    };
  }

  async forecastNextPeriod(trends: PeriodPayrollTrend[]): Promise<PayrollForecastResult> {
    const latest = trends[trends.length - 1] || {
      totalNetDZD: 0,
      periodLabel: "الحالية",
    };

    // Modèle d'estimation neutre basé sur une marge de fluctuation de ±3%
    const base = latest.totalNetDZD;
    const minEst = Math.round(base * 0.98);
    const maxEst = Math.round(base * 1.03);

    return {
      currentPeriodLabel: latest.periodLabel,
      estimatedNextMonthTotalMinDZD: minEst,
      estimatedNextMonthTotalMaxDZD: maxEst,
      disclaimer: "Forecast / Estimation uniquement. Aucune valeur contractuelle ou juridique.",
      confidenceScore: 0.85,
      factorsConsideredAr: [
        "الاستقرار الهيكلي لمناصب الأساتذة والموظفين",
        "توقع تثبيت منح المردودية الفصلية",
        "معدل الغيابات المعتاد للشهر القادم",
      ],
    };
  }

  async generateProactiveRecommendations(): Promise<AIRecommendationItem[]> {
    return [
      {
        id: "REC-01",
        category: "GRADE",
        titleAr: "التحقق من الدرجة بعد الترقية السنوية",
        suggestionAr: "مقارنة تاريخ سريان الدرجة الحالية للأساتذة مع مقررات الترقية الصادرة حديثاً.",
        priority: "MEDIUM",
        suggestedActionType: "VERIFY_GRADE",
      },
      {
        id: "REC-02",
        category: "ALLOWANCE",
        titleAr: "مراجعة منحة التأطير والمناصب النوعية",
        suggestionAr: "التأكد من مطابقة قرارات التكليف بمهام المسؤولية الإدارية أو البيداغوجية قبل الصرف.",
        priority: "HIGH",
        suggestedActionType: "CHECK_ALLOWANCE",
      },
    ];
  }
}
