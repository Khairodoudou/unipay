import { Users, User, ShieldCheck, CheckCircle } from "lucide-react";

const roles = [
  {
    title: "المسؤول الإداري",
    roleKey: "ADMINISTRATEUR",
    description: "إدارة حسابات المستخدمين، ضبط الصلاحيات، إعداد المعاملات ومتابعة السجلات العامة للنظام.",
    badge: "ADMIN",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    duties: ["إدارة الحسابات والصلاحيات", "إعداد الجداول المرجعية", "مراقبة سجل التدقيق العام"],
  },
  {
    title: "عون الموارد البشرية والأجور",
    roleKey: "AGENT RH / PAIE",
    description: "إعداد دفعات الأجور، استيراد بيانات الغيابات والمنح، تشغيل الحساب التلقائي والتدقيق الذكي للشذوذ.",
    badge: "RH / PAIE",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    duties: ["إدخال المتغيرات الشهرية", "تشغيل احتساب الرواتب", "معالجة تنبيهات التدقيق"],
  },
  {
    title: "رئيس مصلحة المستخدمين",
    roleKey: "CHEF DE SERVICE",
    description: "المراجعة الأولية لدفعات الأجور، التحقق من الوثائق الثبوتية للغيابات والتعويضات، والمصادقة أو الإرجاع.",
    badge: "CHEF SERVICE",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    duties: ["التأكد من التبريرات القانونية", "المصادقة الأولية على الجداول", "إرجاع الملفات غير المستوفاة"],
  },
  {
    title: "مدير الجامعة / الأمين العام",
    roleKey: "DIRECTEUR / SG",
    description: "الاطلاع على الملخص المالي الإجمالي، تقارير التكلفة، والمصادقة الإدارية النهائية قبل الإرسال للمحاسبة.",
    badge: "DIRECTEUR",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    duties: ["المصادقة الإدارية العليا", "متابعة المؤشرات والكتلة الإجمالية", "إصدار قرارات الدفع"],
  },
  {
    title: "المحاسب المعتمد",
    roleKey: "COMPTABLE",
    description: "مراجعة الجداول المحاسبية، التحقق من بنود الميزانية، وتجهيز القيود المالية قبل إحالتها للرقابة.",
    badge: "COMPTABLE",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    duties: ["مطابقة القيود المحاسبية", "مراجعة الاقتطاعات الإلزامية", "إعداد ملفات التحويل المالي"],
  },
  {
    title: "المراقب المالي المعتمد",
    roleKey: "CONTRÔLEUR FINANCIER",
    description: "إجراء الرقابة المالية القبلية، التحقق من توفر الاعتمادات المالية والتأشير القانوني النهائي للإذن بالصرف.",
    badge: "CTRL. FINANCIER",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    duties: ["الرقابة القبلية الصارمة", "منح التأشيرة الرسمية", "المطابقة مع القوانين السارية"],
  },
  {
    title: "الموظف والأستاذ الباحث",
    roleKey: "EMPLOYÉ / ENSEIGNANT",
    description: "فضاء شخصي آمن للاطلاع على كشوف الأجور الشهرية، تنزيلها بصيغة PDF ومتابعة التحديثات.",
    badge: "EMPLOYÉ",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    duties: ["تنزيل كشوف الأجور الرقمية", "الاطلاع على تفاصيل المنح", "أرشيف شخصي للسنوات السابقة"],
  },
  {
    title: "منظومة حوكمة متكاملة",
    roleKey: "SEGREGATION OF DUTIES",
    description: "فصل كامل بين مهام الإعداد والمصادقة والرقابة يضمن الشفافية ويمنع تضارب الصالح وفق المعايير الإدارية.",
    badge: "HOUKAMA",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    duties: ["لا مصادقة دون مراجعة", "مسار غير قابل للتجاوز", "حماية تامة للمال العام"],
    isSummary: true,
  },
];

export default function RolesSection() {
  return (
    <section
      id="roles"
      className="bg-white py-20 lg:py-28 relative overflow-hidden"
      aria-label="من يستخدم UNI-PAY"
    >
      <div className="container-uni px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200/70 mb-4">
            <Users className="w-3.5 h-3.5" />
            أصحاب المصلحة
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
            من يستخدم منصة UNI-PAY؟
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            توفر المنصة تجربة استخدام مخصصة وصلاحيات محددة بدقة لكل فاعل في المنظومة الجامعية.
          </p>
        </div>

        {/* Roles Grid: 8 items perfect grid (4 cols on lg/xl, 2 on md, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <div
              key={role.title}
              className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                role.isSummary
                  ? "bg-gradient-to-br from-slate-900 to-uni-navy text-white border-slate-800 shadow-xl"
                  : "bg-slate-50/70 hover:bg-white text-slate-900 border-slate-200/80 hover:border-uni-navy/30 card-shadow card-shadow-hover"
              }`}
            >
              <div>
                {/* Badge & Key */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                      role.isSummary
                        ? "bg-white/10 text-white border-white/20"
                        : role.badgeColor
                    }`}
                  >
                    {role.badge}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      role.isSummary ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {role.roleKey}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={`text-base font-bold mb-2 ${
                    role.isSummary ? "text-white" : "text-slate-900"
                  }`}
                >
                  {role.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-xs leading-relaxed mb-4 ${
                    role.isSummary ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {role.description}
                </p>
              </div>

              {/* Duties */}
              <div
                className={`pt-3 border-t flex flex-col gap-1.5 ${
                  role.isSummary ? "border-white/10" : "border-slate-200/60"
                }`}
              >
                {role.duties.map((duty, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 text-[11px] ${
                      role.isSummary ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 flex-shrink-0 ${
                        role.isSummary ? "text-teal-300" : "text-teal-600"
                      }`}
                    />
                    <span>{duty}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
