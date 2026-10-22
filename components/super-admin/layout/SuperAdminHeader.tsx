import { UserSessionData } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { LogOut, ShieldAlert, UserCheck, Landmark } from "lucide-react";

interface SuperAdminHeaderProps {
  user: UserSessionData;
}

export function SuperAdminHeader({ user }: SuperAdminHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Right in RTL: Institutional badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-xs font-semibold text-indigo-950">
            <Landmark className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
            <span className="font-bold">الإدارة المركزية العامة</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 hidden md:inline">
              الرقابة الوطنية الشاملة
            </span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Multi-Tenant Governance</span>
          </div>
        </div>

        {/* Left in RTL: User info & logout */}
        <div className="flex items-center gap-4">
          <div className="text-left sm:text-right hidden sm:block">
            <div className="flex items-center gap-1.5 justify-end">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end mt-0.5">
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                المدير العام للمنصة
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {user.email}
              </span>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all focus-ring cursor-pointer"
              title="تسجيل الخروج من الجلسة المركزية"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
