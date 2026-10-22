"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUniversityAction } from "@/lib/super-admin/universities/actions";
import { ALGERIAN_WILAYAS } from "@/lib/constants/algerian-wilayas";
import {
  Building2,
  Save,
  ArrowRight,
  AlertCircle,
  Loader2,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function UniversityCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdminSection, setShowAdminSection] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await createUniversityAction(formData);
      if (!res.success) {
        setErrorMessage(res.error || "فشل تسجيل الجامعة، يرجى المحاولة لاحقاً.");
      } else if (res.data?.universityId) {
        router.push(`/super-admin/universities/${res.data.universityId}?created=true`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Primary Institutional Identity */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">
            الهوية المؤسسية والرمز الوطني
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* University Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700">
              اسم المؤسسة الجامعية (بالعربية) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="مثال: جامعة هواري بومدين للعلوم والتكنولوجيا"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-400">
              الاسم الرسمي الكامل كما هو معتمد في الجريدة الرسمية وقرارات الإنشاء.
            </p>
          </div>

          {/* Institutional Code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              الرمز المؤسسي الفريد (Code) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              required
              placeholder="مثال: USTHB أو UNIV-ALGER1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-400">
              رمز لاتيني فريد لا يتكرر يستخدم في عزل البيانات والجداول (Tenant Isolation).
            </p>
          </div>

          {/* Wilaya Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              الولاية <span className="text-rose-500">*</span>
            </label>
            <select
              name="wilaya"
              required
              defaultValue="الجزائر"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              {ALGERIAN_WILAYAS.map((w) => (
                <option key={w.code} value={w.nameAr}>
                  {w.code} - ولاية {w.nameAr} ({w.nameFr})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Institutional Contact & Geographic Location */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
          بيانات التواصل والعنوان
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700">
              العنوان البريدي للمقر الرئيسي
            </label>
            <input
              type="text"
              name="address"
              placeholder="مثال: طريق بن عكنون، الجزائر العاصمة"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              الهاتف المؤسسي
            </label>
            <input
              type="text"
              name="phone"
              placeholder="021 XX XX XX"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              البريد الإلكتروني الرسمي
            </label>
            <input
              type="email"
              name="email"
              placeholder="contact@univ.dz"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700">
              الموقع الإلكتروني
            </label>
            <input
              type="url"
              name="website"
              placeholder="https://www.univ.dz"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700">
              وصف أو ملاحظات
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="ملاحظات توثيقية إضافية حول المؤسسة الجامعية..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* ─── SECTION OPTIONNELLE : Premier administrateur ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setShowAdminSection(!showAdminSection)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${showAdminSection ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}>
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                إنشاء أول حساب مدير نظام للجامعة
                <span className="mr-2 text-xs font-normal text-slate-400">(اختياري)</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                يمكنك تعيين المدير لاحقاً من صفحة تفاصيل الجامعة
              </p>
            </div>
          </div>
          {showAdminSection ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {showAdminSection && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
            {/* Info banner */}
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 leading-relaxed">
                <p className="font-bold mb-0.5">مدير نظام محلي (ADMIN)</p>
                <p className="text-indigo-700">سيتمكن من تسجيل الدخول عبر <code className="bg-indigo-100 px-1 rounded font-mono">/login</code> وإدارة الموظفين ومسيرات الرواتب لهذه الجامعة فقط.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  الاسم الشخصي
                </label>
                <input
                  type="text"
                  name="adminFirstName"
                  placeholder="مثال: أحمد"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  اللقب العائلي
                </label>
                <input
                  type="text"
                  name="adminLastName"
                  placeholder="مثال: بن علي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  البريد الإلكتروني للمدير
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  placeholder="admin@univ-ubma.dz"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
                />
                <p className="text-[11px] text-slate-400">
                  سيُستخدم هذا البريد لتسجيل الدخول عبر صفحة /login
                </p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  كلمة المرور الأولية (8 أحرف على الأقل)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="adminPassword"
                    minLength={8}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <p className="text-[10px] text-slate-400">
                    سيتم تشفير كلمة المرور فورياً بواسطة Bcrypt — لا يتم تخزينها كنص صريح.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit / Cancel Bar */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/super-admin/universities"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-all focus-ring"
        >
          <ArrowRight className="w-4 h-4" />
          <span>إلغاء والعودة للدليل</span>
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-ring cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري تسجيل الجامعة...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>اعتماد وتسجيل الجامعة</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
