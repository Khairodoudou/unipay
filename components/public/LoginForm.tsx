"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Demo roles for preview & UI testing
const demoRoles = [
  { label: "عون الأجور", email: "paie@universite.dz", role: "RH / Paie" },
  { label: "رئيس المصلحة", email: "chef.service@universite.dz", role: "Chef" },
  { label: "مدير الجامعة", email: "directeur@universite.dz", role: "Directeur" },
  { label: "المراقب المالي", email: "cf@universite.dz", role: "Contrôleur" },
  { label: "الموظف", email: "employe@universite.dz", role: "Employé" },
];

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emailError =
    email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "الرجاء إدخال بريد إلكتروني صالح (مثال: nom@universite.dz)"
      : null;

  const passwordError =
    password.length > 0 && password.length < 6
      ? "كلمة المرور يجب أن لا تقل عن 6 أحرف"
      : null;

  const isFormValid = email.length > 0 && password.length >= 6 && !emailError;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;

    setInfoMessage(null);
    startTransition(async () => {
      // Simulated check for Phase 1 public experience
      await new Promise((r) => setTimeout(r, 1000));
      setInfoMessage(
        "نظام المصادقة وقواعد البيانات سيتم تفعيلهما في المرحلة 2 (Phase 2). واجهة الدخول جاهزة ومطابقة للمواصفات."
      );
    });
  }

  function handleQuickFill(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password2026");
    setInfoMessage(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient accents */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 my-8">
        {/* Back to Home Link (Directional in RTL) */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-uni-navy transition-colors mb-6 focus-ring rounded-lg px-2.5 py-1.5 bg-white border border-slate-200/80 shadow-2xs group"
        >
          <ArrowRight
            className="h-4 w-4 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-uni-navy"
            aria-hidden="true"
          />
          <span>العودة إلى الصفحة الرئيسية</span>
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-uni-navy to-blue-700 text-white font-extrabold text-2xl mb-4 shadow-md shadow-blue-900/15">
              U
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              تسجيل الدخول إلى UNI-PAY
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              فضاء الولوج المؤسسي لموظفي وإطارات الجامعة
            </p>
          </div>

          {/* Alert Message */}
          {infoMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 flex gap-3 items-start p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm leading-relaxed animate-fade-in"
            >
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs sm:text-sm font-bold text-slate-700"
              >
                البريد الإلكتروني المهني
              </label>
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
                placeholder="prenom.nom@universite.dz"
                aria-describedby={emailError ? "email-error" : undefined}
                aria-invalid={emailError ? "true" : undefined}
                className={cn(
                  "w-full h-11 px-3.5 rounded-xl border text-sm bg-slate-50/50 placeholder:text-slate-400 transition-colors text-left font-mono",
                  "focus:outline-none focus:ring-2 focus:ring-uni-navy/30 focus:border-uni-navy focus:bg-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  emailError
                    ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                    : "border-slate-200 hover:border-slate-300"
                )}
              />
              {emailError && (
                <p id="email-error" role="alert" className="text-xs text-red-600 mt-1">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field with RTL-corrected eye toggle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs sm:text-sm font-bold text-slate-700"
                >
                  كلمة المرور
                </label>
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
                  placeholder="••••••••••••"
                  aria-describedby={passwordError ? "password-error" : undefined}
                  aria-invalid={passwordError ? "true" : undefined}
                  className={cn(
                    "w-full h-11 px-3.5 pe-11 rounded-xl border text-sm bg-slate-50/50 placeholder:text-slate-400 transition-colors text-left font-mono",
                    "focus:outline-none focus:ring-2 focus:ring-uni-navy/30 focus:border-uni-navy focus:bg-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    passwordError
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                />
                {/* Show/Hide button correctly positioned at end-0 (left in RTL) */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  className="absolute inset-y-0 end-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-uni-navy rounded-e-xl disabled:opacity-50 cursor-pointer"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" role="alert" className="text-xs text-red-600 mt-1">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
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
                تذكر بيانات تسجيل الدخول على هذا الجهاز
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className={cn(
                "w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-uni-navy focus-visible:ring-offset-2",
                isFormValid && !isPending
                  ? "bg-uni-navy text-white hover:bg-blue-900 active:scale-[0.99] shadow-blue-900/20 hover:shadow-md"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>جارٍ التحقق من الهوية...</span>
                </>
              ) : (
                <span>تسجيل الدخول إلى الحساب</span>
              )}
            </button>
          </form>

          {/* Demo Quick-Fill Helper for Reviewers / Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2.5 text-center">
              تجربة سريعة — حسابات تجريبية للأدوار:
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {demoRoles.map((role) => (
                <button
                  key={role.email}
                  type="button"
                  onClick={() => handleQuickFill(role.email)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-uni-navy transition-colors border border-slate-200/80 cursor-pointer"
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs text-center">
            <Shield className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>الولوج محمي ومشفر وفق المعايير المؤسسية</span>
          </div>
        </div>

        {/* Institutional copyright */}
        <p className="mt-6 text-center text-xs text-slate-400">
          منصة UNI-PAY — وزارة التعليم العالي والبحث العلمي © 2026
        </p>
      </div>
    </div>
  );
}
