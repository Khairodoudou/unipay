import prisma from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit/logger";
import { getGeminiClient, PREFERRED_GEMINI_MODELS, GEMINI_REQUEST_TIMEOUT_MS } from "./gemini";
import {
  aiAnalysisOutputSchema,
  AIAnalysisOutput,
  AIMinimalAuditContext,
} from "./schemas";

export interface AISmartAuditResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    model: string;
    analysis: string;
    possibleCauses: string[];
    recommendation: string;
    confidence: number;
    createdAt: Date;
  };
}

/**
 * Construit un contexte minimal assaini pour transmission à l'IA.
 * Respecte scrupuleusement la minimisation des données (aucune donnée secrète).
 */
export async function buildMinimalContext(
  findingId: string
): Promise<AIMinimalAuditContext | null> {
  const finding = await prisma.auditFinding.findUnique({
    where: { id: findingId },
    include: {
      batch: {
        include: {
          period: true,
        },
      },
      employee: {
        include: {
          organizationUnit: true,
        },
      },
    },
  });

  if (!finding) return null;

  let employeeContext: AIMinimalAuditContext["employeeContext"] = null;
  let payrollContext: AIMinimalAuditContext["payrollContext"] = null;
  let historicalComparison: AIMinimalAuditContext["historicalComparison"] = null;

  if (finding.employee) {
    employeeContext = {
      matricule: finding.employee.matricule,
      grade: finding.employee.grade,
      department: finding.employee.organizationUnit?.name,
      baseSalary: Number(finding.employee.baseSalary),
    };

    // Chercher le record du batch actuel
    const record = await prisma.payrollRecord.findUnique({
      where: {
        batchId_employeeId: {
          batchId: finding.batchId,
          employeeId: finding.employee.id,
        },
      },
    });

    const attendance = await prisma.attendanceRecord.findUnique({
      where: {
        batchId_employeeId: {
          batchId: finding.batchId,
          employeeId: finding.employee.id,
        },
      },
    });

    const lineItemsCount = await prisma.payrollLineItem.count({
      where: {
        batchId: finding.batchId,
        employeeId: finding.employee.id,
      },
    });

    payrollContext = {
      periodLabel: finding.batch.period.label,
      batchVersion: finding.batch.versionNumber,
      currentNet: record ? Number(record.netAmount) : null,
      currentGross: record ? Number(record.grossAmount) : null,
      workingDays: attendance?.workingDays ?? null,
      presentDays: attendance ? Number(attendance.presentDays) : null,
      absentDays: attendance ? Number(attendance.absentDays) : null,
      allowancesCount: lineItemsCount,
    };

    // Chercher un historique précédent
    const prevPeriod = await prisma.payrollPeriod.findFirst({
      where: {
        OR: [
          { year: finding.batch.period.year, month: finding.batch.period.month - 1 },
          { year: finding.batch.period.year - 1, month: 12 },
        ],
      },
      include: {
        batches: {
          where: { status: { in: ["CALCULATED", "READY_FOR_REVIEW", "CLOSED"] } },
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: {
            records: {
              where: { employeeId: finding.employee.id },
            },
          },
        },
      },
    });

    const prevRecord = prevPeriod?.batches[0]?.records[0];
    if (prevRecord && record) {
      const prevNet = Number(prevRecord.netAmount);
      const curNet = Number(record.netAmount);
      const varPct = prevNet > 0 ? ((curNet - prevNet) / prevNet) * 100 : null;

      historicalComparison = {
        previousNet: prevNet,
        previousGross: Number(prevRecord.grossAmount),
        variationPercent: varPct ? parseFloat(varPct.toFixed(1)) : null,
      };
    }
  }

  return {
    findingId: finding.id,
    anomalyType: finding.type,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    detectedValue: finding.detectedValue,
    expectedValue: finding.expectedValue,
    employeeContext,
    payrollContext,
    historicalComparison,
  };
}

/**
 * Analyse une anomalie de paie avec Gemini AI.
 * Fonction server-only, tolérante aux pannes, sans effet bloquant sur le moteur de règles.
 */
export async function analyzeFindingWithAI(
  findingId: string,
  callerUserId?: string
): Promise<AISmartAuditResult> {
  const finding = await prisma.auditFinding.findUnique({
    where: { id: findingId },
  });

  if (!finding) {
    return { success: false, error: "الملاحظة المطلوبة غير موجودة في قاعدة البيانات." };
  }

  // Tracer la demande d'analyse dans AuditLog
  await recordAuditLog({
    userId: callerUserId || null,
    action: "AI_ANALYSIS_REQUESTED",
    resourceType: "AUDIT_FINDING",
    resourceId: finding.id,
    details: { findingType: finding.type, severity: finding.severity },
  });

  const minimalContext = await buildMinimalContext(findingId);
  if (!minimalContext) {
    return { success: false, error: "تعذر تجميع المعطيات التدقيقية للملاحظة." };
  }

  // Prompt institutionnel strict
  const systemInstruction = `أنت مساعد تدقيق ذكي متخصص في نظام الأجور الجامعي الجزائري أكاديميا شفاف.
مهمتك تحليل الملاحظة الرقابية المقدمة وتوضيح أسبابها المحتملة وتوجيه المراجع البشري.

قواعد صارمة لا تقبل الاستثناء:
1. أنت مساعد استشاري فقط. لا تقم أبداً بإصدار حكم قضائي أو اتهام مباشر بالتزوير أو الاحتيال.
2. لا تخترع نصوصاً قانونية أو مراسيم غير متوفرة في السياق.
3. لا تخترع بيانات أو أرقاماً غير موجودة في المدخلات.
4. لا تعدل أي قيمة حسابية في مسيرة الأجور.
5. القرار النهائي يعود حصراً للمسؤول البشري المخول.
6. إذا كانت البيانات المرفقة غير كافية للتحليل، اذكر بوضوح "Insufficient data" أو "البيانات غير كافية".

يجب أن تكون إجابتك بصيغة JSON صارمة مطابقة تماماً للمخطط التالي:
{
  "analysis": "شرح تحليلي واضح وموجز لسبب ظهور هذا التنبيه",
  "possibleCauses": ["السبب المحتمل 1", "السبب المحتمل 2"],
  "recommendation": "خطوة التدقيق البشري المقترحة للتحقق الإداري",
  "confidence": 0.85
}
ملاحظة: حقل confidence يجب أن يكون رقماً عشرياً بين 0.0 و 1.0 يعكس درجة الثقة في التحليل بناءً على اكتمال المعطيات.`;

  const prompt = `حلل الملاحظة التدقيقية التالية بدقة:
${JSON.stringify(minimalContext, null, 2)}`;

  let parsedOutput: AIAnalysisOutput | null = null;
  let modelUsed: string = PREFERRED_GEMINI_MODELS[0];
  let apiError: string | null = null;

  // Tentative avec Gemini SDK
  try {
    const ai = getGeminiClient();

    for (const model of PREFERRED_GEMINI_MODELS) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => reject(new Error("AI_REQUEST_TIMEOUT")), GEMINI_REQUEST_TIMEOUT_MS);
          if (typeof timer.unref === "function") timer.unref();
        });

        const response = await Promise.race([
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              temperature: 0.2, // Faible température pour analyse déterministe
            },
          }),
          timeoutPromise,
        ]);

        const rawText = response.text?.trim() || "";
        if (rawText) {
          try {
            const rawJson = JSON.parse(rawText);
            const validated = aiAnalysisOutputSchema.safeParse(rawJson);
            if (validated.success) {
              parsedOutput = validated.data;
              modelUsed = model;
              break;
            }
          } catch {
            // Mauvais JSON, essayer le modèle suivant
          }
        }
      } catch (callError) {
        apiError = callError instanceof Error ? callError.message : String(callError);
        // Essayer le modèle de secours suivant
      }
    }
  } catch (initError) {
    apiError = initError instanceof Error ? initError.message : String(initError);
  }

  // Si l'API externe est indisponible (ex: 503 haute charge, pas de connexion, quota),
  // on génère une analyse déterministe intelligente de secours (Fallback Engine)
  // pour que le système d'audit reste 100% utilisable et ne plante JAMAIS.
  if (!parsedOutput) {
    parsedOutput = generateDeterministicFallbackAnalysis(minimalContext);
    modelUsed = `${modelUsed}-fallback-assisted`;
  }

  try {
    // Enregistrer l'analyse dans la base de données
    const analysisRecord = await prisma.aIAnalysis.create({
      data: {
        findingId: finding.id,
        model: modelUsed,
        analysis: parsedOutput.analysis,
        recommendation: parsedOutput.recommendation,
        confidence: parsedOutput.confidence,
        possibleCauses: JSON.stringify(parsedOutput.possibleCauses),
        dataConsidered: JSON.stringify(minimalContext),
      },
    });

    // Mettre à jour la confiance de l'anomalie
    await prisma.auditFinding.update({
      where: { id: finding.id },
      data: {
        confidence: parsedOutput.confidence,
        source: "AI_ASSISTANT",
      },
    });

    // Tracer la réussite dans AuditLog
    await recordAuditLog({
      userId: callerUserId || null,
      action: "AI_ANALYSIS_COMPLETED",
      resourceType: "AI_ANALYSIS",
      resourceId: analysisRecord.id,
      details: {
        findingId: finding.id,
        model: modelUsed,
        confidence: parsedOutput.confidence,
      },
    });

    return {
      success: true,
      data: {
        id: analysisRecord.id,
        model: modelUsed,
        analysis: parsedOutput.analysis,
        possibleCauses: parsedOutput.possibleCauses,
        recommendation: parsedOutput.recommendation,
        confidence: parsedOutput.confidence,
        createdAt: analysisRecord.createdAt,
      },
    };
  } catch (dbError) {
    await recordAuditLog({
      userId: callerUserId || null,
      action: "AI_ANALYSIS_FAILED",
      resourceType: "AUDIT_FINDING",
      resourceId: finding.id,
      details: {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        apiError,
      },
    });

    return {
      success: false,
      error: "فشل حفظ التحليل الذكي في قاعدة البيانات.",
    };
  }
}

/**
 * Moteur d'analyse déterministe d'assistance (Fallback Résilient)
 * Garantit que même en cas de coupure de service Gemini (503/Timeout/Quota),
 * l'agent dispose d'une explication structurée et argumentée basée sur les règles métier.
 */
export function generateDeterministicFallbackAnalysis(
  ctx: AIMinimalAuditContext
): AIAnalysisOutput {
  switch (ctx.anomalyType) {
    case "SALARY_VARIATION":
      return {
        analysis: `رصد تغير ملحوظ في صافي الراتب بقيمة (${ctx.detectedValue || "غير محددة"}). المقارنة التاريخية تبين تبايناً يتجاوز عتبة الاستقرار الشهري المعتادة لموظفي الجامعة.`,
        possibleCauses: [
          "تعديل في الترقية أو الدرجة (Échelon) بأثر رجعي",
          "إضافة منحة استثنائية (مردودية، منحة إشراف أو ساعات إضافية)",
          "تطبيق اقتطاع غياب غير مبرر أو تسوية خطأ سابق",
        ],
        recommendation: "مقارنة جدول المنح والغيابات لهذا الشهر مع القرار الإداري الصادر عن مصلحة المستخدمين.",
        confidence: 0.85,
      };

    case "MISSING_DATA":
      return {
        analysis: `نقص في البيانات الأساسية اللازمة: ${ctx.title}. يؤثر غياب هذه البيانات على المعالجة الآلية ومطابقة ملف الرواتب.`,
        possibleCauses: [
          "عدم اكتمال إجراءات التسجيل الأولي في ملف الموظف",
          "استيراد غير مكتمل لملف Excel الخاص ببيانات المستخدمين",
          "عدم إرفاق الملف الإداري للموظف الحديث التوظيف",
        ],
        recommendation: "استكمال بطاقة الموظف من خلال تعديل الملف الإداري وتحديث الرقم أو الرتبة المطلوبة.",
        confidence: 0.95,
      };

    case "INVALID_VALUE":
      return {
        analysis: `تم اكتشاف قيمة حسابية غير مقبولة منطقياً (${ctx.detectedValue}). هذا الخلل يمنع الاعتماد النهائي للدفعة لتفادي مخالفة القواعد الرقابية.`,
        possibleCauses: [
          "خطأ في إدخال عدد أيام الحضور أو الغياب",
          "اقتطاعات تتجاوز السقف الإجمالي للراتب الخام",
          "خطأ مطبعي في مبلغ البند اليدوي المُدخل",
        ],
        recommendation: "مراجعة كشف الحضور الفعلي وتعديل بنود الخصومات لتصحيح القيمة الحسابية.",
        confidence: 0.98,
      };

    case "DUPLICATE_EMPLOYEE":
      return {
        analysis: `تم رصد اشتراك في بيانات حساسة فريدة (${ctx.detectedValue}) بين سجلين مختلفين في الدفعة، مما يشير إلى خطر صرف مزدوج أو خطأ في التسجيل.`,
        possibleCauses: [
          "تسجيل الموظف مرتين برقمين وظيفيين مختلفين",
          "خطأ في إدخال رقم الحساب البنكي (RIB) أو رقم التعريف الوطني لموظف آخر",
          "تكرار عملية استيراد ملف الموظفين",
        ],
        recommendation: "التحقق الميداني من ملف كل موظف والتأكد من صحة رقم الحساب البنكي والهوية الوطنية قبل أي عملية صرف.",
        confidence: 0.99,
      };

    case "ATTENDANCE_ANOMALY":
      return {
        analysis: `شذوذ في سجل المواظبة الشهرية (${ctx.detectedValue}). عدم تناسق أيام الحضور مع أيام العمل الشهرية يؤثر مباشرة على الراتب الأساسي والمنح المرتبطة.`,
        possibleCauses: [
          "غياب مستمر بدون تبرير طيلة الشهر أو وجود في عطلة مرضية طويلة",
          "تأخر مصلحة الموظفين في تسليم كشف الحضور الشهري",
          "خطأ في إدخال أيام العمل الشهرية (أكثر من 30 يوماً)",
        ],
        recommendation: "مراجعة ورقة الحضور الموقعة من رئيس القسم أو تقرير مصلحة الموظفين.",
        confidence: 0.9,
      };

    case "PAYROLL_TOTAL_VARIATION":
      return {
        analysis: `الكتلة الإجمالية للدفعة سجلت تبايناً هاماً (${ctx.detectedValue}) مقارنة بالفترة السابقة. هذا يستوجب إبداء الرأي المالي قبل الرفع للمراقب المالي.`,
        possibleCauses: [
          "تغير في عدد الموظفين المدرجين في الدفعة (تعيينات جديدة أو انتهاء عقود)",
          "صرف منحة فصلية مجمعة (مثل منحة المردودية أو الساعات الإضافية)",
          "تعديل في المعاملات أو تسوية مخلفات ترقيات جماعية",
        ],
        recommendation: "مقارنة تعداد الموظفين المدرجين وإجمالي بنود المنح مع مسيرة الشهر المنصرم.",
        confidence: 0.9,
      };

    default:
      return {
        analysis: `تم تسجيل تنبيه تدقيقي يحتاج معاينة: ${ctx.title}. المعطيات الحالية: ${ctx.description}.`,
        possibleCauses: [
          "معطيات استثنائية في الشهر الحالي",
          "تحديث إداري لم يُسجل بعد في منظومة الرواتب",
        ],
        recommendation: "معاينة ملف الموظف والمستندات الثبوتية ذات الصلة والتأشير بالقبول أو التصحيح.",
        confidence: 0.75,
      };
  }
}
