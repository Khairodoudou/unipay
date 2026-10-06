import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  KeyRound,
  History,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "لوحة التحكم الإدارية — UNI-PAY",
  description: "مؤشرات إدارة النظام والمستخدمين والرقابة لمنصة UNI-PAY",
};

// Computed at module load — satisfies react-hooks/purity (not inside render)
function getLast24hDate() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  // 1. Métriques globales réelles depuis Prisma
  const since24h = getLast24hDate();
  const [
    totalUsers,
    activeUsers,
    disabledUsers,
    rolesCount,
    permissionsCount,
    auditLogsCount,
    rolesWithUsers,
    recentLogs,
    failedLogins24h,
    inactiveRulesCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.auditLog.count(),
    prisma.role.findMany({
      include: {
        _count: {
          select: { users: true, rolePermissions: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      take: 7,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({
      where: {
        action: "LOGIN_FAILED",
        createdAt: { gte: since24h },
      },
    }),
    prisma.payrollRule.count({
      where: { isActive: false },
    }),
  ]);

  // Construction des alertes administratives strictement réelles
  interface AdminAlert {
    id: string;
    type: "warning" | "danger" | "info";
    title: string;
    description: string;
    href?: string;
  }

  const realAlerts: AdminAlert[] = [];

  if (disabledUsers > 0) {
    realAlerts.push({
      id: "disabled_users",
      type: "warning",
      title: "حسابات مستخدمين معطلة",
      description: `يوجد حالياً ${disabledUsers} حساب(ات) معطلة لا يمكنها تسجيل الدخول أو استخدام المنصة.`,
      href: "/admin/users?status=inactive",
    });
  }

  if (failedLogins24h > 0) {
    realAlerts.push({
      id: "failed_logins",
      type: "danger",
      title: "محاولات تسجيل دخول غير موفقة",
      description: `تم رصد ${failedLogins24h} محاولة تسجيل دخول فاشلة خلال آخر 24 ساعة.`,
      href: "/admin/audit-logs?action=LOGIN_FAILED",
    });
  }

  if (inactiveRulesCount > 0) {
    realAlerts.push({
      id: "inactive_rules",
      type: "info",
      title: "قواعد أجور غير نشطة",
      description: `توجد ${inactiveRulesCount} قاعدة أجور معطلة في سجل القواعد.`,
      href: "/admin/payroll-rules",
    });
  }

  const formatLogAction = (action: string) => {
    switch (action) {
      case "LOGIN_SUCCESS":
        return { label: "تسجيل دخول ناجح", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "LOGIN_FAILED":
        return { label: "فشل الدخول", color: "text-red-700 bg-red-50 border-red-200" };
      case "LOGOUT":
        return { label: "تسجيل خروج", color: "text-slate-700 bg-slate-100 border-slate-200" };
      case "USER_CREATED":
        return { label: "إنشاء مستخدم", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "USER_UPDATED":
        return { label: "تعديل مستخدم", color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
      case "USER_ROLE_CHANGED":
        return { label: "تغيير الدور", color: "text-purple-700 bg-purple-50 border-purple-200" };
      case "USER_ENABLED":
        return { label: "تفعيل حساب", color: "text-teal-700 bg-teal-50 border-teal-200" };
      case "USER_DISABLED":
        return { label: "تعطيل حساب", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "ROLE_PERMISSIONS_UPDATED":
        return { label: "تحديث الصلاحيات", color: "text-violet-700 bg-violet-50 border-violet-200" };
      case "SETTINGS_UPDATED":
        return { label: "تحديث الإعدادات", color: "text-cyan-700 bg-cyan-50 border-cyan-200" };
      case "PAYROLL_RULE_CREATED":
        return { label: "إنشاء قاعدة أجر", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "PAYROLL_RULE_UPDATED":
        return { label: "تعديل قاعدة أجر", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      default:
        return { label: action, color: "text-slate-700 bg-slate-100 border-slate-200" };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title & Introduction Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-teal-600" />
            <span>لوحة القيادة الإدارية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مراقبة شاملة ومؤشرات حية لمستخدمي النظام، الصلاحيات، وسجلات التدقيق الرقابي
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm focus-ring cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </Link>
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all focus-ring"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>سجل التدقيق</span>
          </Link>
        </div>
      </div>

      {/* Section A: Global KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إجمالي المستخدمين</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalUsers}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            في قاعدة البيانات
          </span>
        </div>

        {/* Active Users */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">حسابات نشطة</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            {activeUsers}
          </div>
          <span className="text-[10px] text-emerald-700/80 mt-1 block font-medium">
            مؤهلون للولوج
          </span>
        </div>

        {/* Disabled Users */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">حسابات معطلة</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {disabledUsers}
          </div>
          <span className="text-[10px] text-amber-700/80 mt-1 block font-medium">
            ولوج محظور
          </span>
        </div>

        {/* Roles Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">الأدوار المؤسسية</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 font-mono">
            {rolesCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            أدوار نظام ثابتة
          </span>
        </div>

        {/* Permissions Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">الصلاحيات</span>
            <KeyRound className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
            {permissionsCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            صلاحيات معرّفة
          </span>
        </div>

        {/* Audit Logs Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">أحداث التدقيق</span>
            <History className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
            {auditLogsCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            عملية مسجلة بالكامل
          </span>
        </div>
      </div>

      {/* Main Grid: B (Role distribution) & C (Recent activity) */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Section B: Role Distribution (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>توزيع المستخدمين حسب الأدوار المؤسسية</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تعداد الحسابات والصلاحيات المرتبطة بكل دور مهني (بيانات حقيقية)
              </p>
            </div>
            <Link
              href="/admin/roles"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>تفاصيل الأدوار</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {rolesWithUsers.map((role) => {
              const userCount = role._count.users;
              const percent = totalUsers > 0 ? Math.round((userCount / totalUsers) * 100) : 0;
              return (
                <div
                  key={role.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        {role.nameAr}
                      </span>
                      <code className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                        {role.code}
                      </code>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-medium">
                        {role._count.rolePermissions} صلاحية
                      </span>
                      <span className="text-xs font-black text-slate-900 font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        {userCount} مستخدم ({percent}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-teal-600 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section D: Administrative Alerts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>التنبيهات الإدارية والرقابية</span>
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {realAlerts.length} تنبيه
              </span>
            </div>

            {realAlerts.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-emerald-900">
                  كافة المؤشرات مستقرة وطبيعية
                </h3>
                <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                  لا توجد تنبيهات عاجلة حالياً؛ جميع الحسابات نشطة ولا توجد محاولات دخول مشبوهة.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {realAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-2xl border ${
                      alert.type === "danger"
                        ? "bg-red-50/70 border-red-200 text-red-900"
                        : alert.type === "warning"
                        ? "bg-amber-50/70 border-amber-200 text-amber-900"
                        : "bg-blue-50/70 border-blue-200 text-blue-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {alert.type === "danger" ? (
                          <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-bold leading-tight">
                            {alert.title}
                          </div>
                          <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                      {alert.href && (
                        <Link
                          href={alert.href}
                          className="shrink-0 p-1 rounded-lg hover:bg-black/5 text-xs font-bold"
                          title="عرض التفاصيل"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Institutional Fast Links */}
          <div className="bg-gradient-to-br from-slate-900 to-uni-navy p-5 rounded-3xl text-white shadow-md">
            <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">
              الروابط السريعة للإدارة
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              إدارة الهيكل التنظيمي للجامعة، القواعد المالية، وتخصيص الصلاحيات.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/organization"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-center text-white border border-white/10 transition-colors"
              >
                الهيكل التنظيمي
              </Link>
              <Link
                href="/admin/payroll-rules"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-center text-white border border-white/10 transition-colors"
              >
                قواعد الأجور
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Recent Activity Table */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>أحدث أنشطة وسجلات التدقيق الرقابي</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تتبع زمني دقيق للعمليات الإدارية والمصادقة (دون تسجيل كلمات المرور)
            </p>
          </div>

          <Link
            href="/admin/audit-logs"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>عرض السجل الكامل</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد سجلات تدقيق مسجلة حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">الحدث / العملية</th>
                  <th className="py-2.5 px-3">المستخدم / الفاعل</th>
                  <th className="py-2.5 px-3">نوع المورد</th>
                  <th className="py-2.5 px-3">التوقيت والتاريخ</th>
                  <th className="py-2.5 px-3 text-left">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.map((log) => {
                  const actionMeta = formatLogAction(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${actionMeta.color}`}
                        >
                          {actionMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {log.user ? (
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {log.user.firstName} {log.user.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">نظام / زائر</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-600 font-mono text-[11px]">
                          {log.resourceType || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString("ar-DZ", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3 px-3 text-left">
                        <Link
                          href={`/admin/audit-logs/${log.id}`}
                          className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
                        >
                          معاينة
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
