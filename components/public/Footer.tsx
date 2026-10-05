import Link from "next/link";
import {
  ShieldCheck,
  ChevronLeft,
  Lock,
  Building2,
  FileCheck2,
  Cpu,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export default function Footer() {
  const platformLinks = [
    { label: "نبذة عن المنصة", href: "#about" },
    { label: "إدارة دورات الأجور", href: "#features" },
    { label: "التدقيق الذكي للشذوذ", href: "#features" },
    { label: "الرقابة والتأشيرة المالية", href: "#features" },
    { label: "كشوف الأجور الرقمية", href: "#features" },
  ];

  const workflowLinks = [
    { label: "دورة العمل (7 مراحل)", href: "#workflow" },
    { label: "مسار الرد والتصحيح", href: "#workflow" },
    { label: "مصفوفة الصلاحيات (RBAC)", href: "#security" },
    { label: "سجل التدقيق والتتبع (Audit)", href: "#security" },
    { label: "فئات وأدوار المستخدمين", href: "#roles" },
  ];

  const institutionalLinks = [
    { label: "بوابة تسجيل الدخول", href: "/login", isSpecial: true },
    { label: "دليل المستخدم الإداري", href: "#about" },
    { label: "الامتثال للتشريعات الوطنية", href: "#security" },
    { label: "سياسة أمان وسرية البيانات", href: "#security" },
  ];

  return (
    <footer
      className="relative bg-[#070e1b] text-slate-400 border-t border-slate-800/80 overflow-hidden"
      role="contentinfo"
      aria-label="تذييل الصفحة"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-1/4 w-[600px] h-[250px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[250px] rounded-full bg-teal-500/5 blur-[120px]" />
      </div>

      <div className="container-uni px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        {/* Main 4-column structured grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-slate-800/80">
          {/* Column 1: Brand & Ministry Context (4.5 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Ministry Header Line */}
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>الجمهورية الجزائرية الديمقراطية الشعبية</span>
            </div>

            {/* Platform Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 via-blue-600 to-indigo-700 text-white font-extrabold text-xl shadow-md shadow-blue-900/30">
                U
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-white tracking-tight leading-none">
                  UNI-PAY
                </span>
                <span className="text-xs font-medium text-slate-400 mt-1">
                  وزارة التعليم العالي والبحث العلمي
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mt-1">
              المنظومة الرقمية الوطنية الموحدة لتسيير ومعالجة أجور موظفي المؤسسات الجامعية.
              أتمتة الحسابات، التدقيق الذكي للشذوذ، والمصادقة الإدارية والتأشيرة المالية في بيئة مركزية آمنة ومطابقة للتنظيم.
            </p>

            {/* Server & Release Status */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span>الخادم المؤسسي: متصل ومستقر</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">v1.0 Enterprise</span>
            </div>
          </div>

          {/* Column 2: Platform Links (2.5 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>المنصة والوظائف</span>
            </h4>
            <ul className="flex flex-col gap-2.5">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-slate-400 hover:text-white hover:translate-x-[-3px] transition-all inline-flex items-center gap-1.5 focus-ring rounded py-0.5 group"
                  >
                    <span className="text-slate-600 group-hover:text-teal-400 transition-colors">›</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Workflow & Governance (2.5 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span>سير العمل والرقابة</span>
            </h4>
            <ul className="flex flex-col gap-2.5">
              {workflowLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-slate-400 hover:text-white hover:translate-x-[-3px] transition-all inline-flex items-center gap-1.5 focus-ring rounded py-0.5 group"
                  >
                    <span className="text-slate-600 group-hover:text-teal-400 transition-colors">›</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Institutional Portal & Quick Access (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>الفضاء المؤسسي</span>
            </h4>

            {/* Quick Login Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/90 border border-slate-700/80 shadow-inner flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Lock className="h-3.5 w-3.5 text-teal-400" />
                  <span>بوابة الدخول الموحدة</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                  مؤمّنة
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                مخصصة للأساتذة، الموظفين، مصالح الأجور والرقابة المالية.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 hover:shadow-md transition-all active:scale-[0.98] focus-ring"
              >
                <span>تسجيل الدخول إلى حسابك</span>
                <ChevronLeft className="h-3.5 w-3.5 icon-rtl" />
              </Link>
            </div>

            {/* Additional Links */}
            <ul className="flex flex-col gap-2">
              {institutionalLinks
                .filter((l) => !l.isSpecial)
                .map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 py-0.5 group"
                    >
                      <span className="text-slate-600 group-hover:text-purple-400 transition-colors">›</span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Institutional Trust Pillars Bar */}
        <div className="py-8 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">فصل تام للمسؤوليات</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Segregation of Duties في كافة مراحل الصرف</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <FileCheck2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">مطابقة تشريعية وقانونية</p>
              <p className="text-[11px] text-slate-500 mt-0.5">امتثال كامل لقوانين الوظيف العمومي والتعليم العالي</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Cpu className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">تدقيق ذكي وأرشفة غير قابلة للتعديل</p>
              <p className="text-[11px] text-slate-500 mt-0.5">سجل تدقيق كامل للعمليات والتأشيرات المالية</p>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p>
              © 2026 <strong className="text-slate-400 font-semibold">UNI-PAY</strong> — وزارة التعليم العالي والبحث العلمي · الجمهورية الجزائرية الديمقراطية الشعبية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-slate-400">
            <span className="text-slate-600">|</span>
            <Link href="#security" className="hover:text-white transition-colors">
              حماية البيانات
            </Link>
            <Link href="#about" className="hover:text-white transition-colors">
              دليل الاستخدام
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              بوابة الدخول
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">نظام مؤسسي مغلق</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
