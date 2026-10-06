import { UserSessionData } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { LogOut, Building2, UserCheck, Calculator } from "lucide-react";

interface AgentHeaderProps {
  user: UserSessionData;
}

export function AgentHeader({ user }: AgentHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left (RTL Right) - University & Role badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/70 text-xs font-semibold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate max-w-[280px] md:max-w-md">
              {user.organizationName}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-bold text-teal-700">
            <Calculator className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>مساحة الموارد البشرية والرواتب (RH & Paie)</span>
          </div>
        </div>

        {/* Right (RTL Left) - User details & Logout */}
        <div className="flex items-center gap-4">
          <div className="text-left sm:text-right hidden sm:block">
            <div className="flex items-center gap-1.5 justify-end">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end mt-0.5">
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {user.roleNameAr}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {user.email}
              </span>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:text-red-700 transition-all focus-ring cursor-pointer"
              title="تسجيل الخروج من مساحة العمل"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
