import {
  FileText,
  Search,
  GitBranch,
  Shield,
  Activity,
  Receipt,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "إدارة الأجور",
    description:
      "إعداد ومعالجة ملفات الأجور ومتابعة الفترات والدفعات بشكل منظم ومتكامل.",
  },
  {
    icon: Search,
    title: "التدقيق الذكي",
    description:
      "اكتشاف البيانات الناقصة والتناقضات والقيم غير العادية للمساعدة في المراجعة وتصحيح الأخطاء.",
  },
  {
    icon: GitBranch,
    title: "سير العمل",
    description:
      "تنظيم مراحل المصادقة والتحقق حسب الصلاحيات والمسؤوليات من الإعداد إلى الإذن بالدفع.",
  },
  {
    icon: Shield,
    title: "الرقابة المالية",
    description:
      "دعم عملية المراقبة والتأشير قبل الانتقال إلى مرحلة التنفيذ مع فصل كامل بين الصلاحيات.",
  },
  {
    icon: Activity,
    title: "التتبع والسجل",
    description:
      "تسجيل العمليات المهمة لضمان الشفافية وإمكانية التتبع الكامل لكل مرحلة.",
  },
  {
    icon: Receipt,
    title: "كشوف الأجور",
    description:
      "تمكين الموظف من الوصول إلى كشوف أجوره بطريقة منظمة وآمنة مع إمكانية التحميل.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-uni-bg section-padding"
      aria-label="الوظائف الرئيسية"
    >
      <div className="container-uni">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-uni-blue text-xs font-semibold border border-blue-100 mb-4">
            الوظائف الرئيسية
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-uni-navy mb-4">
            كل ما تحتاجه في منصة واحدة
          </h2>
          <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
            UNI-PAY توفر مجموعة متكاملة من الأدوات لإدارة دورة الأجور بشكل
            فعّال، من الإعداد إلى إتاحة الكشوف للموظفين.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group bg-white rounded-xl p-6 border border-border card-shadow card-shadow-hover"
              >
                {/* Icon */}
                <div className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 text-uni-blue group-hover:bg-uni-navy group-hover:text-white group-hover:border-uni-navy transition-colors">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-uni-navy mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
