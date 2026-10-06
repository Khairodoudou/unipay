import { CheckCircle2, ShieldCheck, Cpu, Layers } from "lucide-react";

export default function AboutSection() {
  const highlights = [
    {
      value: "7",
      label: "أدوار وظيفية متخصصة",
      desc: "فصل تام بين مهام الإعداد، المصادقة والرقابة",
      color: "from-blue-600 to-indigo-600",
    },
    {
      value: "5+",
      label: "مراحل تدقيق ومصادقة",
      desc: "سلسلة رقابية متدرجة تضمن صحة كل دينار",
      color: "from-teal-600 to-emerald-600",
    },
    {
      value: "100%",
      label: "تدقيق ذكي آلي",
      desc: "اكتشاف التناقضات والغيابات غير المبررة فوراً",
      color: "from-sky-600 to-blue-700",
    },
    {
      value: "دائم",
      label: "سجل تتبع ومساءلة (Audit)",
      desc: "أرشفة وتوثيق غير قابل للتعديل لكل عملية",
      color: "from-purple-600 to-indigo-700",
    },
  ];

  const pillars = [
    {
      icon: Cpu,
      title: "أتمتة الحسابات والتسوية",
      description: "حساب دقيق للأجور الأساسية، المنح، التعويضات والاقتطاعات القانونية والضريبية بشكل آلي موحد.",
    },
    {
      icon: ShieldCheck,
      title: "رقابة مالية وقانونية صارمة",
      description: "امتثال كامل للأنظمة المطبقة في قطاع التعليم العالي والوظيف العمومي، وتأشيرة قبل الإذن بالدفع.",
    },
    {
      icon: Layers,
      title: "منظومة واحدة لكل المتدخلين",
      description: "من عون الأجور إلى مدير الجامعة والمراقب المالي، وصولاً إلى فضاء الموظف للاطلاع على كشوفه.",
    },
  ];

  return (
    <section
      id="about"
      className="bg-white py-20 lg:py-28 relative overflow-hidden"
      aria-label="ما هي UNI-PAY"
    >
      <div className="container-uni px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-uni-navy text-xs font-bold border border-blue-100 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-uni-navy" />
            نبذة عن المنصة
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
            ما هي منصة <span className="text-uni-navy">UNI-PAY</span>؟
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            نظام معلوماتي مؤسسي متطور، صُمم خصيصاً لتنظيم ورقمنة دورة معالجة أجور موظفي المؤسسات الجامعية
            وفق المعايير الإدارية والمالية الحديثة.
          </p>
        </div>

        {/* 2-Column Main Content */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text & Pillars — 6 cols */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              ليست مجرد برنامج رواتب، بل حوكمة مالية وإدارية شاملة
            </h3>
            
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              تعمل <strong className="text-uni-navy font-semibold">UNI-PAY</strong> على القضاء التام على الملفات المشتتة والأخطاء البشرية الحسابية عبر مسار عمل رقمي موحد، يربط مصالح الموارد البشرية، الأمانة العامة، عمادة الكليات، إدارة المالية والرقابة المالية في منصة مركزية واحدة.
            </p>

            <div className="flex flex-col gap-4 pt-2">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-uni-navy text-white flex items-center justify-center shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">
                        {pillar.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Highlights Metrics Grid — 6 cols */}
          <div className="lg:col-span-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 hover:border-uni-navy/30 card-shadow hover:shadow-lg transition-all"
                >
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-uni-navy tracking-tight">
                      {item.value}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                    {item.label}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="absolute top-4 end-4 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-uni-navy transition-colors" />
                </div>
              ))}
            </div>

            {/* University context note */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-uni-navy flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed">
                مهيأة للتوافق مع الهيكل التنظيمي للمؤسسات الجامعية الجزائرية والأسلاك المشتركة، الأساتذة الباحثين، وموظفي المصالح الإدارية والتقنية.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
