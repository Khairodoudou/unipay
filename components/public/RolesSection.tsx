const roles = [
  {
    title: "المسؤول الإداري",
    description: "يدير المستخدمين والصلاحيات وإعدادات النظام وقواعد الأجور.",
    badge: "ADMIN",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    title: "عون الموارد البشرية والأجور",
    description:
      "يُعدّ الملفات ويستورد البيانات ويُشغّل الحسابات والتدقيق الذكي ويُقدّم الدفعات.",
    badge: "RH / PAIE",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-100",
  },
  {
    title: "رئيس المصلحة",
    description:
      "يراجع الدفعة ويتحقق من البيانات والتناقضات ويُصادق أو يُعيدها للتصحيح.",
    badge: "CHEF SERVICE",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
  },
  {
    title: "مدير الجامعة",
    description:
      "يطّلع على الملخص العام والتنبيهات المهمة ويُصادق على المستوى الإداري الأعلى.",
    badge: "DIRECTEUR",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
  },
  {
    title: "المحاسب",
    description:
      "يراجع الكتابات المحاسبية والمبالغ ويُصادق على صحة الجانب المحاسبي.",
    badge: "COMPTABLE",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    title: "المراقب المالي",
    description:
      "يُجري الرقابة المالية النهائية ويُؤشّر ويُصرّح بالإذن بالدفع.",
    badge: "CTRL. FINANCIER",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-100",
  },
  {
    title: "الموظف",
    description:
      "يطّلع على بياناته الشخصية وكشوف أجوره ويُحمّلها ويستقبل الإشعارات.",
    badge: "EMPLOYÉ",
    badgeColor: "bg-slate-50 text-slate-600 border-slate-200",
  },
];

export default function RolesSection() {
  return (
    <section
      id="roles"
      className="bg-white section-padding"
      aria-label="من يستخدم UNI-PAY"
    >
      <div className="container-uni">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold border border-indigo-100 mb-4">
            المستخدمون
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-uni-navy mb-4">
            من يستخدم UNI-PAY؟
          </h2>
          <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
            تُخصّص المنصة واجهة وصلاحيات مختلفة لكل فئة من المستخدمين حسب
            مهامهم ومسؤولياتهم الوظيفية.
          </p>
        </div>

        {/* Roles grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div
              key={role.title}
              className="bg-uni-bg rounded-xl p-5 border border-border hover:border-slate-300 hover:shadow-md transition-all"
            >
              {/* Badge */}
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${role.badgeColor} mb-3`}
              >
                {role.badge}
              </span>
              {/* Title */}
              <h3 className="text-sm font-semibold text-uni-navy mb-2">
                {role.title}
              </h3>
              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
