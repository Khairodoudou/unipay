import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireSuperAdmin } from "@/lib/tenant/context";
import { AuditFilterBar } from "@/components/super-admin/audit/AuditFilterBar";
import {
  ScrollText,
  Clock,
  Building2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface CentralAuditLogsPageProps {
  searchParams: Promise<{
    page?: string;
    orgId?: string;
    action?: string;
    q?: string;
  }>;
}

const PAGE_SIZE = 25;

export default async function CentralAuditLogsPage(props: CentralAuditLogsPageProps) {
  await requireSuperAdmin();
  const searchParams = await props.searchParams;

  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const orgId = searchParams.orgId || "ALL";
  const action = searchParams.action || "ALL";
  const q = searchParams.q?.trim() || "";

  // Construction du filtre Prisma
  const where: Record<string, unknown> = {};

  if (orgId === "CENTRAL") {
    where.organizationId = null;
  } else if (orgId && orgId !== "ALL") {
    where.organizationId = orgId;
  }

  if (action && action !== "ALL") {
    where.action = action;
  }

  if (q) {
    where.OR = [
      { user: { email: { contains: q } } },
      { user: { firstName: { contains: q } } },
      { user: { lastName: { contains: q } } },
      { details: { contains: q } },
      { action: { contains: q } },
    ];
  }

  const [logs, totalCount, organizations] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.organization.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <ScrollText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              سجل التدقيق والرقابة المركزية الوطنية
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل غير قابل للتعديل (Immutable Audit Log) لجميع العمليات الحساسة عبر الجامعات والمنظومة المركزية
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <AuditFilterBar organizations={organizations} />

      {/* Results summary & Pagination header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          إجمالي السجلات: <strong className="text-slate-900 font-bold">{totalCount}</strong> عملية
          مؤرشفة (الصفحة {page} من {totalPages})
        </span>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4">نوع العملية</th>
                <th className="py-3 px-4">المؤسسة الجامعية</th>
                <th className="py-3 px-4">المستخدم الفاعل</th>
                <th className="py-3 px-4">عنوان IP</th>
                <th className="py-3 px-4">التفاصيل التوثيقية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد سجلات تدقيق مطابقة لمعايير البحث.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let parsedDetails: Record<string, unknown> | null = null;
                  if (log.details) {
                    try {
                      parsedDetails = JSON.parse(log.details);
                    } catch {
                      parsedDetails = { raw: log.details };
                    }
                  }

                  const isWarn = log.action.includes("FAILED") || log.action.includes("SUSPENDED") || log.action.includes("REJECTED");
                  const isSuccess = log.action.includes("SUCCESS") || log.action.includes("APPROVED") || log.action.includes("CREATED");

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString("fr-DZ")}
                          </span>
                          <span className="text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString("fr-DZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            isWarn
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : isSuccess
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* University / Organization */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.organization ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-semibold text-slate-800">
                              {log.organization.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-indigo-600 font-bold text-[11px]">
                            المنصة المركزية
                          </span>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.user ? (
                          <div>
                            <p className="font-bold text-slate-800">
                              {log.user.firstName} {log.user.lastName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {log.user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            النظام التلقائي
                          </span>
                        )}
                      </td>

                      {/* IP */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.ipAddress || "—"}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs truncate">
                        {parsedDetails ? (
                          <span className="font-mono text-slate-700">
                            {JSON.stringify(parsedDetails).slice(0, 70)}
                            {JSON.stringify(parsedDetails).length > 70 ? "..." : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              {page > 1 ? (
                <Link
                  href={`/super-admin/audit-logs?page=${page - 1}&orgId=${orgId}&action=${action}&q=${q}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الصفحة السابقة</span>
                </Link>
              ) : (
                <div />
              )}
            </div>

            <span className="text-slate-500">
              الصفحة {page} من {totalPages}
            </span>

            <div>
              {page < totalPages ? (
                <Link
                  href={`/super-admin/audit-logs?page=${page + 1}&orgId=${orgId}&action=${action}&q=${q}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  <span>الصفحة التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
