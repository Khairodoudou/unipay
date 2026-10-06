"use client";

import { useState } from "react";
import { updateSystemSettingsAction } from "@/lib/admin/settings/actions";
import {
  Settings,
  Shield,
  Sliders,
  Server,
  Save,
  CheckCircle2,
  Loader2,
  Info,
  Lock,
} from "lucide-react";

interface SettingItem {
  key: string;
  value: string;
  category: string;
  labelAr: string;
  descriptionAr: string | null;
}

interface SettingsTabsFormProps {
  settings: Record<string, SettingItem>;
}

export function SettingsTabsForm({ settings }: SettingsTabsFormProps) {
  const [activeTab, setActiveTab] = useState<"general" | "security" | "interface" | "system">("general");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateSystemSettingsAction(formData);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "تعذر حفظ الإعدادات.");
    } else {
      setSuccessMessage("تم حفظ وتحديث الإعدادات بنجاح.");
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const getVal = (key: string, defaultVal = "") => {
    return settings[key]?.value || defaultVal;
  };

  return (
    <div className="space-y-6">
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

      {/* Tabs Nav */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "general"
              ? "border-teal-600 text-teal-700 bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>الإعدادات العامة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "border-teal-600 text-teal-700 bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>الأمان والجلسات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("interface")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "interface"
              ? "border-teal-600 text-teal-700 bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>العرض والواجهة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "system"
              ? "border-teal-600 text-teal-700 bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>معلومات المنظومة</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab 1: General */}
        {activeTab === "general" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                الهوية العامة والتوقيت
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تكوين المسميات الرسمية المعروضة والمنطقة الزمنية
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المنصة الرقمية
                </label>
                <input
                  type="text"
                  name="PLATFORM_NAME"
                  defaultValue={getVal("PLATFORM_NAME", "UNI-PAY")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المؤسسة المعتمد
                </label>
                <input
                  type="text"
                  name="INSTITUTION_NAME"
                  defaultValue={getVal("INSTITUTION_NAME", "جامعة الجزائر 1")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white font-bold"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اللغة الافتراضية للواجهة
                </label>
                <select
                  name="DEFAULT_LANGUAGE"
                  defaultValue={getVal("DEFAULT_LANGUAGE", "ar")}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white font-bold text-slate-700"
                >
                  <option value="ar">العربية (اللغة الرسمية - RTL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المنطقة الزمنية (Timezone)
                </label>
                <input
                  type="text"
                  name="DEFAULT_TIMEZONE"
                  defaultValue={getVal("DEFAULT_TIMEZONE", "Africa/Algiers")}
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security */}
        {activeTab === "security" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  سياسات الجلسات وكلمات المرور
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ضوابط تسجيل الدخول وصلاحية الجلسات المشفرة
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>السرية محفوظة بالبيئة (.env)</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مدة صلاحية الجلسة بالساعات (Session TTL)
                </label>
                <input
                  type="number"
                  name="SESSION_TTL_HOURS"
                  min={1}
                  max={720}
                  defaultValue={getVal("SESSION_TTL_HOURS", "168")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  168 ساعة = 7 أيام. تنتهي الجلسة وتتطلب إعادة التحقق.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الحد الأدنى لطول كلمة المرور
                </label>
                <input
                  type="number"
                  name="PASSWORD_MIN_LENGTH"
                  min={8}
                  max={32}
                  defaultValue={getVal("PASSWORD_MIN_LENGTH", "8")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  موصى به: 8 خانات على الأقل مع أحرف كبيرة وصغيرة وأرقام.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                ملاحظة أمنية سيادية: مفاتيح التشفير الحساسة (SESSION_SECRET، وسلسلة اتصال قاعدة البيانات DATABASE_URL) محفوظة في متغيرات البيئة المشفرة ولا يتم تخزينها أبداً في قاعدة البيانات.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Interface */}
        {activeTab === "interface" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                تفضيلات الواجهة والعرض
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                سمات الألوان والتصميم المؤسسي الجزائري
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  السمة الافتراضية للمنصة
                </label>
                <select
                  name="THEME_DEFAULT"
                  defaultValue={getVal("THEME_DEFAULT", "light")}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white font-medium text-slate-800"
                >
                  <option value="light">النمط المؤسسي الفاتح (Light Institutional)</option>
                  <option value="dark">النمط الليلي (Dark Mode)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مدة الاحتفاظ بسجلات التدقيق (أيام)
                </label>
                <input
                  type="number"
                  name="AUDIT_RETENTION_DAYS"
                  min={30}
                  max={3650}
                  defaultValue={getVal("AUDIT_RETENTION_DAYS", "365")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: System Info (Read-only non-sensitive) */}
        {activeTab === "system" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                المعلومات التقنية للمنظومة (للمعاينة فقط)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                بيانات الإصدار ومكونات البنية التحتية البرمجية
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  إصدار UNI-PAY
                </span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  v0.3.0 (Phase 3)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  إطار العمل
                </span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  Next.js 16.3.8 / React 19
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  محرك البيانات
                </span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  Prisma ORM 6.4.1 (SQLite)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  بيئة التشغيل
                </span>
                <span className="text-sm font-black text-teal-700 font-mono">
                  Production-Ready Core
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit button for editable tabs */}
        {activeTab !== "system" && (
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm focus-ring cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري حفظ الإعدادات...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
