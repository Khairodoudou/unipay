"use client";

/**
 * components/controle-financier/layout/ControleurSidebar.tsx
 * Navigation latérale pour l'espace Contrôleur Financier.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  Stamp,
  History,
  Menu,
  X,
  ChevronLeft,
  Building,
} from "lucide-react";
import { UserSessionData } from "@/lib/auth/session";

interface ControleurSidebarProps {
  user: UserSessionData;
}

const NAV_ITEMS = [
  {
    href: "/controle-financier/dashboard",
    labelAr: "لوحة القيادة والرقابة",
    sublabel: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/controle-financier/batches",
    labelAr: "الجداول بانتظار التأشيرة",
    sublabel: "Visas en attente",
    icon: FileCheck2,
  },
  {
    href: "/controle-financier/history",
    labelAr: "سجل التأشيرات المالية",
    sublabel: "Historique visas",
    icon: History,
  },
];

export function ControleurSidebar({ user }: ControleurSidebarProps) {
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
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                المراقب المالي
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">الرقابة المالية المسبقة</p>
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
          التأشيرة والرقابة المسبقة
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
                  ? "bg-amber-600 text-white shadow-sm font-bold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                <div className="text-right">
                  <div>{item.labelAr}</div>
                  <div className={`text-[10px] ${active ? "text-amber-100" : "text-slate-400"}`}>
                    {item.sublabel}
                  </div>
                </div>
              </div>
              <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${active ? "text-white" : "text-slate-500 opacity-60"}`} />
            </Link>
          );
        })}
      </nav>

      {/* Role Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
            {user.firstName?.charAt(0) || "F"}
          </div>
          <div className="overflow-hidden text-right flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              المراقب المالي (Contrôleur Financier)
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Stamp className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-sm">أكاديميا شفاف — المراقب المالي</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-hidden"
          aria-label="القائمة"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      <aside className="hidden lg:block w-64 shrink-0 min-h-screen border-l border-slate-200 sticky top-0 h-screen">
        {navContent}
      </aside>
    </>
  );
}
