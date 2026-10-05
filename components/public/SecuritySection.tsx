import { Lock, Eye, Database, UserCheck, ClipboardList, Layers } from "lucide-react";

const securityItems = [
  {
    icon: UserCheck,
    title: "التحكم في الصلاحيات",
    description:
      "كل مستخدم يملك صلاحيات محددة بدقة حسب دوره الوظيفي. لا يمكن لأي مستخدم تجاوز حدود دوره أو التأثير على مرحلة خارج اختصاصه.",
  },
  {
    icon: Eye,
    title: "التتبع الكامل للعمليات",
    description:
      "كل إجراء يتم تسجيله: من قام به، متى، على أي مورد، وما هو النتيجة — مما يضمن الشفافية الكاملة وإمكانية المراجعة.",
  },
  {
    icon: Database,
    title: "حماية البيانات",
    description:
      "البيانات الشخصية والمالية للموظفين محمية ولا يمكن الوصول إليها إلا من الجهات المصرّح لها بشكل صريح.",
  },
  {
    icon: Lock,
    title: "المصادقة الآمنة",
    description:
      "الوصول إلى المنصة يتم عبر حسابات مؤسسية فقط. لا توجد إمكانية للتسجيل العام أو الوصول غير المصرّح به.",
  },
  {
    icon: ClipboardList,
    title: "سجل التدقيق",
    description:
      "سجل تدقيق مفصّل يُمكّن المسؤول الإداري من مراجعة كل عملية مهمة أُجريت على المنصة في أي وقت.",
  },
  {
    icon: Layers,
    title: "الفصل بين المسؤوليات",
    description:
      "مبدأ الفصل بين المهام مطبّق بالكامل: من يُعدّ لا يُصادق، ومن يُصادق لا يُراقب، مما يُقلل من مخاطر الأخطاء والتلاعب.",
  },
];

export default function SecuritySection() {
  return (
    <section
      id="security"
      className="bg-uni-bg section-padding"
      aria-label="الأمان والشفافية"
    >
      <div className="container-uni">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text side */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 mb-4">
              الأمان والشفافية
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-uni-navy mb-4">
              أمان مصمّم للبيئة المؤسسية
            </h2>
            <p className="text-slate-500 text-base leading-relaxed mb-8">
              UNI-PAY مصممة من الأساس لضمان الشفافية والمساءلة في كل مرحلة من
              مراحل معالجة الأجور، مع حماية فعلية للبيانات الشخصية والمالية.
            </p>

            {/* Security items */}
            <div className="flex flex-col gap-5">
              {securityItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-uni-navy/8 border border-uni-navy/10 flex items-center justify-center text-uni-navy">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-uni-navy mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual side */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main security card */}
              <div className="rounded-2xl bg-uni-navy p-8 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Lock className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">نظام الصلاحيات</p>
                    <p className="text-white/60 text-xs">RBAC — Role-Based Access Control</p>
                  </div>
                </div>

                {/* Role badges */}
                <div className="flex flex-col gap-2">
                  {[
                    { role: "المسؤول الإداري", access: "إدارة النظام", color: "bg-blue-500/20 border-blue-400/30 text-blue-300" },
                    { role: "عون الأجور", access: "إعداد وحساب الأجور", color: "bg-teal-500/20 border-teal-400/30 text-teal-300" },
                    { role: "رئيس المصلحة", access: "مراجعة ومصادقة", color: "bg-purple-500/20 border-purple-400/30 text-purple-300" },
                    { role: "المراقب المالي", access: "تأشير وإذن الدفع", color: "bg-amber-500/20 border-amber-400/30 text-amber-300" },
                    { role: "الموظف", access: "استشارة الكشوف فقط", color: "bg-slate-500/20 border-slate-400/30 text-slate-300" },
                  ].map((item) => (
                    <div
                      key={item.role}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <span className="text-sm text-white/90">{item.role}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${item.color}`}
                      >
                        {item.access}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Audit log sample */}
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-3">سجل التدقيق — آخر الإجراءات</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { action: "تقديم دفعة الأجور", time: "10:35", user: "عون الأجور" },
                      { action: "مصادقة رئيس المصلحة", time: "11:12", user: "رئيس المصلحة" },
                    ].map((log, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-white/70">{log.action}</span>
                        <span className="text-white/40">{log.time} · {log.user}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                سجل التدقيق نشط
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
