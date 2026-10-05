"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[UNI-PAY] Global error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center">
          {/* Logo */}
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a6e] text-white font-bold text-sm">
              U
            </div>
            <span className="text-lg font-bold text-[#1e3a6e]">UNI-PAY</span>
          </div>

          {/* Error visual */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
          </div>

          <h1
            className="text-xl font-bold mb-3"
            style={{ color: "#1e3a6e" }}
          >
            حدث خطأ غير متوقع
          </h1>
          <p className="text-[#64748b] text-base leading-relaxed mb-8">
            واجه التطبيق خطأً غير متوقع. يمكنك المحاولة مجدداً أو التواصل مع
            المسؤول الإداري إذا استمرت المشكلة.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => retry()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e3a6e] text-white text-sm font-semibold hover:bg-[#152b52] transition-colors"
            >
              المحاولة مجدداً
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] text-sm font-medium hover:border-[#cbd5e1] hover:text-[#374151] transition-colors"
            >
              الصفحة الرئيسية
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
