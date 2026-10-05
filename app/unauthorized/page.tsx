import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "غير مصرح بالوصول — UNI-PAY",
  description: "ليس لديك الصلاحية للوصول إلى هذه الصفحة.",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-uni-bg flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-red-500/4 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-uni-navy/4 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-10 focus-ring rounded-md"
          aria-label="UNI-PAY — الصفحة الرئيسية"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-uni-navy text-white font-bold text-sm">
            U
          </div>
          <span className="text-lg font-bold text-uni-navy">UNI-PAY</span>
        </Link>

        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <svg
              className="h-9 w-9 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-7V4m0 0a2 2 0 100-4 2 2 0 000 4zm0 0v4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error content */}
        <h1 className="text-2xl font-bold text-uni-navy mb-3">
          غير مصرح بالوصول
        </h1>
        <p className="text-slate-500 text-base leading-relaxed mb-8">
          ليس لديك الصلاحية للوصول إلى هذه الصفحة.
          إذا كنت تعتقد أن هذا خطأ، تواصل مع المسؤول الإداري.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-uni-navy text-white text-sm font-semibold hover:bg-uni-navy-dark transition-all focus-ring shadow-sm"
          >
            العودة إلى صفحة الدخول
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border text-slate-600 text-sm font-medium hover:border-slate-300 hover:text-slate-800 transition-all focus-ring"
          >
            الصفحة الرئيسية
          </Link>
        </div>

        {/* Note */}
        <p className="mt-8 text-xs text-slate-400">
          لا تحتوي هذه الصفحة على معلومات حول سبب رفض الوصول لأسباب أمنية.
        </p>
      </div>
    </div>
  );
}
