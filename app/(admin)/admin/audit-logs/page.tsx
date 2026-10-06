import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { ScrollText, ShieldAlert, User, Clock, Search } from "lucide-react";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "سجل التدقيق والرقابة — UNI-PAY",
  description: "سجل شامل لجميع الأحداث الإدارية والأمنية في منصة UNI-PAY",
};

interface AuditLogsPageProps {
  searchParams: Promise<{
    action?: string;
    search?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, { labelAr: string; color: string }> = {
  LOGIN_SUCCESS: { labelAr: "دخول ناجح", color: "bg-green-100 text-green-700 border-green-200" },
  LOGIN_FAILED: { labelAr: "محاولة دخول فاشلة", color: "bg-red-100 text-red-700 border-red-200" },
  LOGOUT: { labelAr: "تسجيل خروج", color: "bg-slate-100 text-slate-600 border-slate-200" },
  SESSION_REVOKED: { labelAr: "إلغاء جلسة", color: "bg-orange-100 text-orange-700 border-orange-200" },
  ACCOUNT_LOCKED: { labelAr: "حساب مقفل", color: "bg-red-100 text-red-800 border-red-300" },
  ACCESS_DENIED: { labelAr: "رفض الوصول", color: "bg-red-100 text-red-700 border-red-200" },
  USER_CREATED: { labelAr: "إنشاء مستخدم", color: "bg-teal-100 text-teal-700 border-teal-200" },
  USER_UPDATED: { labelAr: "تعديل مستخدم", color: "bg-blue-100 text-blue-700 border-blue-200" },
  USER_ROLE_CHANGED: { labelAr: "تغيير دور المستخدم", color: "bg-purple-100 text-purple-700 border-purple-200" },
  USER_ENABLED: { labelAr: "تفعيل حساب", color: "bg-green-100 text-green-700 border-green-200" },
  USER_DISABLED: { labelAr: "تعطيل حساب", color: "bg-orange-100 text-orange-700 border-orange-200" },
  USER_PASSWORD_RESET: { labelAr: "إعادة تعيين كلمة المرور", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  ROLE_PERMISSIONS_UPDATED: { labelAr: "تعديل صلاحيات الدور", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  ORGANIZATION_UPDATED: { labelAr: "تعديل المؤسسة", color: "bg-blue-100 text-blue-700 border-blue-200" },
  ORGANIZATION_UNIT_CREATED: { labelAr: "إنشاء وحدة تنظيمية", color: "bg-teal-100 text-teal-700 border-teal-200" },
  ORGANIZATION_UNIT_UPDATED: { labelAr: "تعديل وحدة تنظيمية", color: "bg-blue-100 text-blue-700 border-blue-200" },
  SETTINGS_UPDATED: { labelAr: "تعديل إعدادات النظام", color: "bg-violet-100 text-violet-700 border-violet-200" },
  PAYROLL_RULE_CREATED: { labelAr: "إنشاء قاعدة أجور", color: "bg-teal-100 text-teal-700 border-teal-200" },
  PAYROLL_RULE_UPDATED: { labelAr: "تعديل قاعدة أجور", color: "bg-blue-100 text-blue-700 border-blue-200" },
  PAYROLL_RULE_ACTIVATED: { labelAr: "تفعيل قاعدة أجور", color: "bg-green-100 text-green-700 border-green-200" },
  PAYROLL_RULE_DEACTIVATED: { labelAr: "تعطيل قاعدة أجور", color: "bg-orange-100 text-orange-700 border-orange-200" },
  PAYROLL_RULE_VERSION_ADDED: { labelAr: "إضافة إصدار لقاعدة أجور", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
};

const SEVERITY_ACTIONS = new Set([
  "LOGIN_FAILED",
  "ACCESS_DENIED",
  "ACCOUNT_LOCKED",
  "SESSION_REVOKED",
  "USER_DISABLED",
  "USER_ROLE_CHANGED",
  "ROLE_PERMISSIONS_UPDATED",
  "USER_PASSWORD_RESET",
]);

function formatDetails(details: string | null): string {
  if (!details) return "—";
  try {
    const obj = JSON.parse(details) as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(" · ");
  } catch {
    return details;
  }
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}

// Module-level function to avoid react-hooks/purity with Date.now
function getPageQuery(page: number) {
  return { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

export default async function AdminAuditLogsPage({ searchParams }: AuditLogsPageProps) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const action = params.action?.trim() || "";
  const search = params.search?.trim() || "";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // Build Prisma filter
  const where: Prisma.AuditLogWhereInput = {};
  if (action) {
    where.action = action;
  }
  if (search) {
    where.OR = [
      { user: { email: { contains: search } } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { resourceId: { contains: search } },
    ];
  }

  const { skip, take } = getPageQuery(page);

  const [totalCount, logs, distinctActions] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        details: true,
        ipAddress: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { _all: true },
      orderBy: { _count: { action: "desc" } },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Stats
  const securityEventsCount = logs.filter((l) => SEVERITY_ACTIONS.has(l.action)).length;

  // Pagination URL builder
  function buildUrl(p: number, overrides: Record<string, string | undefined> = {}) {
    const sp = new URLSearchParams();
    const effectiveAction = overrides.action !== undefined ? overrides.action : action;
    const effectiveSearch = overrides.search !== undefined ? overrides.search : search;
    if (effectiveAction) sp.set("action", effectiveAction);
    if (effectiveSearch) sp.set("search", effectiveSearch);
    if (p > 1) sp.set("page", String(p));
    const query = sp.toString();
    return `/admin/audit-logs${query ? `?${query}` : ""}`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-teal-600" />
            <span>سجل التدقيق والرقابة</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            توثيق شامل وغير قابل للتعديل لجميع الأحداث الإدارية والأمنية
          </p>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            <Clock className="w-3 h-3" />
            {totalCount.toLocaleString("ar-DZ")} حدث
          </span>
          {securityEventsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
              <ShieldAlert className="w-3 h-3" />
              {securityEventsCount} حدث أمني (الصفحة الحالية)
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <form
        method="GET"
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            name="search"
            defaultValue={search}
            placeholder="بريد أو اسم المستخدم..."
            className="w-full text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {/* Action filter */}
        <select
          name="action"
          defaultValue={action}
          className="text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">كل الأنواع</option>
          {distinctActions.map((da) => {
            const label = ACTION_LABELS[da.action]?.labelAr || da.action;
            return (
              <option key={da.action} value={da.action}>
                {label} ({da._count._all})
              </option>
            );
          })}
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-all cursor-pointer"
        >
          تصفية
        </button>
        {(action || search) && (
          <a
            href="/admin/audit-logs"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all text-center"
          >
            إعادة تعيين
          </a>
        )}
      </form>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">لا توجد أحداث مطابقة لمعايير البحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-right">
                  <th className="px-4 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    التاريخ والوقت
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    نوع الحدث
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    المورد
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider max-w-xs">
                    التفاصيل
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action];
                  const isSecurity = SEVERITY_ACTIONS.has(log.action);

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSecurity ? "bg-red-50/30" : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        <div className="font-semibold text-slate-700">
                          {log.createdAt.toLocaleDateString("ar-DZ", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px]">
                          {log.createdAt.toLocaleTimeString("ar-DZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatRelativeTime(log.createdAt)}
                        </div>
                      </td>

                      {/* Action badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isSecurity && (
                            <ShieldAlert className="w-3 h-3 text-red-500 shrink-0" />
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                              actionInfo?.color ||
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {actionInfo?.labelAr || log.action}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 text-teal-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700 whitespace-nowrap">
                                {log.user.firstName} {log.user.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400">{log.user.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">نظام / مجهول</span>
                        )}
                      </td>

                      {/* Resource */}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {log.resourceType && (
                          <div className="font-medium text-slate-600">{log.resourceType}</div>
                        )}
                        {log.resourceId && (
                          <code className="text-[10px] text-slate-400 font-mono">
                            {log.resourceId.slice(0, 12)}…
                          </code>
                        )}
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 text-slate-500 max-w-xs">
                        <p className="truncate text-[11px]" title={log.details || ""}>
                          {formatDetails(log.details)}
                        </p>
                        {log.ipAddress && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            الصفحة {page} من {totalPages} · {totalCount.toLocaleString("ar-DZ")} حدث
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a
                href={buildUrl(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold transition-all"
              >
                السابق
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildUrl(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold transition-all"
              >
                التالي
              </a>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          دليل أنواع الأحداث
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ACTION_LABELS).map(([action, { labelAr, color }]) => (
            <span
              key={action}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${color}`}
            >
              {labelAr}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
