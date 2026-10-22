import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireSuperAdmin } from "@/lib/tenant/context";
import {
  Building2,
  Users,
  FileSpreadsheet,
  ShieldCheck,
  PlusCircle,
  ArrowUpRight,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Landmark,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin();

  // Statistiques globales agrégées au niveau national
  const [
    totalUniversities,
    activeUniversities,
    suspendedUniversities,
    archivedUniversities,
    totalEmployees,
    totalBatches,
    totalAdmins,
    recentUniversities,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.organization.count({ where: { status: "SUSPENDED" } }),
    prisma.organization.count({ where: { status: "ARCHIVED" } }),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.payrollBatch.count(),
    prisma.user.count({
      where: {
        role: { code: "ADMIN" },
        isActive: true,
      },
    }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        _count: {
          select: {
            employees: true,
            batches: true,
            units: true,
            users: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Landmark className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              لوحة المؤشرات الوطنية المركزية
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            المنظومة الرقمية الموحدة لحوكمة ومتابعة أجور التعليم العالي والبحث العلمي
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/super-admin/universities/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all focus-ring"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل جامعة جديدة</span>
          </Link>
          <Link
            href="/super-admin/universities"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-all focus-ring"
          >
            <span>عرض الدليل الكامل</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Universities */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              المؤسسات الجامعية المسجلة
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {totalUniversities}
            </span>
            <span className="text-xs text-slate-400 font-medium">مؤسسة</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeUniversities} نشطة
            </span>
            {suspendedUniversities > 0 && (
              <span className="text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {suspendedUniversities} معلقة
              </span>
            )}
            {archivedUniversities > 0 && (
              <span className="text-slate-500">{archivedUniversities} مؤرشفة</span>
            )}
          </div>
        </div>

        {/* National Employees */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              الموظفون والأساتذة (وطنياً)
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {totalEmployees.toLocaleString("fr-DZ")}
            </span>
            <span className="text-xs text-slate-400 font-medium">موظف نشط</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>موزعون عبر الجامعات والمراكز</span>
          </div>
        </div>

        {/* Total Payroll Batches */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              مسيرات الأجور المعالجة
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {totalBatches}
            </span>
            <span className="text-xs text-slate-400 font-medium">دفعة أجور</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>معالجة بتأشيرات رقابية رسمية</span>
          </div>
        </div>

        {/* University Administrators */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              مديرو الأنظمة المحليون
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {totalAdmins}
            </span>
            <span className="text-xs text-slate-400 font-medium">حساب مسؤول</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>إدارة صلاحيات كل جامعة بشكل معزول</span>
          </div>
        </div>
      </div>

      {/* Main Content: Universities Registry Preview & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Universities List Card (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                المؤسسات الجامعية المسجلة
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                أحدث الجامعات المنضمة إلى المنظومة المركزية
              </p>
            </div>
            <Link
              href="/super-admin/universities"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              <span>عرض الكل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentUniversities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد مؤسسات جامعية مسجلة بعد.
              </div>
            ) : (
              recentUniversities.map((uni) => (
                <div
                  key={uni.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center font-bold text-xs text-indigo-800 shrink-0">
                      {uni.code.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/super-admin/universities/${uni.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-indigo-600 truncate transition-colors"
                        >
                          {uni.name}
                        </Link>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                          {uni.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                        <span>ولاية {uni.wilaya}</span>
                        <span>•</span>
                        <span>{uni._count.employees} موظف</span>
                        <span>•</span>
                        <span>{uni._count.batches} دفعة</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        uni.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : uni.status === "SUSPENDED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {uni.status === "ACTIVE"
                        ? "نشطة"
                        : uni.status === "SUSPENDED"
                        ? "معلقة"
                        : "مؤرشفة"}
                    </span>
                    <Link
                      href={`/super-admin/universities/${uni.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      إدارة
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Central Audit Activity (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                أحدث عمليات التدقيق
              </h2>
            </div>
            <Link
              href="/super-admin/audit-logs"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              السجل
            </Link>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto">
            {recentAuditLogs.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">
                لا توجد سجلات تدقيق حتى الآن.
              </div>
            ) : (
              recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleTimeString("fr-DZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : "النظام"}
                    </span>
                    <span className="font-semibold text-indigo-700 truncate max-w-[120px]">
                      {log.organization?.code || "المركزي"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <Link
              href="/super-admin/audit-logs"
              className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors"
            >
              <span>فتح سجل الرقابة الوطنية بالكامل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
