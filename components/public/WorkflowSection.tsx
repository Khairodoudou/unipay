import {
  FileUp,
  Calculator,
  SearchCode,
  UserCheck,
  BookOpenCheck,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

const workflowSteps = [
  {
    step: "01",
    icon: FileUp,
    title: "إعداد واستيراد البيانات",
    actor: "عون الموارد البشرية والأجور",
    description: "إدخال بيانات الموظفين، الغيابات، المنح، المتغيرات الشهرية والشهادات الطبية في النظام.",
    tag: "مرحلة التحضير",
    color: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    step: "02",
    icon: Calculator,
    title: "حساب الأجور والمنح",
    actor: "المحرك الآلي للنظام",
    description: "حساب آلي دقيق للرواتب الأساسية، المنح، التعويضات والاقتطاعات القانونية والضريبية وفق القوانين.",
    tag: "معالجة آلية",
    color: "from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    step: "03",
    icon: SearchCode,
    title: "التدقيق الذكي للشذوذ",
    actor: "نظام التدقيق الآلي",
    description: "فحص فوري لاكتشاف التناقضات، الأخطاء الحسابية، أيام الغياب غير المبررة والازدواجيات قبل الإرسال.",
    tag: "تدقيق ذكي",
    color: "from-teal-500 to-teal-600 text-teal-600 bg-teal-50 border-teal-200",
  },
  {
    step: "04",
    icon: UserCheck,
    title: "المصادقة الإدارية",
    actor: "رئيس المصلحة & مدير الجامعة",
    description: "مراجعة الجداول والتقارير الإجمالية، والمصادقة على صحة القوائم إدارياً وتمريرها للمحاسبة.",
    tag: "مستوى إداري",
    color: "from-purple-500 to-purple-600 text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    step: "05",
    icon: BookOpenCheck,
    title: "المراجعة المحاسبية",
    actor: "المحاسب المعتمد",
    description: "التأكد من صحة الحسابات الإجمالية، المبالغ المستحقة للاقتطاعات، ومطابقة القيود المحاسبية.",
    tag: "مستوى محاسبي",
    color: "from-sky-500 to-sky-600 text-sky-600 bg-sky-50 border-sky-200",
  },
  {
    step: "06",
    icon: ShieldCheck,
    title: "تأشيرة الرقابة المالية",
    actor: "المراقب المالي المعتمد",
    description: "المراقبة القبلية القانونية على النفقات والتأشير النهائي على قوائم الرواتب قبل الإذن بالدفع.",
    tag: "رقابة مالية قبلية",
    color: "from-amber-500 to-amber-600 text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    step: "07",
    icon: CreditCard,
    title: "التنفيذ وإتاحة الكشوف",
    actor: "مصالح الدفع & الموظف",
    description: "تنفيذ أوامر التحويل البنكي والبريدي، وإتاحة كشوف الأجور الرقمية المعتمدة لجميع الموظفين.",
    tag: "صرف وتوزيع",
    color: "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50 border-emerald-200",
  },
];

export default function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="bg-white py-20 lg:py-28 relative overflow-hidden"
      aria-label="كيف تعمل UNI-PAY"
    >
      <div className="container-uni px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200/70 mb-4">
            <RotateCcw className="w-3.5 h-3.5" />
            مسار العمل المتكامل
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
            دورة معالجة الأجور خطوة بخطوة
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            مسار عمل صارم من 7 مراحل متتابعة يضمن سلامة البيانات، الامتثال للقوانين، والفصل التام بين الصلاحيات مع إمكانية الرد والتصحيح.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative bg-slate-50/70 hover:bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-uni-navy/40 card-shadow card-shadow-hover flex flex-col justify-between"
              >
                <div>
                  {/* Step Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border bg-white text-slate-700 border-slate-200 shadow-2xs">
                      {step.tag}
                    </span>
                    <span className="text-lg font-mono font-extrabold text-slate-400">
                      {step.step}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${step.color}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      {step.title}
                    </h3>
                  </div>

                  {/* Actor Badge */}
                  <div className="mb-3 text-[11px] font-semibold text-uni-navy bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-100 inline-block">
                    👤 {step.actor}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Step Footer with sequence cue */}
                <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>المرحلة {index + 1} من 7</span>
                  {index < workflowSteps.length - 1 ? (
                    <span className="text-uni-navy font-medium flex items-center gap-1">
                      <span>التالي</span>
                      <ArrowLeft className="h-3 w-3 icon-rtl" />
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>النهاية</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Rejection / Correction Cycle Card (Feature 8 in the grid) */}
          <div className="relative bg-gradient-to-br from-amber-50 to-orange-50/80 rounded-2xl p-6 border border-amber-200/90 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  مرونة الحوكمة
                </span>
                <RotateCcw className="h-5 w-5 text-amber-600" />
              </div>

              <h3 className="text-base font-bold text-amber-950 mb-2">
                إمكانية الرد والتصحيح (Rejet & Correction)
              </h3>
              
              <p className="text-xs text-amber-900/80 leading-relaxed mb-4">
                يحق لأي مسؤول في مراحل المصادقة الإدارية أو المحاسبية أو الرقابة المالية إعادة الملف إلى عون الأجور مع تدوين أسباب وملاحظات الرفض بدقة، لتصحيحه وإعادة إرساله دون فقدان السجل التاريخي.
              </p>
            </div>

            <div className="pt-3 border-t border-amber-200/70 text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
              <span>✓ ضمان عدم مرور أي خطأ مالي أو إداري</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
