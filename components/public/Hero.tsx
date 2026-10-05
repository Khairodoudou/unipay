"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ArrowDown, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden gradient-hero bg-[#0b1528] pt-20 pb-16 lg:py-24"
      aria-label="مقدمة UNI-PAY"
      style={{ backgroundColor: "#0b1528" }}
    >
      {/* Background dot matrix overlay */}
      <div
        className="absolute inset-0 hero-pattern opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Ambient background glows */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] rounded-full bg-blue-500/15 blur-[130px]" />
        <div className="absolute bottom-10 -left-20 w-[550px] h-[550px] rounded-full bg-teal-400/15 blur-[130px]" />
      </div>

      <div className="container-uni relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center min-h-[75vh]">
          {/* Text content — 6 cols on lg */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-white text-right">
            {/* Institutional Badge */}
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/90 backdrop-blur-md shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>وزارة التعليم العالي والبحث العلمي</span>
                <span className="text-white/40">|</span>
                <span className="text-teal-300">المنصة الموحدة لتسيير الأجور</span>
              </span>
            </div>

            {/* Main heading */}
            <h1 className="animate-fade-in-up animate-delay-100 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.25] tracking-tight text-white">
              منصة رقمية موحدة وشاملة{" "}
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-l from-teal-300 via-sky-300 to-white">
                لتسيير ومعالجة أجور موظفي الجامعة
              </span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up animate-delay-200 text-base sm:text-lg leading-relaxed text-slate-300 max-w-2xl font-normal">
              توحّد <strong className="text-white font-semibold">UNI-PAY</strong> كامل دورة إعداد الأجور:
              من استيراد البيانات والاحتساب التلقائي، إلى التدقيق الذكي للشذوذ،
              والمصادقة الإدارية، وصولاً إلى تأشيرة الرقابة المالية وإتاحة كشوف الرواتب — في بيئة مؤسسية آمنة وشفافة.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up animate-delay-300 flex flex-wrap gap-3.5 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 hover:shadow-xl hover:shadow-white/10 transition-all active:scale-[0.98] focus-ring"
              >
                <ChevronLeft className="h-4 w-4 icon-rtl" aria-hidden="true" />
                <span>تسجيل الدخول إلى المنصة</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("workflow")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/25 bg-white/5 text-white font-medium text-sm hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all focus-ring"
              >
                <span>استعراض دورة العمل</span>
              </button>
            </div>

            {/* Key Highlights Metrics */}
            <div className="animate-fade-in-up animate-delay-400 grid grid-cols-3 gap-4 pt-6 mt-2 border-t border-white/15 max-w-xl">
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">7 أدوار</span>
                <span className="text-xs text-slate-300 font-normal">فصل كامل للمسؤوليات (RBAC)</span>
              </div>
              <div className="flex flex-col gap-0.5 border-r border-white/15 pe-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-teal-300">5 مراحل</span>
                <span className="text-xs text-slate-300 font-normal">مصادقة ورقابة قبل الدفع</span>
              </div>
              <div className="flex flex-col gap-0.5 border-r border-white/15 pe-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-sky-300">آلي 100%</span>
                <span className="text-xs text-slate-300 font-normal">تدقيق ذكي وكشف التناقضات</span>
              </div>
            </div>
          </div>

          {/* Real Professional Dashboard Showcase — 6 cols on lg */}
          <div className="lg:col-span-6 flex justify-center items-center animate-fade-in animate-delay-200">
            <DashboardShowcase />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center pt-8">
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("about")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors focus-ring rounded-full py-1.5 px-3 border border-white/10 bg-white/5 backdrop-blur-sm"
            aria-label="انتقل إلى التفاصيل"
          >
            <span>اكتشف المزيد</span>
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function DashboardShowcase() {
  return (
    <div className="relative w-full max-w-lg group">
      {/* Floating Status Badge Top */}
      <div className="absolute -top-3.5 start-4 z-20 inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xl border border-teal-300/30">
        <Sparkles className="h-3.5 w-3.5 text-teal-100" aria-hidden="true" />
        <span>لوحة التحكم الحقيقية — معتمدة ومطابقة</span>
      </div>

      {/* Main Image Frame */}
      <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/20 via-white/10 to-white/5 border border-white/20 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        {/* Browser / Monitor window header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#0c1a32]/90 rounded-t-xl border-b border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-[11px] text-slate-300 font-mono ms-2">
              UNI-PAY Platform
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-teal-300 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>المنصة الرقمية الموحدة</span>
          </span>
        </div>

        {/* Dashboard Image */}
        <div className="relative overflow-hidden rounded-b-xl bg-slate-950">
          <Image
            src="/images/dashboard-preview.jpg"
            alt="واجهة لوحة القيادة لمنصة UNI-PAY لتسيير أجور موظفي الجامعة"
            width={1024}
            height={768}
            priority
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>

        {/* Floating Bottom Pill */}
        <div className="absolute -bottom-3 end-4 z-20 inline-flex items-center gap-2 bg-[#0b1528]/95 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-xl border border-white/20">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>342 موظف وأستاذ · تدقيق آلي معتمد</span>
        </div>
      </div>
    </div>
  );
}
