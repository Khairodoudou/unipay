import { UserSessionData } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import {
  ShieldCheck,
  LogOut,
  Building2,
  CheckCircle2,
  Clock,
  KeyRound,
  BadgeAlert,
} from "lucide-react";
import Link from "next/link";

interface WorkspacePlaceholderProps {
  user: UserSessionData;
  workspaceTitleAr: string;
  roleIcon?: "admin" | "agent" | "chef" | "directeur" | "comptable" | "controleur" | "employe";
}

export function WorkspacePlaceholder({
  user,
  workspaceTitleAr,
}: WorkspacePlaceholderProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      {/* Top Institutional Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & University Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 focus-ring rounded-lg">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 via-blue-600 to-uni-navy flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                U
              </div>
              <div>
                <span className="text-base font-extrabold text-uni-navy tracking-tight leading-none block">
                  UNI-PAY
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">
                  {user.organizationName}
                </span>
              </div>
            </Link>

            <span className="h-5 w-px bg-slate-200 mx-2 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{workspaceTitleAr}</span>
            </div>
          </div>

          {/* User Profile & Logout Action */}
          <div className="flex items-center gap-3">
            <div className="text-left sm:text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
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
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50/80 border border-red-200 hover:bg-red-100 hover:text-red-700 transition-all focus-ring shadow-2xs cursor-pointer"
                title="تسجيل الخروج من المنصة"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Workspace Banner */}
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-uni-navy to-slate-900 text-white relative overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute top-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-teal-300 mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>جلسة عمل موثقة ومحمية (RBAC)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {workspaceTitleAr}
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                مرحباً بك، <span className="font-bold text-white">{user.firstName} {user.lastName}</span>. أنت الآن في فضاء العمل المخصص لدورك المؤسسي بصفتك ({user.roleNameAr}).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="block text-[11px] text-slate-400">حالة الحساب</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مفعّل ونشط
                </span>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="block text-[11px] text-slate-400">المؤسسة الجامعية</span>
                <span className="block text-xs font-bold text-white mt-1">
                  {user.organizationName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2 Verification Placeholder Card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Main Status Container (2 cols) */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    مساحة العمل قيد الإعداد للمراحل القادمة
                  </h2>
                  <p className="text-xs text-slate-500">
                    المرحلة الحالية (Phase 2) : التحقق من البنية التحتية، قواعد البيانات، والمصادقة.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                تم بنجاح إرساء البنية التحتية الصلبة لمنصة <strong className="text-uni-navy">UNI-PAY</strong>. 
                تم التحقق من هويتك المهنية وصلاحياتك المحددة وفق نظام الرقابة على الأدوار (RBAC). 
                سيتم تطوير لوحات القيادة التفاعلية والميزات التنفيذية في المراحل اللاحقة وفق دفتر الشروط.
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    معرف المستخدم (User ID)
                  </span>
                  <code className="text-xs font-mono font-bold text-slate-700 break-all">
                    {user.id}
                  </code>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    رمز الدور التقني
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {user.roleCode}
                    </code>
                    <span className="text-xs text-slate-500">({user.roleNameAr})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom info notice */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                جلسة العمل مؤمنة بملف تعريف ارتباط مشفر ومحمية ضد هجمات تزوير الطلبات عبر المواقع (CSRF/XSS).
              </span>
            </div>
          </div>

          {/* Side Permissions Card (1 col) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-teal-600" />
                  <span>الصلاحيات الممنوحة للدور</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                  {user.permissions.length} صلاحيات
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                الصلاحيات المحددة لهذا الحساب وفق قاعدة البيانات الموحدة:
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {user.permissions.map((perm) => (
                  <div
                    key={perm}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-700 flex items-center justify-between"
                  >
                    <span>{perm}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
              <BadgeAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>لا يمكن تعديل الصلاحيات إلا من قِبل مسؤول النظام.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
