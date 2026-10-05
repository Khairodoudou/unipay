"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emailError =
    email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "الرجاء إدخال بريد إلكتروني صحيح"
      : null;

  const passwordError =
    password.length > 0 && password.length < 6
      ? "كلمة المرور قصيرة جداً"
      : null;

  const isFormValid =
    email.length > 0 && password.length >= 6 && !emailError;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    startTransition(async () => {
      // Auth will be implemented in Phase 2
      await new Promise((r) => setTimeout(r, 1500));
      setError("المصادقة ليست مفعّلة بعد في هذه المرحلة.");
    });
  }

  return (
    <div className="min-h-screen bg-uni-bg flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-uni-navy/4 blur-3xl translate-x-1/2 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-uni-blue/4 blur-3xl -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-uni-navy transition-colors mb-8 focus-ring rounded group"
        >
          الرئيسية
          <ChevronLeft
            className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform"
            aria-hidden="true"
          />
        </Link>

        {/* Login card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-uni-navy text-white font-bold text-xl mb-4 shadow-md select-none">
              U
            </div>
            <h1 className="text-xl font-bold text-uni-navy">تسجيل الدخول</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              الوصول إلى منصة UNI-PAY
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 flex gap-3 items-start p-3.5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm animate-fade-in"
            >
              <svg
                className="h-4 w-4 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@universite.dz"
                aria-describedby={emailError ? "email-error" : undefined}
                aria-invalid={emailError ? "true" : undefined}
                className={cn(
                  "w-full h-10 px-3.5 rounded-lg border text-sm bg-white placeholder:text-slate-400 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  emailError
                    ? "border-red-300 focus:ring-red-300"
                    : "border-border hover:border-slate-300"
                )}
              />
              {emailError && (
                <p id="email-error" role="alert" className="text-xs text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-describedby={passwordError ? "password-error" : undefined}
                  aria-invalid={passwordError ? "true" : undefined}
                  className={cn(
                    "w-full h-10 px-3.5 rounded-lg border text-sm bg-white placeholder:text-slate-400 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "pe-10",
                    passwordError
                      ? "border-red-300 focus:ring-red-300"
                      : "border-border hover:border-slate-300"
                  )}
                />
                {/* Show/hide password — positioned at logical start (right in RTL) */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  className="absolute inset-y-0 start-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-s-lg disabled:opacity-50"
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
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs text-red-600"
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-slate-300 text-uni-navy focus:ring-ring disabled:opacity-50 cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-slate-600 cursor-pointer select-none"
              >
                تذكرني
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className={cn(
                "w-full h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isFormValid && !isPending
                  ? "bg-uni-navy text-white hover:bg-uni-navy-dark active:scale-[0.99] shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isPending ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>جارٍ التحقق...</span>
                </>
              ) : (
                <>
                  <ChevronLeft
                    className="h-4 w-4 icon-rtl"
                    aria-hidden="true"
                  />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
            للحصول على حساب أو في حال واجهت مشكلة في الدخول،
            <br />
            تواصل مع المسؤول الإداري للمنصة.
          </p>
        </div>

        {/* Copyright */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 UNI-PAY — للاستخدام المؤسسي فقط
        </p>
      </div>
    </div>
  );
}
