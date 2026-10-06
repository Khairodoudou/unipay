"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ShieldCheck,
  Send,
  RotateCw,
} from "lucide-react";
import {
  calculateBatchAction,
  markBatchReadyForReviewAction,
} from "@/lib/agent/payroll-engine";

export interface PayrollRecord {
  id: string;
  snapshotMatricule: string;
  snapshotName: string;
  snapshotGrade?: string | null;
  snapshotBaseSalary: number | string;
  totalAllowances: number | string;
  grossAmount: number | string;
  totalContributions: number | string;
  totalTaxes: number | string;
  netAmount: number | string;
}

interface CalculationClientProps {
  batchId: string;
  batchStatus: string;
  periodLabel: string;
  versionNumber: number;
  totalEmployees: number;
  recordedAttendanceCount: number;
  missingAttendanceCount: number;
  records: PayrollRecord[];
}

export function CalculationClient({
  batchId,
  batchStatus,
  totalEmployees,
  recordedAttendanceCount,
  missingAttendanceCount,
  records,
}: CalculationClientProps) {
  const router = useRouter();
  const [calculating, setCalculating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<{ employeeId: string; matricule: string; fullName: string; reason: string }[]>([]);

  const hasBlockers = totalEmployees === 0 || missingAttendanceCount > 0;
  const isReadyForReview = batchStatus === "READY_FOR_REVIEW";
  const isCalculated = batchStatus === "CALCULATED";

  const handleCalculate = async () => {
    setCalculating(true);
    setError(null);
    setBlockers([]);

    try {
      const res = await calculateBatchAction(batchId);
      if (!res.success) {
        setError(res.error || "فشل احتساب الدفعة");
        if (res.data?.blockers) {
          setBlockers(res.data.blockers);
        }
      } else if (res.data) {
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء معالجة الأجور");
    } finally {
      setCalculating(false);
    }
  };

  const handleMarkReady = async () => {
    if (!confirm("هل أنت متأكد من تثبيت جاهزية هذا اللوط للمراجعة ونقله إلى المرحلة التالية؟")) {
      return;
    }

    setReviewing(true);
    setError(null);

    try {
      const res = await markBatchReadyForReviewAction(batchId);
      if (!res.success) {
        setError(res.error || "فشل تعيين الدفعة كجاهزة للمراجعة");
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setReviewing(false);
    }
  };

  // Aggregated totals from existing records if calculated
  const totalGross = records.reduce((acc, r) => acc + Number(r.grossAmount), 0);
  const totalContributions = records.reduce((acc, r) => acc + Number(r.totalContributions), 0);
  const totalTaxes = records.reduce((acc, r) => acc + Number(r.totalTaxes), 0);
  const totalNet = records.reduce((acc, r) => acc + Number(r.netAmount), 0);

  return (
    <div className="space-y-6">
      {/* Pre-Flight Checklist Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">
              فحص الجاهزية والتحقق المسبق (Pre-Flight Checks)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {totalEmployees} موظف مدرج
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">الموظفون في الدفعة</span>
              <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                {totalEmployees} موظف
              </strong>
            </div>
            {totalEmployees > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">سجلات الحضور والغيابات</span>
              <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                {recordedAttendanceCount} / {totalEmployees} مكتمل
              </strong>
            </div>
            {missingAttendanceCount === 0 && totalEmployees > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">قواعد الأجور والضرائب (المرحلة 3)</span>
              <strong className="text-teal-800 font-bold block mt-0.5">
                قواعد معتمدة ومؤرخة
              </strong>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Warning banner if attendance is missing */}
        {missingAttendanceCount > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                يوجد {missingAttendanceCount} موظفاً لم يتم تسجيل بيانات حضورهم بعد. يجب تسجيل الحضور قبل بدء الاحتساب.
              </span>
            </div>
            <Link
              href={`/agent/batches/${batchId}/attendance`}
              className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shrink-0"
            >
              تسجيل الحضور الآن
            </Link>
          </div>
        )}

        {/* Error / Blockers list */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            {blockers.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-[11px] pr-4">
                {blockers.map((b, idx) => (
                  <li key={idx}>
                    <strong className="font-mono">{b.matricule}</strong> ({b.fullName}): {b.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {isReadyForReview ? (
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                الدفعة في حالة &quot;جاهز للمراجعة&quot; (READY_FOR_REVIEW) ومغلقة عن التعديل.
              </span>
            ) : isCalculated ? (
              <span className="font-bold text-teal-700 flex items-center gap-1.5">
                <Calculator className="w-4 h-4" />
                الدفعة محسوبة بنجاح. يمكنك إعادة الاحتساب أو تأكيد الجاهزية للمراجعة.
              </span>
            ) : (
              <span>انقر أدناه لتشغيل محرك الأجور عبر القواعد المعتمدة.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isReadyForReview && (
              <button
                onClick={handleCalculate}
                disabled={calculating || hasBlockers}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري معالجة وحساب الأجور...</span>
                  </>
                ) : (
                  <>
                    {records.length > 0 ? (
                      <RotateCw className="w-4 h-4" />
                    ) : (
                      <Calculator className="w-4 h-4" />
                    )}
                    <span>{records.length > 0 ? "إعادة احتساب الدفعة" : "تشغيل محرك الاحتساب"}</span>
                  </>
                )}
              </button>
            )}

            {isCalculated && !isReadyForReview && (
              <button
                onClick={handleMarkReady}
                disabled={reviewing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 shadow-md transition-all cursor-pointer"
              >
                {reviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التثبيت...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>جاهز للمراجعة (READY_FOR_REVIEW)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calculated Results Summary Cards */}
      {records.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">إجمالي الراتب الخام (Brut)</span>
              <span className="text-xl font-black font-mono text-slate-900 mt-2 block">
                {totalGross.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} دج
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">الاشتراكات الاجتماعية (CNAS)</span>
              <span className="text-xl font-black font-mono text-blue-700 mt-2 block">
                {totalContributions.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} دج
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">الضريبة على الدخل (IRG)</span>
              <span className="text-xl font-black font-mono text-amber-700 mt-2 block">
                {totalTaxes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} دج
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border-teal-200">
              <span className="text-xs font-bold text-teal-800 block">إجمالي الصافي للدفع (Net)</span>
              <span className="text-2xl font-black font-mono text-teal-950 mt-1 block">
                {totalNet.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} دج
              </span>
            </div>
          </div>

          {/* Records Table with Immutable Snapshots */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  تفاصيل نتائج الاحتساب وسجلات اللقطة الثابتة (Payroll Records Snapshot)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تم حفظ قيم الرواتب والقواعد المستخدمة بشكل غير قابل للتعديل العشوائي
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {records.length} سجل محسوب
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3">الرقم الوظيفي</th>
                    <th className="px-4 py-3">الموظف</th>
                    <th className="px-4 py-3">الرتبة</th>
                    <th className="px-4 py-3 font-mono">الأساسي</th>
                    <th className="px-4 py-3 font-mono">المنح</th>
                    <th className="px-4 py-3 font-mono">الخام (Gross)</th>
                    <th className="px-4 py-3 font-mono">الاشتراكات (CNAS)</th>
                    <th className="px-4 py-3 font-mono">الضريبة (IRG)</th>
                    <th className="px-4 py-3 font-mono">الصافي (Net)</th>
                    <th className="px-4 py-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          {rec.snapshotMatricule}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {rec.snapshotName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {rec.snapshotGrade || "—"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">
                        {Number(rec.snapshotBaseSalary).toLocaleString("fr-FR")} دج
                      </td>
                      <td className="px-4 py-3.5 font-mono text-teal-700 font-bold">
                        +{Number(rec.totalAllowances).toLocaleString("fr-FR")} دج
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {Number(rec.grossAmount).toLocaleString("fr-FR")} دج
                      </td>
                      <td className="px-4 py-3.5 font-mono text-blue-700">
                        -{Number(rec.totalContributions).toLocaleString("fr-FR")} دج
                      </td>
                      <td className="px-4 py-3.5 font-mono text-amber-700">
                        -{Number(rec.totalTaxes).toLocaleString("fr-FR")} دج
                      </td>
                      <td className="px-4 py-3.5 font-mono font-black text-emerald-800 text-sm">
                        {Number(rec.netAmount).toLocaleString("fr-FR")} دج
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          مكتمل
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
