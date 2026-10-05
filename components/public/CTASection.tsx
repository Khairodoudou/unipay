import Link from "next/link";
import { ChevronLeft, ShieldCheck, LockKeyhole } from "lucide-react";

export default function CTASection() {
  return (
    <section
      className="relative py-20 lg:py-24 overflow-hidden bg-[#0b1528] text-white"
      aria-label="ابدأ باستخدام UNI-PAY"
      style={{ backgroundColor: "#0b1528" }}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-blue-600/15 blur-[120px]" />
      </div>

      <div className="container-uni px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-teal-300 backdrop-blur-md mb-6">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            <span>نظام إداري داخلي ومحمي</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-5">
            الوصول إلى المنصة المؤسسية UNI-PAY
          </h2>

          {/* Description */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto">
            منصة UNI-PAY مخصصة للمؤسسات الجامعية والهياكل الإدارية والمالية المعتمدة.
            الولوج إلى المنصة يتم حصرياً عبر البريد الإلكتروني المهني والحسابات المفعلة من طرف إدارة الجامعة.
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 hover:shadow-xl hover:shadow-white/10 active:scale-[0.98] transition-all focus-ring"
            >
              <ChevronLeft className="h-4 w-4 icon-rtl" aria-hidden="true" />
              <span>تسجيل الدخول إلى حسابك</span>
            </Link>
          </div>

          {/* Institutional note */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>مصادقة أمنية متعددة المستويات</span>
            </span>
            <span>•</span>
            <span>للحصول على حساب أو الدعم الفني، يرجى الاتصال بالأمانة العامة للجامعة</span>
          </div>
        </div>
      </div>
    </section>
  );
}
