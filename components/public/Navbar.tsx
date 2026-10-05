"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "الرئيسية", href: "#hero" },
  { label: "حول المنصة", href: "#about" },
  { label: "المزايا", href: "#features" },
  { label: "كيف تعمل؟", href: "#workflow" },
  { label: "الأمان", href: "#security" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("#")) {
      const el = document.getElementById(href.slice(1));
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container-uni section-padding py-0">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-ring rounded-md"
            aria-label="UNI-PAY — الصفحة الرئيسية"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm transition-colors",
                scrolled
                  ? "bg-uni-navy text-white"
                  : "bg-white/20 text-white backdrop-blur-sm"
              )}
            >
              U
            </div>
            <span
              className={cn(
                "text-xl font-bold tracking-tight transition-colors",
                scrolled ? "text-uni-navy" : "text-white"
              )}
            >
              UNI-PAY
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors focus-ring",
                  scrolled
                    ? "text-slate-600 hover:text-uni-navy hover:bg-slate-100"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <Link
              href="/login"
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all focus-ring",
                scrolled
                  ? "bg-uni-navy text-white hover:bg-uni-navy-dark"
                  : "bg-white text-uni-navy hover:bg-white/90"
              )}
            >
              <ChevronLeft className="h-4 w-4 icon-rtl" aria-hidden="true" />
              تسجيل الدخول
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className={cn(
              "md:hidden p-2 rounded-md transition-colors focus-ring",
              scrolled
                ? "text-slate-700 hover:bg-slate-100"
                : "text-white hover:bg-white/10"
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden border-t border-border/50 bg-white/98 backdrop-blur-md pb-4 mt-1 rounded-b-lg shadow-lg animate-fade-in">
            <div className="flex flex-col gap-1 pt-3 px-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="w-full text-right px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-uni-navy hover:bg-slate-50 rounded-md transition-colors focus-ring"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 px-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-uni-navy text-white rounded-md text-sm font-semibold hover:bg-uni-navy-dark transition-colors focus-ring"
                >
                  <ChevronLeft className="h-4 w-4 icon-rtl" aria-hidden="true" />
                  تسجيل الدخول
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
