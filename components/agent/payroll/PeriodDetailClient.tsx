"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import {
  changePayrollPeriodStatusAction,
  createPayrollBatchAction,
} from "@/lib/agent/payroll-actions";

export type PeriodStatus = "DRAFT" | "OPEN" | "PROCESSING" | "CLOSED";

export interface Period {
  id: string;
  status: string;
  label?: string | null;
  year?: number;
  month?: number;
}

interface PeriodDetailClientProps {
  period: Period;
}

export function PeriodDetailClient({ period }: PeriodDetailClientProps) {
  const router = useRouter();
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: "DRAFT" | "OPEN" | "PROCESSING" | "CLOSED") => {
    setError(null);
    setLoading(true);

    try {
      const res = await changePayrollPeriodStatusAction({ periodId: period.id, status: newStatus });
      if (!res.success) {
        setError(res.error || "فشل تغيير حالة الفترة");
        setLoading(false);
        return;
      }
      setSuccess(`تم تغيير حالة الفترة إلى: ${newStatus}`);
      setTimeout(() => {
        setSuccess(null);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("periodId", period.id);

      const res = await createPayrollBatchAction(formData);
      if (!res.success) {
        setError(res.error || "فشل إنشاء دفعة الأجر");
        setLoading(false);
        return;
      }

      setSuccess("تم إنشاء دفعة الأجر بنجاح.");
      setTimeout(() => {
        setBatchModalOpen(false);
        setSuccess(null);
        if (res.data?.batchId) {
          router.push(`/agent/batches/${res.data.batchId}`);
        } else {
          router.refresh();
        }
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={period.status}
          disabled={loading}
          onChange={(e) => handleStatusChange(e.target.value as PeriodStatus)}
          className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:border-teal-500 cursor-pointer shadow-2xs"
        >
          <option value="DRAFT">مسودة (DRAFT)</option>
          <option value="OPEN">مفتوحة (OPEN)</option>
          <option value="PROCESSING">قيد المعالجة (PROCESSING)</option>
          <option value="CLOSED">مغلقة (CLOSED)</option>
        </select>

        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setBatchModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء دفعة أجر جديدة (Batch)</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Modal: Create Batch */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  إنشاء دفعة أجر جديدة للفترة: {period.label}
                </h3>
              </div>
              <button
                onClick={() => setBatchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تسمية الدفعة (اختياري)
                </label>
                <input
                  type="text"
                  name="label"
                  placeholder="مثال: دفعة الأساتذة والموظفين الدائمين"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات أو توجيهات
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="أي ملاحظات حول هذه الدفعة..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>إنشاء الدفعة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
