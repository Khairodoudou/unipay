"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileSpreadsheet,
  Upload,
  Calculator,
  Menu,
  X,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { UserSessionData } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";

interface AgentSidebarProps {
  user: UserSessionData;
}

const NAV_ITEMS = [
  {
    href: "/agent/dashboard",
    labelAr: "لوحة القيادة",
    sublabel: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/agent/employees",
    labelAr: "ملفات الموظفين",
    sublabel: "Employés",
    icon: Users,
  },
  {
    href: "/agent/employees/import",
    labelAr: "استيراد Excel",
    sublabel: "Import Excel",
    icon: Upload,
  },
  {
    href: "/agent/payroll-periods",
    labelAr: "فترات الأجر",
    sublabel: "Périodes de paie",
    icon: Calendar,
  },
  {
    href: "/agent/batches",
    labelAr: "دفعات الأجور",
    sublabel: "Lots de paie",
    icon: FileSpreadsheet,
  },
  {
    href: "/agent/calculate",
    labelAr: "الاحتساب والتحقق",
    sublabel: "Calcul & Validation",
    icon: Calculator,
  },
];

export function AgentSidebar({ user }: AgentSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link
          href="/agent/dashboard"
          className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-blue-600 to-slate-800 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
            U
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">UNI-PAY</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                أجور
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[160px]">
              {user.organizationName}
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          مساحة عمل الأجور
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                <div className="text-right">
                  <div className="leading-tight">{item.labelAr}</div>
                  <div className={`text-[10px] ${active ? "text-teal-100" : "text-slate-500"}`}>
                    {item.sublabel}
                  </div>
                </div>
              </div>
              <ChevronLeft className={`w-3.5 h-3.5 ${active ? "text-white" : "text-slate-600"}`} />
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2.5 overflow-hidden mb-3">
          <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-700/50 flex items-center justify-center text-teal-300 font-bold text-xs shrink-0">
            {user.firstName[0]}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <span className="text-[10px] text-teal-400 font-medium">{user.roleNameAr}</span>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-950/40 border border-red-900/60 hover:bg-red-900/60 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white cursor-pointer"
            aria-label="فتح القائمة الرئيسية"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm tracking-tight text-white">
            UNI-PAY — الأجور
          </span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-900/70 text-teal-300 border border-teal-700/50">
          {user.roleNameAr}
        </span>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 border-l border-slate-800 min-h-screen sticky top-0 h-screen">
        {navContent}
      </aside>
    </>
  );
}
