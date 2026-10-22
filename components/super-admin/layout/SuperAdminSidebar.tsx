"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  ScrollText,
  Sliders,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { UserSessionData } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { LogOut } from "lucide-react";

interface SuperAdminSidebarProps {
  user: UserSessionData;
}

const NAV_ITEMS = [
  {
    href: "/super-admin/dashboard",
    labelAr: "المؤشرات الوطنية",
    sublabel: "Vue d'ensemble nationale",
    icon: LayoutDashboard,
  },
  {
    href: "/super-admin/universities",
    labelAr: "دليل الجامعات والمدارس",
    sublabel: "Annuaire des universités",
    icon: Building2,
  },
  {
    href: "/super-admin/universities/new",
    labelAr: "تسجيل جامعة جديدة",
    sublabel: "Enrôlement institutionnel",
    icon: PlusCircle,
  },
  {
    href: "/super-admin/audit-logs",
    labelAr: "سجل التدقيق المركزي",
    sublabel: "Audit & traçabilité centrale",
    icon: ScrollText,
  },
  {
    href: "/super-admin/settings",
    labelAr: "الحوكمة والسياسات",
    sublabel: "Gouvernance & politiques",
    icon: Sliders,
  },
];

export function SuperAdminSidebar({ user }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/super-admin/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 border-l border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link
          href="/super-admin/dashboard"
          className="flex items-center gap-3 focus-ring rounded-xl group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-700 to-purple-900 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-950/50 group-hover:scale-105 transition-transform border border-indigo-400/30">
            DZ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">
                UNI-PAY
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                مركزي
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[170px]">
              الإدارة المركزية الوطنية
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus-ring cursor-pointer"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Super Admin Badge Banner */}
      <div className="mx-3 mt-4 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-500/30 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-400/30">
          <Shield className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">الديوان المركزي للأجور</p>
          <p className="text-[10px] text-slate-400 truncate">سلطة الإشراف والرقابة</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          الوظائف المركزية
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/90"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? "text-white" : "text-slate-400"
                  }`}
                />
                <div className="text-right">
                  <div className="leading-tight">{item.labelAr}</div>
                  <div
                    className={`text-[10px] ${
                      active ? "text-indigo-200" : "text-slate-500"
                    }`}
                  >
                    {item.sublabel}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-200 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-indigo-400 font-medium truncate">
              {user.roleNameAr}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors focus-ring cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm">
            DZ
          </div>
          <div>
            <span className="text-sm font-black">UNI-PAY</span>
            <span className="mr-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-200">
              مركزي
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white focus-ring cursor-pointer"
          aria-label="فتح القائمة الرئيسية"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {navContent}
      </aside>
    </>
  );
}
