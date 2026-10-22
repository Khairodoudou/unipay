"use client";

import { useState, useTransition } from "react";
import { updateUniversityAction } from "@/lib/super-admin/universities/actions";
import { ALGERIAN_WILAYAS } from "@/lib/constants/algerian-wilayas";
import { Save, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface UniversityEditFormProps {
  university: {
    id: string;
    code: string;
    name: string;
    wilaya: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    description: string | null;
  };
}

export function UniversityEditForm({ university }: UniversityEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const formData = new FormData(event.currentTarget);
    formData.set("id", university.id);

    startTransition(async () => {
      const res = await updateUniversityAction(formData);
      if (!res.success) {
        setErrorMessage(res.error || "فشل تعديل البيانات.");
      } else {
        setSuccessMessage("تم حفظ وتحديث بيانات الجامعة بنجاح.");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-700">
            اسم المؤسسة الجامعية (بالعربية)
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={university.name}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Code (Read-only for safety) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500">
            الرمز المؤسسي الفريد (غير قابل للتغيير)
          </label>
          <input
            type="text"
            disabled
            value={university.code}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-mono font-bold text-slate-600 cursor-not-allowed"
          />
        </div>

        {/* Wilaya */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            الولاية
          </label>
          <select
            name="wilaya"
            required
            defaultValue={university.wilaya}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {ALGERIAN_WILAYAS.map((w) => (
              <option key={w.code} value={w.nameAr}>
                {w.code} - ولاية {w.nameAr} ({w.nameFr})
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-700">
            العنوان البريدي
          </label>
          <input
            type="text"
            name="address"
            defaultValue={university.address || ""}
            placeholder="العنوان البريدي للمقر الرئيسي"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            الهاتف المؤسسي
          </label>
          <input
            type="text"
            name="phone"
            defaultValue={university.phone || ""}
            placeholder="021 XX XX XX"
            dir="ltr"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            البريد الإلكتروني الرسمي
          </label>
          <input
            type="email"
            name="email"
            defaultValue={university.email || ""}
            placeholder="contact@univ.dz"
            dir="ltr"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
          />
        </div>

        {/* Website */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-700">
            الموقع الإلكتروني
          </label>
          <input
            type="url"
            name="website"
            defaultValue={university.website || ""}
            placeholder="https://www.univ.dz"
            dir="ltr"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-700">
            وصف أو ملاحظات
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={university.description || ""}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-ring cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري حفظ التعديلات...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ البيانات المؤسسية</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
