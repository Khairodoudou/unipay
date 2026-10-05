import {
  Lock,
  Eye,
  Database,
  UserCheck,
  ClipboardList,
  Layers,
  Shield,
  CheckCircle2,
  FileKey,
} from "lucide-react";

const securityItems = [
  {
    icon: UserCheck,
    title: "تحكم صارم في الصلاحيات (RBAC)",
    description:
      "كل مستخدم يملك صلاحيات محددة بدقة حسب دوره الوظيفي. لا يمكن لأي مستخدم تجاوز اختصاصه أو تعديل بيانات خارج صلاحيته المعتمدة.",
  },
  {
    icon: Eye,
    title: "التتبع الكامل والمساءلة (Audit Trail)",
    description:
      "كل إجراء يُسجل بدقة متناهية: هوية المستخدم، عنوان IP، التوقيت، ونوع التعديل بالقيم السابقة والجديدة لضمان الشفافية المطلقة.",
  },
  {
    icon: Layers,
    title: "مبدأ الفصل بين المهام (Segregation of Duties)",
    description:
      "الموظف الذي يُعدّ الأجور لا يملك صلاحية المصادقة عليها، ومن يُصادق إدارياً لا يملك سلطة التأشير المالي، لمنع أي تضارب للمصالح.",
  },
  {
    icon: Database,
    title: "حماية وسرية البيانات المالية",
    description:
      "تشفير كامل للبيانات الشخصية والحسابات البريدية والبنكية، مع عزل أمني يمنع أي تسريب أو اطلاع غير مصرح به.",
  },
  {
    icon: FileKey,
    title: "مصادقة موحدة وحسابات مؤسسية",
    description:
      "الولوج للمنصة محصور بالحسابات المهنية المعتمدة للمؤسسة الجامعية دون إتاحة التسجيل المفتوح للعموم.",
  },
  {
    icon: ClipboardList,
    title: "حفظ وأرشفة تاريخية غير قابلة للتعديل",
    description:
      "أرشفة دورات الأجور السابقة وسجلات التأشيرة المالية كأرشيف إلكتروني رسمي معتمد وقابل للاسترجاع الفوري.",
  },
];

export default function SecuritySection() {
  return (
    <section
      id="security"
      className="bg-slate-50 py-20 lg:py-28 border-t border-slate-200/80 relative"
      aria-label="الأمان والشفافية"
    >
      <div className="container-uni px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text side — 6 cols */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold mb-4">
                <Shield className="w-3.5 h-3.5 text-uni-navy" />
                الأمان والرقابة المؤسسية
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                أمان مصمّم لمتطلبات الإدارة العمومية
              </h2>
              <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                تطبق <strong className="text-uni-navy font-semibold">UNI-PAY</strong> أعلى معايير الحوكمة والأمن السيبراني لحماية المال العام والبيانات الوظيفية الحساسة.
              </p>
            </div>

            {/* Security Items */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {securityItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-uni-navy/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-uni-navy flex items-center justify-center mb-3">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual side — 6 cols */}
          <div className="lg:col-span-6">
            <div className="relative">
              {/* Main security dashboard card */}
              <div className="rounded-2xl bg-[#0b1528] text-white p-6 sm:p-8 shadow-2xl border border-white/10 ring-1 ring-white/5">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
                      <Lock className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        مصفوفة التحكم في الوصول (RBAC)
                      </h4>
                      <p className="text-slate-400 text-xs">
                        فصل الصلاحيات حسب الهيكل الجامعي
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    نظام محمي
                  </span>
                </div>

                {/* Role access levels */}
                <div className="flex flex-col gap-2.5 mb-6">
                  {[
                    { role: "المسؤول الإداري (Admin)", access: "إدارة المستخدمين والإعدادات العامة", color: "bg-blue-500/20 text-blue-300 border-blue-400/30" },
                    { role: "عون الأجور (RH / Paie)", access: "إعداد البيانات وتشغيل الحسابات والتدقيق", color: "bg-teal-500/20 text-teal-300 border-teal-400/30" },
                    { role: "رئيس المصلحة / المدير", access: "المراجعة الشاملة والمصادقة الإدارية", color: "bg-purple-500/20 text-purple-300 border-purple-400/30" },
                    { role: "المحاسب المعتمد", access: "المطابقة المحاسبية والقيود المالية", color: "bg-sky-500/20 text-sky-300 border-sky-400/30" },
                    { role: "المراقب المالي المعتمد", access: "الرقابة القبلية والتأشيرة القانونية", color: "bg-amber-500/20 text-amber-300 border-amber-400/30" },
                    { role: "الموظف / الأستاذ", access: "استشارة كشوف الرواتب الشخصية فقط", color: "bg-slate-500/20 text-slate-300 border-slate-400/30" },
                  ].map((item) => (
                    <div
                      key={item.role}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/[0.07] transition-colors"
                    >
                      <span className="text-xs font-semibold text-slate-200">
                        {item.role}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${item.color}`}
                      >
                        {item.access}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Live Audit Log Preview */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-teal-400" />
                      سجل التدقيق الحي (Audit Log)
                    </span>
                    <span className="text-slate-500 text-[10px]">تحديث لحظي</span>
                  </div>
                  <div className="flex flex-col gap-2 font-mono text-[11px]">
                    {[
                      { action: "تأشيرة الرقابة المالية على الدفعة #09-2026", time: "11:42:05", by: "مراقب مالي" },
                      { action: "المصادقة الإدارية من طرف مدير الجامعة", time: "10:15:30", by: "المدير" },
                      { action: "انتهاء التدقيق الآلي: تم فحص 342 ملف", time: "09:30:12", by: "النظام" },
                    ].map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-1.5 last:border-0 last:pb-0"
                      >
                        <span className="text-slate-300 font-sans truncate max-w-[240px]">
                          {entry.action}
                        </span>
                        <span className="text-slate-500 text-[10px] flex-shrink-0">
                          {entry.time} · {entry.by}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
