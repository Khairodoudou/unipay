"use client";

import { useState } from "react";
import Link from "next/link";
import { updateOrganizationUnitAction } from "@/lib/admin/organization/actions";
import {
  Save,
  Building2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface UnitDetailProps {
  unit: {
    id: string;
    name: string;
    code: string;
    type: string;
    parentId: string | null;
    isActive: boolean;
  };
  otherUnits: { id: string; name: string; code: string }[];
}

export function UnitDetailForm({ unit, otherUnits }: UnitDetailProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("id", unit.id);

    const res = await updateOrganizationUnitAction(formData);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "تعذر تعديل الوحدة.");
    } else {
      setSuccessMessage("تم حفظ تعديلات الوحدة الإدارية بنجاح.");
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold animate-fade-in flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 px-2"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>تعديل بيانات الوحدة التنظيمية</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديد التبعية الإدارية ونوع الهيكل
            </p>
          </div>
          <code className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {unit.code}
          </code>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم الوحدة الإدارية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              defaultValue={unit.name}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نوع الهيكل <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              defaultValue={unit.type}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
            >
              <option value="PRESIDENCY">رئاسة الجامعة</option>
              <option value="SECRETARIAT_GENERAL">أمانة عامة</option>
              <option value="FACULTY">كلية</option>
              <option value="DIRECTION">مديرية مركزية</option>
              <option value="SERVICE">مصلحة / مديرية فرعية</option>
              <option value="DEPARTMENT">قسم</option>
              <option value="OTHER">وحدة أخرى</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            الوحدة الأم التابعة لها (الهيكل الأعلى)
          </label>
          <select
            name="parentId"
            defaultValue={unit.parentId || ""}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
          >
            <option value="">-- بدون هيكل أعلى (مستوى رئيسي مستقل) --</option>
            {otherUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-800">
              حالة نشاط الوحدة
            </span>
            <p className="text-[11px] text-slate-400">
              الوحدات النشطة تظهر في خيارات التوزيع الوظيفي
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={unit.isActive}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/organization"
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
          >
            إلغاء والعودة
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm focus-ring cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
