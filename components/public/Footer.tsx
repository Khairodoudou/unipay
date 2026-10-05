import Link from "next/link";

const footerLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "حول المنصة", href: "/#about" },
  { label: "الأمان", href: "/#security" },
  { label: "تسجيل الدخول", href: "/login" },
];

export default function Footer() {
  return (
    <footer
      className="bg-slate-900 text-slate-400"
      role="contentinfo"
      aria-label="تذييل الصفحة"
    >
      <div className="container-uni section-padding py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-uni-blue text-white font-bold text-sm">
                U
              </div>
              <span className="text-lg font-bold text-white">UNI-PAY</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              منصة رقمية لتسيير ومتابعة أجور موظفي الجامعة.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="روابط التذييل">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-white transition-colors focus-ring rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-slate-600">
            © 2026 UNI-PAY — جميع الحقوق محفوظة
          </p>
          <p className="text-xs text-slate-700">
            منصة داخلية — للاستخدام المؤسسي فقط
          </p>
        </div>
      </div>
    </footer>
  );
}
