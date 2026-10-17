"use client";

/**
 * components/directeur/layout/DirecteurSidebar.tsx
 * Navigation latérale pour l'espace Directeur de l'établissement.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  BarChart3,
  History,
  Menu,
  X,
  ChevronLeft,
  Crown,
  Building,
} from "lucide-react";
import { UserSessionData } from "@/lib/auth/session";

interface DirecteurSidebarProps {
  user: UserSessionData;
}

const NAV_ITEMS = [
  {
    href: "/directeur/dashboard",
    labelAr: "لوحة القيادة الإدارية",
    sublabel: "Tableau de bord",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/directeur/batches",
    labelAr: "الجداول بانتظار المصادقة",
    sublabel: "Approbation paie",
    icon: FileCheck2,
  },
  {
    href: "/directeur/reports",
    labelAr: "التقارير والمؤشرات",
    sublabel: "Rapports & KPI",
    icon: BarChart3,
  },
  {
    href: "/directeur/history",
    labelAr: "سجل القرارات الإدارية",
    sublabel: "Historique décisions",
    icon: History,
  },
];

export function DirecteurSidebar({ user }: DirecteurSidebarProps) {
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
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">UNI-PAY</h1>
            <p className="text-[11px] text-purple-300 font-medium">إدارة المؤسسة الجامعية</p>
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
          الإدارة والمصادقة التنفيذية
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
                  ? "bg-purple-600 text-white shadow-sm font-bold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                <div className="text-right">
                  <div>{item.labelAr}</div>
                  <div className={`text-[10px] ${active ? "text-purple-100" : "text-slate-400"}`}>
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
          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
            {user.firstName?.charAt(0) || "D"}
          </div>
          <div className="overflow-hidden text-right flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              مدير المؤسسة (Directeur)
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header Toggle */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-sm">UNI-PAY — مدير المؤسسة</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-hidden"
          aria-label="القائمة"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
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

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 min-h-screen border-l border-slate-200 sticky top-0 h-screen">
        {navContent}
      </aside>
    </>
  );
}
