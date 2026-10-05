import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة — UNI-PAY",
  description: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-uni-bg flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-uni-navy/4 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-uni-blue/4 blur-3xl" />
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

        {/* 404 visual */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-slate-100 mb-2 select-none" aria-hidden="true">
            404
          </div>
          <div className="w-16 h-1 bg-uni-navy rounded-full mx-auto" aria-hidden="true" />
        </div>

        {/* Error content */}
        <h1 className="text-2xl font-bold text-uni-navy mb-3">
          الصفحة غير موجودة
        </h1>
        <p className="text-slate-500 text-base leading-relaxed mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          تأكد من صحة الرابط أو ارجع إلى الصفحة الرئيسية.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-uni-navy text-white text-sm font-semibold hover:bg-uni-navy-dark transition-all focus-ring shadow-sm"
          >
            العودة إلى الرئيسية
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border text-slate-600 text-sm font-medium hover:border-slate-300 hover:text-slate-800 transition-all focus-ring"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
