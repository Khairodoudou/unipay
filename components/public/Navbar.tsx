"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "الرئيسية", href: "#hero" },
  { label: "حول المنصة", href: "#about" },
  { label: "المزايا", href: "#features" },
  { label: "سير العمل", href: "#workflow" },
  { label: "الأمان والرقابة", href: "#security" },
  { label: "المستخدمون", href: "#roles" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("#")) {
      const el = document.getElementById(href.slice(1));
      if (el) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 text-slate-800 shadow-sm border-b border-slate-200/80 backdrop-blur-md"
          : "bg-[#0b1528]/85 text-white border-b border-white/10 backdrop-blur-md"
      )}
    >
      <nav className="container-uni px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 focus-ring rounded-lg group"
            aria-label="UNI-PAY — الصفحة الرئيسية"
          >
            <div
              className={cn(
                "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl font-bold text-base sm:text-lg transition-transform group-hover:scale-105 shadow-md",
                scrolled
                  ? "bg-gradient-to-br from-uni-navy to-blue-700 text-white shadow-blue-900/10"
                  : "bg-gradient-to-br from-teal-400 to-blue-600 text-white shadow-teal-500/20"
              )}
            >
              U
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-lg sm:text-xl font-extrabold tracking-tight transition-colors leading-none",
                  scrolled ? "text-uni-navy" : "text-white"
                )}
              >
                UNI-PAY
              </span>
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-medium transition-colors mt-0.5",
                  scrolled ? "text-slate-500" : "text-slate-300"
                )}
              >
                تسيير أجور موظفي الجامعة
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  "px-3.5 py-2 text-sm font-medium rounded-lg transition-colors focus-ring cursor-pointer",
                  scrolled
                    ? "text-slate-600 hover:text-uni-navy hover:bg-slate-100"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all focus-ring shadow-sm",
                scrolled
                  ? "bg-uni-navy text-white hover:bg-blue-900 hover:shadow-md"
                  : "bg-white text-slate-900 hover:bg-slate-100 hover:shadow-lg hover:shadow-white/10"
              )}
            >
              <ChevronLeft className="h-4 w-4 icon-rtl" aria-hidden="true" />
              <span>تسجيل الدخول</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors focus-ring cursor-pointer",
              scrolled
                ? "text-slate-700 hover:bg-slate-100"
                : "text-white hover:bg-white/10"
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {isOpen && (
          <div
            className={cn(
              "lg:hidden border-t py-4 rounded-b-2xl shadow-xl animate-fade-in",
              scrolled
                ? "border-slate-200 bg-white"
                : "border-white/10 bg-[#0b1528] text-white"
            )}
          >
            <div className="flex flex-col gap-1 px-3">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => handleNavClick(link.href)}
                  className={cn(
                    "w-full text-right px-4 py-3 text-sm font-medium rounded-xl transition-colors cursor-pointer",
                    scrolled
                      ? "text-slate-700 hover:text-uni-navy hover:bg-slate-100"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </button>
              ))}

              <div className="pt-3 mt-2 border-t border-slate-200/20 px-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-uni-navy text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-900 transition-colors focus-ring"
                >
                  <ChevronLeft className="h-4 w-4 icon-rtl" aria-hidden="true" />
                  <span>تسجيل الدخول إلى المنصة</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
