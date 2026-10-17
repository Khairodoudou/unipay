import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Download,
  Bell,
  ArrowUpRight,
  ShieldCheck,
  Building,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getEmployeeDashboardStats } from "@/lib/employe/employe-service";

export const metadata: Metadata = {
  title: "لوحة التحكم — فضاء الموظف — UNI-PAY",
  description: "الاطلاع على كشوف الراتب والملف الإداري الشخصي لمنصة UNI-PAY",
};

export default async function EmployeDashboardPage() {
  const stats = await getEmployeeDashboardStats();

  return (
    <div className="space-y-6">
      {/* ── 1. BANNIÈRE DE BIENVENUE ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>فضاء شخصي آمن ومشفّر</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              مرحباً بك، {stats.employeeName}
            </h1>
            <p className="text-sm text-slate-600 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="w-4 h-4 text-slate-400" />
                رقم التسجيل: <strong className="font-mono text-slate-800">{stats.matricule}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-400" />
                {stats.position}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/employe/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>ملفي الشخصي</span>
            </Link>
            <Link
              href="/employe/payslips"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>كل كشوف الراتب</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. CARTES D'INDICATEURS RÉELS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Carte 1 : Dernier Salaire Net */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                آخر راتب صافي معتمد
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            {stats.latestPayslip ? (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {stats.latestPayslip.netAmount.toLocaleString("fr-DZ", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  <span className="text-sm font-bold text-slate-500">د.ج</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  فترة: {stats.latestPayslip.periodLabel}
                </p>
              </>
            ) : (
              <div className="py-2">
                <p className="text-sm font-medium text-slate-500">
                  لا توجد كشوف راتب منشورة حالياً
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  تظهر الكشوف فور اعتمادها المالي النهائي
                </p>
              </div>
            )}
          </div>

          {stats.latestPayslip && (
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/employe/payslips/${stats.latestPayslip.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>معاينة التفاصيل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href={`/api/employe/payslips/${stats.latestPayslip.id}/pdf`}
                download
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>تحميل PDF</span>
              </a>
            </div>
          )}
        </div>

        {/* Carte 2 : Total Bulletins Disponibles */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                كشوف الراتب المتاحة
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.totalPayslipsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              كشوف معتمدة وقابلة للتحميل والطباعة
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href="/employe/payslips"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>تصفح الأرشيف الكامل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Carte 3 : Notifications non lues */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                التنبيهات الجديدة
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.unreadNotificationsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              إشعارات إتاحة كشوف الراتب والتحديثات
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href="/employe/notifications"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>عرض الإشعارات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. DERNIER BULLETIN EN VEDETTE OU ÉTAT VIDE ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>آخر كشف راتب صادر</span>
          </h2>
          {stats.latestPayslip && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>متاح للصرف والتحميل</span>
            </span>
          )}
        </div>

        {stats.latestPayslip ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-900">
                كشف راتب شهر {stats.latestPayslip.periodLabel}
              </p>
              <p className="text-xs text-slate-500">
                تاريخ الاعتماد المالي:{" "}
                {new Date(stats.latestPayslip.calculatedAt).toLocaleDateString("ar-DZ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <span className="text-xs text-slate-500 block">الصافي للدفع</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {stats.latestPayslip.netAmount.toLocaleString("fr-DZ", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  د.ج
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/employe/payslips/${stats.latestPayslip.id}`}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                >
                  معاينة الكشف
                </Link>
                <a
                  href={`/api/employe/payslips/${stats.latestPayslip.id}/pdf`}
                  download
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل PDF</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-800">
                لا توجد كشوف راتب معتمدة ومتاحة حالياً
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تظهر كشوف الراتب في فضائك الشخصي بمجرد استكمال مسار المصادقة والتأشيرة المالية الرسمية (AUTHORIZED).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
