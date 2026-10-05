"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Info,
  HelpCircle,
  Loader2,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Demo roles for university testing & evaluation
const demoRoles = [
  {
    role: "عون الأجور (RH)",
    name: "مصلحة الرواتب",
    email: "paie@universite.dz",
    badge: "RH / Paie",
    badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
  {
    role: "رئيس المصلحة",
    name: "مصلحة المستخدمين",
    email: "chef.service@universite.dz",
    badge: "Chef Service",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  {
    role: "مدير الجامعة",
    name: "إدارة الجامعة",
    email: "directeur@universite.dz",
    badge: "Directeur",
    badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  {
    role: "المراقب المالي",
    name: "الرقابة المالية المعتمدة",
    email: "cf@universite.dz",
    badge: "Contrôleur",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  {
    role: "الموظف / الأستاذ",
    name: "كشوف الرواتب",
    email: "employe@universite.dz",
    badge: "Employé",
    badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
];

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const emailError =
    email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "الرجاء إدخال عنوان بريد إلكتروني صحيح (مثال: nom@universite.dz)"
      : null;

  const passwordError =
    password.length > 0 && password.length < 6
      ? "كلمة المرور يجب أن تتكون من 6 أحرف على الأقل"
      : null;

  const isFormValid = email.length > 0 && password.length >= 6 && !emailError;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;

    setInfoMessage(null);
    startTransition(async () => {
      // Phase 1 preview: simulate validation check
      await new Promise((r) => setTimeout(r, 900));
      setInfoMessage(
        "تم التحقق بنجاح! نظام المصادقة وقواعد البيانات سيتم ربطهما في المرحلة 2 (Phase 2)."
      );
    });
  }

  function handleQuickFill(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("UniPay2026!#");
    setInfoMessage(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[140px]" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        {/* Top return bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 hover:text-uni-navy hover:border-uni-navy/30 transition-all focus-ring group"
          >
            <ArrowRight
              className="h-4 w-4 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-uni-navy"
              aria-hidden="true"
            />
            <span>العودة إلى الصفحة الرئيسية</span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Building2 className="h-4 w-4 text-teal-600" />
            <span>وزارة التعليم العالي والبحث العلمي</span>
          </span>
        </div>

        {/* Enterprise Split Container */}
        <div className="grid lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
          {/* Right Column: Institutional Identity & Security Showcase (5 cols on lg) */}
          <div className="lg:col-span-5 bg-[#0b1528] text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background pattern */}
            <div
              className="absolute inset-0 hero-pattern opacity-30 pointer-events-none"
              aria-hidden="true"
            />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-500/15 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-teal-400/15 blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-6">
              {/* Institutional Header Line */}
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-teal-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span>المنصة الرقمية الموحدة</span>
                </span>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-blue-900/30">
                    U
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight leading-none">
                      UNI-PAY
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      نظام تسيير ومعالجة أجور موظفي الجامعة
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Security Value Proposition */}
              <div className="flex flex-col gap-3.5 pt-2">
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white mb-0.5">
                      ولوج مؤمّن ومشفّر
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      الوصول محصور بالحسابات المهنية المعتمدة للمؤسسة الجامعية لحماية البيانات والمال العام.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white mb-0.5">
                      فصل تام للصلاحيات (RBAC)
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      واجهة مخصصة لكل دور: عون الأجور، رئيس المصلحة، مدير الجامعة، المحاسب، والمراقب المالي.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white mb-0.5">
                      سجل تدقيق غير قابل للحذف
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      تسجيل وتوثيق كامل لكل محاولة دخول وتعديل لضمان الشفافية والمساءلة القانونية.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Institutional Quote */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/10 text-[11px] text-slate-400 leading-relaxed">
              <p>
                الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التعليم العالي والبحث العلمي.
                منصة رقمية موحدة للجامعات الجزائرية.
              </p>
            </div>
          </div>

          {/* Left Column: Form & Demo Access (7 cols on lg) */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              {/* Form Title & Subtitle */}
              <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-uni-navy text-xs font-bold border border-blue-100 mb-3">
                  <Lock className="w-3.5 h-3.5" />
                  تسجيل الدخول إلى الحساب
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  مرحباً بك في منصة UNI-PAY
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  أدخل بيانات اعتمادك المهنية المعتمدة للوصول إلى مساحة العمل الخاصة بدورك الوظيفي.
                </p>
              </div>

              {/* Status / Alert Message */}
              {infoMessage && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-6 flex gap-3 items-start p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm leading-relaxed animate-fade-in"
                >
                  <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-0.5">تأكيد المعالجة:</p>
                    <p>{infoMessage}</p>
                  </div>
                </div>
              )}

              {/* Main Form */}
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {/* Email Field with clear RTL label, start icon, and intuitive placeholder */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>البريد الإلكتروني المهني</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      الحساب المؤسسي
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      required
                      disabled={isPending}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom.prenom@universite.dz"
                      aria-describedby={emailError ? "email-error" : undefined}
                      aria-invalid={emailError ? "true" : undefined}
                      className={cn(
                        "w-full h-12 px-4 rounded-xl border text-sm bg-slate-50/70 placeholder:text-slate-400 transition-all font-mono",
                        "focus:outline-none focus:ring-2 focus:ring-uni-navy/20 focus:border-uni-navy focus:bg-white",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        emailError
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    />
                  </div>

                  {emailError ? (
                    <p id="email-error" role="alert" className="text-xs text-red-600 mt-0.5">
                      {emailError}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      مثال: عون الأجور <code className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">paie@universite.dz</code>
                    </p>
                  )}
                </div>

                {/* Password Field with intuitive text placeholder (NOT confusing fake dots) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                    >
                      <Lock className="h-4 w-4 text-slate-400" />
                      <span>كلمة المرور</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowHelpModal(!showHelpModal)}
                      className="text-[11px] font-semibold text-uni-navy hover:text-blue-700 transition-colors focus-ring rounded"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      autoComplete="current-password"
                      required
                      disabled={isPending}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور السرية"
                      aria-describedby={passwordError ? "password-error" : undefined}
                      aria-invalid={passwordError ? "true" : undefined}
                      className={cn(
                        "w-full h-12 px-4 pe-12 rounded-xl border text-sm bg-slate-50/70 placeholder:text-slate-400 transition-all font-mono",
                        "focus:outline-none focus:ring-2 focus:ring-uni-navy/20 focus:border-uni-navy focus:bg-white",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        passwordError
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    />

                    {/* Eye toggle button at end-0 (left in RTL) */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isPending}
                      className="absolute inset-y-0 end-0 flex items-center px-4 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-uni-navy rounded-e-xl disabled:opacity-50 cursor-pointer"
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {passwordError && (
                    <p id="password-error" role="alert" className="text-xs text-red-600 mt-0.5">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2.5">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isPending}
                      className="h-4 w-4 rounded border-slate-300 text-uni-navy focus:ring-uni-navy cursor-pointer"
                    />
                    <label
                      htmlFor="remember-me"
                      className="text-xs sm:text-sm text-slate-600 cursor-pointer select-none"
                    >
                      تذكر بيانات الدخول على هذا الجهاز
                    </label>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={!isFormValid || isPending}
                  className={cn(
                    "w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm mt-2",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-uni-navy focus-visible:ring-offset-2",
                    isFormValid && !isPending
                      ? "bg-uni-navy text-white hover:bg-blue-900 active:scale-[0.99] shadow-blue-900/20 hover:shadow-lg"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  )}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>جارٍ التحقق من الهوية المؤسسية...</span>
                    </>
                  ) : (
                    <span>تسجيل الدخول إلى حسابك</span>
                  )}
                </button>
              </form>

              {/* Password Recovery Help Banner */}
              {showHelpModal && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed animate-fade-in flex items-start gap-2.5">
                  <HelpCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">استرجاع كلمة المرور المؤسسية:</p>
                    <p>
                      نظراً لسرية النظام المالي، يتم إعادة تعيين كلمات المرور حصرياً عبر المسؤول الإداري لجامعتك أو مصلحة الموارد البشرية. يرجى مراجعة إدارة شؤون المستخدمين.
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Demo Roles Matrix for Evaluation */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    <span>حسابات تجريبية سريعة للمعاينة:</span>
                  </p>
                  <span className="text-[10px] text-slate-400">انقر للتعبئة الفورية</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {demoRoles.map((role) => (
                    <button
                      key={role.email}
                      type="button"
                      onClick={() => handleQuickFill(role.email)}
                      className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-blue-50/70 hover:border-uni-navy/30 text-right transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-800 group-hover:text-uni-navy transition-colors truncate">
                          {role.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {role.email}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>اتصال مشفر ومطابق لمعايير الأمان الوطنية</span>
              </span>
              <span>دعم فني: support@universite.dz</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          منصة UNI-PAY المؤسسية — وزارة التعليم العالي والبحث العلمي © 2026. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
