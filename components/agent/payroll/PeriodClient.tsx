"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { createPayrollPeriodAction } from "@/lib/agent/payroll-actions";

export function PeriodClient() {
  const router = useRouter();
  const [openNew, setOpenNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const defaultYear = currentYear >= 2026 && currentYear <= 2056 ? currentYear : 2026;

  const monthsAr = [
    "جانفي (يناير)",
    "فيفري (فبراير)",
    "مارس",
    "أفريل (أبريل)",
    "ماي (مايو)",
    "جوان (يونيو)",
    "جويلية (يوليو)",
    "أوت (أغسطس)",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const [formYear, setFormYear] = useState<number>(defaultYear);
  const [formMonth, setFormMonth] = useState<number>(currentMonth);
  const [formLabel, setFormLabel] = useState<string>(
    `أجر شهر ${monthsAr[currentMonth - 1]} ${defaultYear}`
  );
  const [isLabelCustom, setIsLabelCustom] = useState<boolean>(false);

  const onYearChange = (y: number) => {
    setFormYear(y);
    if (!isLabelCustom) {
      setFormLabel(`أجر شهر ${monthsAr[formMonth - 1]} ${y}`);
    }
  };

  const onMonthChange = (m: number) => {
    setFormMonth(m);
    if (!isLabelCustom) {
      setFormLabel(`أجر شهر ${monthsAr[m - 1]} ${formYear}`);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createPayrollPeriodAction(formData);

      if (!res.success) {
        setError(res.error || "فشل إنشاء فترة الأجر");
        setLoading(false);
        return;
      }

      setSuccess("تم إنشاء فترة الأجر بنجاح.");
      setTimeout(() => {
        setOpenNew(false);
        setSuccess(null);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setSuccess(null);
          setFormLabel(`أجر شهر ${monthsAr[formMonth - 1]} ${formYear}`);
          setIsLabelCustom(false);
          setOpenNew(true);
        }}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-sm hover:shadow transition-all focus-ring cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>إنشاء فترة أجر جديدة</span>
      </button>

      {/* Modal: New Payroll Period */}
      {openNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">إنشاء فترة أجر جديدة</h3>
              </div>
              <button
                onClick={() => setOpenNew(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السنة</label>
                  <select
                    name="year"
                    value={formYear}
                    onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                    required
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900 bg-white cursor-pointer"
                  >
                    {Array.from({ length: 2056 - 2026 + 1 }, (_, i) => 2026 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الشهر</label>
                  <select
                    name="month"
                    value={formMonth}
                    onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900 bg-white cursor-pointer"
                  >
                    {monthsAr.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {idx + 1} - {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تسمية الفترة (Label) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="label"
                  required
                  value={formLabel}
                  onChange={(e) => {
                    setFormLabel(e.target.value);
                    setIsLabelCustom(true);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenNew(false)}
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
                  <span>إنشاء الفترة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
