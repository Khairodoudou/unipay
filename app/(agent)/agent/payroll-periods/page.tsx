import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { PeriodClient } from "@/components/agent/payroll/PeriodClient";
import { PeriodFilterBar } from "@/components/agent/payroll/PeriodFilterBar";
import {
  Calendar,
  ArrowUpRight,
  Clock,
  Lock,
  Play,
  RotateCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "فترات الأجر — مساحة الموارد البشرية — أكاديميا شفاف",
  description: "إدارة الفترات الشهرية للأجور ودفعات الرواتب",
};

interface PayrollPeriodsPageProps {
  searchParams?: Promise<{
    year?: string;
    status?: string;
  }>;
}

const START_YEAR = 2026;
const END_YEAR = 2056;

// Années fiscales valides de 2026 à 2056
const availableYears = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i
);

export default async function PayrollPeriodsPage({ searchParams }: PayrollPeriodsPageProps) {
  const user = await requireRole(["AGENT_RH", "ADMIN", "SUPER_ADMIN"]);

  const params = searchParams ? await searchParams : {};
  const rawYear = params.year ? parseInt(params.year, 10) : undefined;
  const selectedYear =
    rawYear && !isNaN(rawYear) && rawYear >= START_YEAR && rawYear <= END_YEAR
      ? rawYear
      : undefined;

  const validStatuses = ["OPEN", "PROCESSING", "CLOSED", "DRAFT"];
  const selectedStatus =
    params.status && validStatuses.includes(params.status)
      ? params.status
      : undefined;

  const hasFilters = Boolean(selectedYear || selectedStatus);

  const where = {
    year: selectedYear
      ? selectedYear
      : { gte: START_YEAR, lte: END_YEAR },
    ...(selectedStatus ? { status: selectedStatus } : {}),
  };

  const batchWhere = user.roleCode === "SUPER_ADMIN" && !user.organizationId
    ? {}
    : { organizationId: user.organizationId };

  const periods = await prisma.payrollPeriod.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      batches: {
        where: batchWhere,
        orderBy: { versionNumber: "desc" },
        include: {
          _count: {
            select: { employees: true, records: true },
          },
        },
      },
    },
  });

  const periodStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Play className="w-3 h-3" />
            مفتوحة (OPEN)
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <RotateCw className="w-3 h-3" />
            قيد المعالجة (PROCESSING)
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Lock className="w-3 h-3" />
            مغلقة (CLOSED)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            مسودة (DRAFT)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
              <Calendar className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              فترات الأجر (Périodes de Paie)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة الدورات الشهرية للأجور، وإنشاء ومتابعة دفعات الأجر (Lots de Paie)
          </p>
        </div>

        <PeriodClient />
      </div>

      {/* Filter Bar (Années 2026-2056 + Statut) */}
      <PeriodFilterBar
        availableYears={availableYears}
        selectedYear={selectedYear}
        selectedStatus={selectedStatus}
        totalPeriods={periods.length}
      />

      {/* List of Periods */}
      <div className="grid grid-cols-1 gap-4">
        {periods.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            {hasFilters ? (
              <>
                <h3 className="text-base font-bold text-slate-800">
                  لا توجد فترات أجر تطابق معايير التصفية
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  جرب تغيير خيارات التصفية أو إلغاء الفلتر لعرض جميع الفترات.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Link
                    href="/agent/payroll-periods"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                  >
                    <span>عرض كل الفترات</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-800">لا توجد فترات أجر مسجلة بعد</h3>
                <p className="text-xs text-slate-500 mt-1">
                  قم بإنشاء أول فترة أجر شهرية لبدء تحضير دفعات الرواتب.
                </p>
              </>
            )}
          </div>
        ) : (
          periods.map((period) => (
            <div
              key={period.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-slate-900">
                      {period.label
                        ? period.label.replace(/\b20\d\d\b/, String(period.year))
                        : `أجر شهر ${period.month} ${period.year}`}
                    </h2>
                    {periodStatusBadge(period.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>السنة: {period.year}</span>
                    <span>•</span>
                    <span>الشهر: {period.month}</span>
                    <span>•</span>
                    <span>
                      تاريخ الإنشاء: {new Date(period.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/agent/payroll-periods/${period.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                  >
                    <span>عرض التفاصيل والدفعات</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Sub-batches in this period */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">
                  دفعات الأجر التابعة لهذه الفترة ({period.batches.length}):
                </span>

                {period.batches.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-400">
                    لم يتم إنشاء أي دفعة أجر بعد لهذه الفترة.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {period.batches.map((b) => (
                      <Link
                        key={b.id}
                        href={`/agent/batches/${b.id}`}
                        className="p-3 rounded-xl border border-slate-200/80 hover:border-teal-400 hover:bg-teal-50/20 transition-all text-xs space-y-1 group block"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 group-hover:text-teal-700">
                            دفعة v{b.versionNumber} {b.label ? `— ${b.label}` : ""}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {b.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                          <span>{b._count.employees} موظف</span>
                          <span>{b._count.records} محسوب</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
