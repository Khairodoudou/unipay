"use client";

import Link from "next/link";
import { ChevronLeft, ArrowDown, ShieldCheck, Cpu, CheckCircle2, Clock, Sparkles } from "lucide-react";

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
        <div className="absolute top-1/4 -right-20 w-[550px] h-[550px] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="absolute bottom-10 -left-20 w-[500px] h-[500px] rounded-full bg-teal-400/15 blur-[120px]" />
      </div>

      <div className="container-uni relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[75vh]">
          {/* Text content — 7 cols on lg */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-white text-right">
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

          {/* Visual card — 5 cols on lg */}
          <div className="lg:col-span-5 flex justify-center items-center animate-fade-in animate-delay-200">
            <WorkflowVisual />
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

function WorkflowVisual() {
  const steps = [
    {
      id: "01",
      label: "إعداد واستيراد البيانات",
      status: "done",
      actor: "عون الأجور",
    },
    {
      id: "02",
      label: "حساب الرواتب والمنح",
      status: "done",
      actor: "النظام الآلي",
    },
    {
      id: "03",
      label: "التدقيق الذكي للشذوذ",
      status: "active",
      actor: "محرك القواعد الذكي",
    },
    {
      id: "04",
      label: "المصادقة الإدارية",
      status: "pending",
      actor: "رئيس المصلحة / المدير",
    },
    {
      id: "05",
      label: "المراجعة المحاسبية",
      status: "pending",
      actor: "المحاسب المعتمد",
    },
    {
      id: "06",
      label: "تأشيرة الرقابة المالية",
      status: "pending",
      actor: "المراقب المالي",
    },
  ];

  return (
    <div className="relative w-full max-w-md">
      {/* Floating Status Pill */}
      <div className="absolute -top-3.5 start-6 z-20 inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg border border-teal-300/30">
        <Sparkles className="h-3.5 w-3.5 text-teal-100" aria-hidden="true" />
        <span>التدقيق الذكي نشط — 0 تناقضات حرجة</span>
      </div>

      {/* Main card */}
      <div className="rounded-2xl bg-[#0f1f3d]/90 border border-white/15 backdrop-blur-xl p-5 sm:p-6 shadow-2xl ring-1 ring-white/10">
        {/* Card header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <p className="text-white font-bold text-sm">
                دورة أجور شهر سبتمبر 2026
              </p>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              جامعة الجزائر 1 — كلية العلوم
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
            المرحلة 3 من 6
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-300 font-medium">التقدم الإجمالي</span>
            <span className="text-teal-300 font-bold">%55</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-sky-400 rounded-full transition-all duration-500"
              style={{ width: "55%" }}
              role="progressbar"
              aria-valuenow={55}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>342 ملف موظف</span>
            <span className="text-emerald-400 font-medium">جاهز للمصادقة</span>
          </div>
        </div>

        {/* Workflow steps */}
        <div className="flex flex-col gap-2">
          {steps.map((step) => {
            const isDone = step.status === "done";
            const isActive = step.status === "active";

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-sky-500/20 border border-sky-400/40 text-white shadow-inner"
                    : isDone
                    ? "bg-teal-500/10 border border-teal-500/20 text-slate-200"
                    : "bg-white/[0.02] border border-white/5 text-slate-400 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? "bg-teal-500 text-white"
                        : isActive
                        ? "bg-sky-500 text-white"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    ) : isActive ? (
                      <Clock className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <span className="text-[10px]">{step.id}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {step.actor}
                    </p>
                  </div>
                </div>

                <div>
                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-400/30 text-sky-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-300 animate-ping" />
                      قيد التنفيذ
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] text-teal-400 font-medium">
                      مكتمل
                    </span>
                  )}
                  {step.status === "pending" && (
                    <span className="text-[10px] text-slate-500">
                      في الانتظار
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>نظام رقابة مشدد</span>
          </span>
          <span className="text-slate-400 text-[11px]">
            آخر تحديث: منذ 3 دقائق
          </span>
        </div>
      </div>
    </div>
  );
}
