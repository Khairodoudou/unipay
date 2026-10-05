const workflowSteps = [
  {
    step: "01",
    title: "إعداد البيانات",
    description: "يقوم عون الأجور بإدخال أو استيراد بيانات الموظفين والغيابات والتعويضات.",
  },
  {
    step: "02",
    title: "حساب الأجور",
    description: "يتم حساب الراتب الإجمالي والصافي بناءً على قواعد الأجور المعرّفة في المنصة.",
  },
  {
    step: "03",
    title: "التدقيق الذكي",
    description: "يكتشف النظام تلقائياً الأخطاء والتناقضات والقيم غير الاعتيادية للمراجعة.",
  },
  {
    step: "04",
    title: "المصادقة الإدارية",
    description: "يراجع رئيس المصلحة ثم مدير الجامعة الملف ويصادقان على صحة البيانات.",
  },
  {
    step: "05",
    title: "المراجعة المحاسبية",
    description: "يتحقق المحاسب من صحة الكتابات المحاسبية والمبالغ قبل الانتقال للرقابة.",
  },
  {
    step: "06",
    title: "الرقابة المالية",
    description: "يُجري المراقب المالي عملية المراقبة النهائية ويُصادق بالتأشير على الملف.",
  },
  {
    step: "07",
    title: "المتابعة والدفع",
    description: "يتم متابعة الدفع والتحقق منه، ثم تُتاح كشوف الأجور للموظفين.",
  },
];

export default function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="bg-white section-padding"
      aria-label="كيف تعمل UNI-PAY"
    >
      <div className="container-uni">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-uni-teal text-xs font-semibold border border-teal-100 mb-4">
            سير العمل
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-uni-navy mb-4">
            كيف تعمل UNI-PAY؟
          </h2>
          <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
            دورة معالجة الأجور منظّمة في مراحل واضحة وخاضعة للرقابة في كل خطوة،
            مع إمكانية التصحيح والإعادة عند الضرورة.
          </p>
        </div>

        {/* Desktop: horizontal stepper */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute top-6 right-[calc(3.5rem/2)] left-[calc(3.5rem/2)] h-0.5 bg-border"
              aria-hidden="true"
            />

            <div className="grid grid-cols-7 gap-2">
              {workflowSteps.map((step, index) => (
                <div key={step.step} className="flex flex-col items-center text-center gap-3">
                  {/* Step circle */}
                  <div
                    className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                      index < 3
                        ? "bg-uni-navy border-uni-navy text-white"
                        : "bg-white border-border text-slate-400"
                    }`}
                  >
                    {index < 3 ? (
                      <svg
                        className="h-5 w-5"
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
                      <span>{step.step}</span>
                    )}
                  </div>
                  {/* Content */}
                  <div>
                    <p className="text-xs font-semibold text-uni-navy leading-tight">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile / Tablet: vertical list */}
        <div className="lg:hidden flex flex-col gap-0">
          {workflowSteps.map((step, index) => (
            <div key={step.step} className="flex gap-4">
              {/* Left: step + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    index < 3
                      ? "bg-uni-navy border-uni-navy text-white"
                      : "bg-white border-border text-slate-400"
                  }`}
                >
                  {index < 3 ? (
                    <svg
                      className="h-4 w-4"
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
                    <span className="text-xs">{step.step}</span>
                  )}
                </div>
                {index < workflowSteps.length - 1 && (
                  <div
                    className={`flex-1 w-0.5 my-1 min-h-[2rem] ${
                      index < 2 ? "bg-uni-navy" : "bg-border"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1">
                <h3 className="text-sm font-semibold text-uni-navy mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-sm">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            يمكن إعادة الملف في أي مرحلة لتصحيحه مع تسجيل كامل للسبب والإصدار.
          </div>
        </div>
      </div>
    </section>
  );
}
