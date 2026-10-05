import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const footerLinks = [
  { label: "الرئيسية", href: "#hero" },
  { label: "حول المنصة", href: "#about" },
  { label: "الوظائف والمزايا", href: "#features" },
  { label: "دورة العمل", href: "#workflow" },
  { label: "الأمان والرقابة", href: "#security" },
  { label: "المستخدمون", href: "#roles" },
  { label: "تسجيل الدخول", href: "/login" },
];

export default function Footer() {
  return (
    <footer
      className="bg-[#070e1c] text-slate-400 border-t border-slate-800"
      role="contentinfo"
      aria-label="تذييل الصفحة"
    >
      <div className="container-uni px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-slate-800">
          {/* Brand & University context — 6 cols */}
          <div className="md:col-span-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-blue-600 text-white font-extrabold text-base shadow-sm">
                U
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                UNI-PAY
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mt-1">
              المنصة الرقمية المؤسسية الموحدة لتسيير ومعالجة أجور موظفي المؤسسات الجامعية بالجزائر.
              إعداد البيانات، الحساب الآلي، التدقيق الذكي، المصادقة الإدارية والتأشيرة المالية في بيئة مركزية آمنة.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>حالة الخادم: متصل ومستقر</span>
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-slate-500 text-xs">إصدار 2026.1</span>
            </div>
          </div>

          {/* Quick navigation links — 6 cols */}
          <div className="md:col-span-6 flex flex-col gap-3 md:items-end">
            <h4 className="text-sm font-bold text-white mb-2">روابط سريعة</h4>
            <nav aria-label="روابط التذييل">
              <ul className="flex flex-wrap gap-x-6 gap-y-2.5 md:justify-end">
                {footerLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors focus-ring rounded py-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-500">
          <p>
            © 2026 UNI-PAY — وزارة التعليم العالي والبحث العلمي. جميع الحقوق محفوظة.
          </p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <span>نظام إداري محمي وفق التشريعات الوطنية للوظيف العمومي</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
