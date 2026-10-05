import {
  FileText,
  SearchCheck,
  GitMerge,
  ShieldAlert,
  History,
  FileSpreadsheet,
  Check,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    badge: "تسيير الملفات",
    title: "إدارة دورات الأجور والرواتب",
    description:
      "إعداد وحساب دفعات الأجور الشهرية، استيراد معطيات الموظفين، وضبط المتغيرات من غيابات ومنح واقتطاعات بدقة فائقة.",
    benefits: [
      "دعم الدفعات الشهرية والتكميلية",
      "حساب آلي للاقتطاعات الضريبية والضمان الاجتماعي",
      "أرشفة إلكترونية منظمة لكل شهر وسنة",
    ],
    accent: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    icon: SearchCheck,
    badge: "ذكاء التدقيق",
    title: "التدقيق الذكي والشذوذات",
    description:
      "محرك آلي قائم على القواعد يكتشف تلقائياً البيانات الناقصة، التناقضات الحسابية، والازدواجية قبل إرسال الملف للمصادقة.",
    benefits: [
      "رصد التناقضات بين الرتب والمنح المعمول بها",
      "تنبيه فوري لأيام الغياب غير المسوية",
      "تقارير شذوذ تفصيلية لتسريع المعالجة",
    ],
    accent: "text-teal-600 bg-teal-50 border-teal-100",
  },
  {
    icon: GitMerge,
    badge: "حوكمة المراحل",
    title: "سير عمل رقمي صارم (Workflow)",
    description:
      "مسار معتمد متعدد المستويات يضمن عدم انتقال أي دفعة من مرحلة إلى أخرى دون مراجعة وتأشير أصحاب الصلاحية المعنيين.",
    benefits: [
      "تسلسل إلزامي: إعداد ← تدقيق ← مصادقة ← رقابة",
      "إمكانية إعادة الملف للتصحيح مع ذكر الملاحظات",
      "إشعارات فورية لكل متدخل فور جهوزية المرحلة",
    ],
    accent: "text-purple-600 bg-purple-50 border-purple-100",
  },
  {
    icon: ShieldAlert,
    badge: "الرقابة المالية",
    title: "فضاء المراقب المالي والمحاسب",
    description:
      "واجهة مخصصة للمراقبة القبلية والتأشير على جداول الأجور وقرارات الصرف قبل الإذن النهائي بالتحويل المالي.",
    benefits: [
      "مطابقة الاعتمادات المالية والبنود الميزانياتية",
      "إرفاق التأشيرة الرقمية وتوثيق رقم الاعتماد",
      "حظر أي تعديل بعد التأشيرة القانونية",
    ],
    accent: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    icon: History,
    badge: "الشفافية الكاملة",
    title: "سجل التدقيق والتتبع (Audit Log)",
    description:
      "تسجيل غير قابل للحذف لكل حدث: تسجيل الدخول، إدخال المعطيات، حساب الرواتب، المصادقات والرفض مع التوقيت وهوية المستخدم.",
    benefits: [
      "مساءلة تامة وحماية ضد التلاعب غير المصرح به",
      "تتبع التعديلات خطوة بخطوة بالقيم السابقة والجديدة",
      "تصدير تقارير الرقابة والتفتيش الإداري",
    ],
    accent: "text-rose-600 bg-rose-50 border-rose-100",
  },
  {
    icon: FileSpreadsheet,
    badge: "خدمة الموظف",
    title: "فضاء الموظف وكشوف الأجور",
    description:
      "منصة سهلة الاستخدام تمكّن الأساتذة والموظفين من تنزيل كشوف رواتبهم الرسمية والاطلاع على تفاصيل المنح في أي وقت.",
    benefits: [
      "تحميل فوري لكشوف الرواتب بصيغة PDF معتمدة",
      "عرض شفاف لتفاصيل المنح والاقتطاعات",
      "أمان وخصوصية تامة لبيانات كل مستخدم",
    ],
    accent: "text-sky-600 bg-sky-50 border-sky-100",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-slate-50 py-20 lg:py-28 border-y border-slate-200/80 relative"
      aria-label="الوظائف الرئيسية"
    >
      <div className="container-uni px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-uni-navy text-xs font-bold border border-blue-200/60 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            الوظائف المؤسسية
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
            حل رقمي شامل مصمم للبيئة الجامعية
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            توفر منصة UNI-PAY منظومة متكاملة من الأدوات الإدارية والرقابية التي تغطي كافة جوانب دورة معالجة الأجور.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 card-shadow card-shadow-hover flex flex-col justify-between"
              >
                <div>
                  {/* Top bar with icon & badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-110 ${feature.accent}`}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5 group-hover:text-uni-navy transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                    {feature.description}
                  </p>
                </div>

                {/* Benefits List */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  {feature.benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-600"
                    >
                      <Check className="h-3.5 w-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
