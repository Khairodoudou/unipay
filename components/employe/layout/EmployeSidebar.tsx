"use client";

/**
 * components/employe/layout/EmployeSidebar.tsx
 * Navigation latérale pour l'espace Employé.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  Bell,
  Menu,
  X,
  ChevronLeft,
  Building,
} from "lucide-react";
import { UserSessionData } from "@/lib/auth/session";

interface EmployeSidebarProps {
  user: UserSessionData;
}

const NAV_ITEMS = [
  {
    href: "/employe/dashboard",
    labelAr: "لوحة التحكم",
    sublabel: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/employe/profile",
    labelAr: "ملفي الشخصي",
    sublabel: "Mon Profil",
    icon: User,
  },
  {
    href: "/employe/payslips",
    labelAr: "كشوف الراتب",
    sublabel: "Mes Bulletins",
    icon: FileText,
  },
  {
    href: "/employe/notifications",
    labelAr: "الإشعارات",
    sublabel: "Notifications",
    icon: Bell,
  },
];

export function EmployeSidebar({ user }: EmployeSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md shrink-0 border border-white/10">
            <Image
              src="/images/logo.png"
              alt="أكاديميا شفاف"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">أكاديميا شفاف</h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                الموظف
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">فضاء الموظف الشخصي</p>
          </div>
        </div>

        <div className="mt-4 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-300 truncate" title={user.organizationName}>
            {user.organizationName}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          الخدمات الشخصية
        </div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? "text-white" : "text-slate-400"
                  }`}
                />
                <div>
                  <div>{item.labelAr}</div>
                  <div className="text-[10px] text-slate-400 opacity-80">{item.sublabel}</div>
                </div>
              </div>
              <ChevronLeft
                className={`w-3.5 h-3.5 transition-transform ${
                  active ? "text-white" : "text-slate-500"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-center">
        <p className="text-[11px] text-slate-400">
          نظام الأجور الجامعية الرقمي
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">أكاديميا شفاف © 2026</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 start-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus-ring"
        aria-label="القائمة الجانبية"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:start-0 lg:z-30 shadow-md">
        {navContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 end-4 p-2 text-slate-400 hover:text-white rounded-lg focus-ring"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
