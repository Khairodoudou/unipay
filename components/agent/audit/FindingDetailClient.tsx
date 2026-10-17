"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Info,
  User,
  ThumbsDown,
  CheckSquare,
  ShieldCheck,
} from "lucide-react";
import {
  FindingType,
  FindingSeverity,
  FindingStatus,
  FINDING_TYPES,
  SEVERITY_CONFIG,
  STATUS_CONFIG,
} from "@/lib/audit/types";
import {
  reviewFindingAction,
  confirmFindingAction,
  markFalsePositiveAction,
  resolveFindingAction,
  analyzeFindingWithAIAction,
} from "@/lib/audit/actions";

export interface AIAnalysisData {
  id: string;
  model: string;
  analysis: string;
  recommendation: string;
  confidence: number;
  possibleCauses?: string[] | null;
  createdAt: string | Date;
}

export interface FindingDetailProps {
  finding: {
    id: string;
    batchId: string;
    type: FindingType;
    severity: FindingSeverity;
    title: string;
    description: string;
    detectedValue?: string | null;
    expectedValue?: string | null;
    status: FindingStatus;
    source: string;
    confidence?: number | null;
    createdAt: string | Date;
    resolvedAt?: string | Date | null;
    resolutionNote?: string | null;
    resolvedByUser?: {
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    batch: {
      id: string;
      versionNumber: number;
      period: {
        label: string;
      };
    };
    employee?: {
      id: string;
      matricule: string;
      firstName: string;
      lastName: string;
      grade?: string | null;
      baseSalary: number | string;
      rib?: string | null;
      organizationUnit?: {
        name: string;
      } | null;
    } | null;
    aiAnalyses: AIAnalysisData[];
  };
}

export function FindingDetailClient({ finding }: FindingDetailProps) {
  const router = useRouter();

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AIAnalysisData | null>(
    finding.aiAnalyses[0] || null
  );

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [decisionMode, setDecisionMode] = useState<
    "REVIEW" | "CONFIRM" | "FALSE_POSITIVE" | "RESOLVE" | null
  >(null);
  const [noteText, setNoteText] = useState("");

  const sevConfig = SEVERITY_CONFIG[finding.severity];
  const statusMeta = STATUS_CONFIG[finding.status];
  const typeMeta = FINDING_TYPES[finding.type];

  // Déclencher l'analyse IA
  const handleAnalyzeAI = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await analyzeFindingWithAIAction(finding.id);
      if (!res.success) {
        setAiError(res.error || "فشل تحليل الملاحظة بواسطة الذكاء الاصطناعي");
      } else if (res.data) {
        setLatestAnalysis({
          id: res.data.id,
          model: res.data.model,
          analysis: res.data.analysis,
          recommendation: res.data.recommendation,
          confidence: res.data.confidence,
          possibleCauses: res.data.possibleCauses,
          createdAt: res.data.createdAt,
        });
        router.refresh();
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setAiLoading(false);
    }
  };

  // Soumission de la décision humaine
  const handleDecisionSubmit = async () => {
    if (!decisionMode) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      let res;
      if (decisionMode === "REVIEW") {
        res = await reviewFindingAction({ findingId: finding.id, note: noteText });
      } else if (decisionMode === "CONFIRM") {
        res = await confirmFindingAction({ findingId: finding.id, note: noteText });
      } else if (decisionMode === "FALSE_POSITIVE") {
        if (!noteText.trim()) {
          setActionError("يجب تقديم تبرير إداري صريح لاعتبار الإنذار خاطئاً.");
          setActionLoading(false);
          return;
        }
        res = await markFalsePositiveAction({ findingId: finding.id, note: noteText });
      } else if (decisionMode === "RESOLVE") {
        if (!noteText.trim()) {
          setActionError("يجب توضيح إجراء التسوية المتخذ.");
          setActionLoading(false);
          return;
        }
        res = await resolveFindingAction({
          findingId: finding.id,
          resolutionNote: noteText,
        });
      }

      if (res && !res.success) {
        setActionError(res.error || "فشل تسجيل الإجراء");
      } else {
        setActionSuccess("تم حفظ القرار الإداري وتحديث سجل التدقيق بنجاح.");
        setDecisionMode(null);
        setNoteText("");
        router.refresh();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ القرار");
    } finally {
      setActionLoading(false);
    }
  };

  const severityIcon = (severity: FindingSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case "HIGH":
        return <ShieldAlert className="w-4 h-4 text-orange-600" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "INFO":
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Navigation Top */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href={`/agent/batches/${finding.batchId}/audit`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة تدقيق الدفعة ({finding.batch.period.label})</span>
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${sevConfig.badgeClass}`}
          >
            {severityIcon(finding.severity)}
            <span>{sevConfig.labelAr}</span>
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
          >
            {statusMeta.labelAr}
          </span>
        </div>
      </div>

      {/* Main Finding Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {typeMeta?.labelAr} ({finding.type})
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            {finding.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تاريخ الرصد: {new Date(finding.createdAt).toLocaleString("fr-FR")} • المصدر:{" "}
            {finding.source === "AI_ASSISTANT" ? "المساعد الذكي (Gemini)" : "محرك القواعد الآلي"}
          </p>
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-900 mb-1">تفاصيل الخلل المرصود:</p>
          <p>{finding.description}</p>
        </div>

        {/* Values Comparison (Detected vs Expected) */}
        {(finding.detectedValue || finding.expectedValue) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 block mb-1">
                القيمة المرصودة حالياً (Detected Value)
              </span>
              <span className="font-mono font-bold text-sm text-rose-950">
                {finding.detectedValue || "غير محدد"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                القيمة المنتظرة نظامياً (Expected Value)
              </span>
              <span className="font-mono font-bold text-sm text-emerald-950">
                {finding.expectedValue || "غير محدد"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Employee Context (if attached) */}
      {finding.employee && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <User className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">
              بيانات الموظف المعني بالتدقيق
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">الاسم الكامل</span>
              <strong className="text-slate-900 text-sm">
                {finding.employee.firstName} {finding.employee.lastName}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">الرقم الوظيفي</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {finding.employee.matricule}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">الرتبة والمصلحة</span>
              <span className="text-slate-800 font-medium">
                {finding.employee.grade || "غير محدد"} •{" "}
                {finding.employee.organizationUnit?.name || "الإدارة"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">الراتب الأساسي</span>
              <span className="font-mono font-bold text-slate-900">
                {Number(finding.employee.baseSalary).toLocaleString("fr-FR")} دج
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Analysis Section ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-2xl p-6 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  المساعد الذكي للتدقيق (Gemini AI Audit)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-500/40">
                  مساعد تحليلي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تحليل أسباب الخلل وتقديم التوصيات الرقابية للمستخدم المخول
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyzeAI}
            disabled={aiLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري استشارة الذكاء الاصطناعي...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{latestAnalysis ? "إعادة التحليل بالذكاء الاصطناعي" : "تحليل بواسطة الذكاء الاصطناعي"}</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {latestAnalysis ? (
          <div className="space-y-4 pt-1">
            {/* Analysis Text */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-purple-300">ملخص التحليل الفني:</span>
                <span className="font-mono text-[11px] text-slate-400">
                  النموذج: {latestAnalysis.model}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {latestAnalysis.analysis}
              </p>
            </div>

            {/* Possible Causes */}
            {latestAnalysis.possibleCauses && latestAnalysis.possibleCauses.length > 0 && (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 space-y-2">
                <span className="text-xs font-bold text-amber-300 block">
                  الأسباب المحتملة لظهور هذه الملاحظة:
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {latestAnalysis.possibleCauses.map((cause, idx) => (
                    <li key={idx}>{cause}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-teal-950/50 rounded-xl p-4 border border-teal-700/60 space-y-1">
              <span className="text-xs font-bold text-teal-300 block">
                توصية المساعد الذكي للمراجع البشري:
              </span>
              <p className="text-xs text-teal-100 leading-relaxed font-medium">
                {latestAnalysis.recommendation}
              </p>
            </div>

            {/* Confidence & Institutional Disclaimer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">مؤشر ثقة الذكاء الاصطناعي (AI Confidence):</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {Math.round(latestAnalysis.confidence * 100)}%
                </span>
                <span className="text-slate-500 text-[10px]">(تقدير استشاري وليس يقيناً)</span>
              </div>

              <div className="text-slate-400 italic text-[11px] max-w-md">
                تنبيه إداري: يشكل التحليل الذكي وسيلة دعم استشارية، وتبقى المسؤولية الكاملة والقرار النهائي على عاتق المستخدم المخول.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>انقر على &quot;تحليل بواسطة الذكاء الاصطناعي&quot; لاستدعاء تحليل Gemini وتحديد الأسباب المحتملة والتوصيات.</p>
          </div>
        )}
      </div>

      {/* ── Human Review & Decision Card ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">
            القرار البشري وتوثيق المعالجة الرقابية (Human Review Decision)
          </h2>
        </div>

        {actionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Previous Resolution History (if any) */}
        {finding.resolutionNote && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>الملاحظة الإدارية المسجلة سابقاً:</span>
              {finding.resolvedByUser && (
                <span className="text-[11px] text-slate-500 font-normal">
                  بواسطة: {finding.resolvedByUser.firstName} {finding.resolvedByUser.lastName}
                  {finding.resolvedAt ? ` (${new Date(finding.resolvedAt).toLocaleDateString("fr-FR")})` : ""}
                </span>
              )}
            </div>
            <p className="text-slate-800 italic mt-0.5">{finding.resolutionNote}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setDecisionMode("REVIEW")}
              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                decisionMode === "REVIEW"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <CheckSquare className="w-4 h-4 mx-auto mb-1" />
              <span>فحص ومعاينة</span>
            </button>

            <button
              type="button"
              onClick={() => setDecisionMode("CONFIRM")}
              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                decisionMode === "CONFIRM"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
              <span>تأكيد الخلل</span>
            </button>

            <button
              type="button"
              onClick={() => setDecisionMode("FALSE_POSITIVE")}
              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                decisionMode === "FALSE_POSITIVE"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <ThumbsDown className="w-4 h-4 mx-auto mb-1" />
              <span>إنذار خاطئ</span>
            </button>

            <button
              type="button"
              onClick={() => setDecisionMode("RESOLVE")}
              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                decisionMode === "RESOLVE"
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
              <span>تسوية ومعالجة</span>
            </button>
          </div>

          {/* Note Input & Submit */}
          {decisionMode && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in">
              <label className="block text-xs font-bold text-slate-800">
                {decisionMode === "FALSE_POSITIVE"
                  ? "التبرير الإداري لاعتبار الإنذار خاطئاً (إلزامي):"
                  : decisionMode === "RESOLVE"
                  ? "بيان الإجراء التصحيحي المتخذ للتسوية (إلزامي):"
                  : "ملاحظة تدقيق اختيارية:"}
              </label>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="أدخل الشرح أو الإجراء الإداري المتخذ لحفظه في سجل التدقيق..."
                rows={3}
                className="w-full p-3 rounded-xl text-xs bg-white border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionMode(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDecisionSubmit}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>تأكيد وحفظ القرار في سجل التدقيق</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
