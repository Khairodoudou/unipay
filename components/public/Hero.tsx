"use client";

import Link from "next/link";
import { ChevronLeft, ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden gradient-hero hero-pattern"
      aria-label="مقدمة UNI-PAY"
    >
      {/* Background decorative elements */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-[-5%] w-[400px] h-[400px] rounded-full bg-teal-500/8 blur-3xl" />
      </div>

      <div className="container-uni section-padding relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh] py-20">
          {/* Text content */}
          <div className="flex flex-col gap-6 text-white">
            {/* Badge */}
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white/90 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" aria-hidden="true" />
                منصة رقمية — الجيل الجديد لتسيير الأجور
              </span>
            </div>

            {/* Main heading */}
            <h1 className="animate-fade-in-up animate-delay-100 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
              منصة رقمية متكاملة لتسيير ومعالجة{" "}
              <span className="text-teal-300">أجور موظفي الجامعة</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up animate-delay-200 text-base sm:text-lg leading-relaxed text-white/80 max-w-xl">
              UNI-PAY توحّد إعداد الأجور، التدقيق، المصادقة، الرقابة والمتابعة
              في منصة واحدة آمنة وشفافة — مصممة خصيصاً للبيئة الجامعية.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-uni-navy font-semibold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] focus-ring"
              >
                <ChevronLeft className="h-4 w-4 icon-rtl" aria-hidden="true" />
                تسجيل الدخول
              </Link>
              <button
                onClick={() => {
                  document
                    .getElementById("about")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/30 text-white font-medium text-sm hover:bg-white/10 hover:border-white/50 transition-all focus-ring"
              >
                اكتشف المنصة
              </button>
            </div>

            {/* Quick stats */}
            <div className="animate-fade-in-up animate-delay-400 flex flex-wrap gap-6 pt-4 border-t border-white/15">
              {[
                { label: "رول وظيفي", value: "7" },
                { label: "مرحلة مصادقة", value: "5" },
                { label: "تدقيق ذكي", value: "آلي" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-xs text-white/60">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual — Workflow card representation */}
          <div className="hidden lg:flex justify-center items-center animate-fade-in animate-delay-200">
            <WorkflowVisual />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center pb-8">
          <button
            onClick={() =>
              document
                .getElementById("about")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="text-white/40 hover:text-white/70 transition-colors focus-ring rounded-full p-2"
            aria-label="انتقل للأسفل"
          >
            <ArrowDown className="h-5 w-5 animate-bounce" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function WorkflowVisual() {
  const steps = [
    { icon: "📋", label: "إعداد البيانات", status: "done", color: "bg-teal-500" },
    { icon: "🧮", label: "حساب الأجور", status: "done", color: "bg-teal-500" },
    { icon: "🔍", label: "التدقيق الذكي", status: "active", color: "bg-blue-400" },
    { icon: "✅", label: "المصادقة الإدارية", status: "pending", color: "bg-white/20" },
    { icon: "📊", label: "الرقابة المالية", status: "pending", color: "bg-white/20" },
    { icon: "💳", label: "متابعة الدفع", status: "pending", color: "bg-white/20" },
  ];

  return (
    <div className="relative w-full max-w-sm">
      {/* Main card */}
      <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-6 shadow-2xl">
        {/* Card header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/60 text-xs">دورة الأجور</p>
            <p className="text-white font-semibold text-sm mt-0.5">
              سبتمبر 2026 — الإصدار الأول
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-400/20 text-blue-300 text-xs font-medium border border-blue-400/30">
            قيد المعالجة
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-white/60 mb-1.5">
            <span>التقدم</span>
            <span>%40</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all"
              style={{ width: "40%" }}
              role="progressbar"
              aria-valuenow={40}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Workflow steps */}
        <div className="flex flex-col gap-2.5">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                step.status === "active"
                  ? "bg-blue-500/15 border border-blue-400/30"
                  : step.status === "done"
                  ? "bg-teal-500/10"
                  : "opacity-50"
              }`}
            >
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-md ${step.color} flex items-center justify-center text-xs`}
              >
                {step.status === "done" ? (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-white text-[10px] font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  step.status === "pending" ? "text-white/50" : "text-white"
                }`}
              >
                {step.label}
              </span>
              {step.status === "active" && (
                <span className="mr-auto flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-white/50 text-xs">342 موظف</span>
          <span className="text-white/50 text-xs">بانتظار التدقيق</span>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-4 -left-4 bg-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
        التدقيق الذكي نشط
      </div>
    </div>
  );
}
