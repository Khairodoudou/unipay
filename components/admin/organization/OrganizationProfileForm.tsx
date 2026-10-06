"use client";

import { useState } from "react";
import { updateOrganizationAction } from "@/lib/admin/organization/actions";
import {
  Building2,
  Save,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
} from "lucide-react";

interface OrganizationData {
  id: string;
  name: string;
  code: string;
  address: string | null;
  wilaya: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  isActive: boolean;
}

interface OrganizationProfileFormProps {
  organization: OrganizationData;
}

export function OrganizationProfileForm({ organization }: OrganizationProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("id", organization.id);

    const res = await updateOrganizationAction(formData);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "تعذر تحديث بيانات المؤسسة.");
    } else {
      setSuccessMessage("تم حفظ بيانات المؤسسة الجامعية بنجاح.");
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
              <span>بيانات المؤسسة الجامعية المركزية</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              الهوية الرسمية للجامعة المشرفة على مسيرات الأجور
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {organization.code}
            </span>
          </div>
        </div>

        {/* Name & Wilaya */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم الجامعة / المؤسسة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              defaultValue={organization.name}
              required
              minLength={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>الولاية</span>
            </label>
            <input
              type="text"
              name="wilaya"
              defaultValue={organization.wilaya || ""}
              placeholder="مثال: الجزائر (16)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            العنوان البريدي للمقر الرئيسي
          </label>
          <input
            type="text"
            name="address"
            defaultValue={organization.address || ""}
            placeholder="مثال: شارع ديدوش مراد، الجزائر الوسطى"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
        </div>

        {/* Contact info: phone, email, website */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>الهاتف / الفاكس</span>
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={organization.phone || ""}
              dir="ltr"
              placeholder="+213 21 00 00 00"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>البريد الإلكتروني الرسمي</span>
            </label>
            <input
              type="email"
              name="email"
              defaultValue={organization.email || ""}
              dir="ltr"
              placeholder="rectorat@univ.dz"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>الموقع الإلكتروني</span>
            </label>
            <input
              type="url"
              name="website"
              defaultValue={organization.website || ""}
              dir="ltr"
              placeholder="https://www.univ.dz"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            نبذة أو تعريف رسمي بالمؤسسة
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={organization.description || ""}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm focus-ring cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري حفظ البيانات...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ بيانات المؤسسة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
