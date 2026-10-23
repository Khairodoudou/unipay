import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import {
  DirecteurReportsFilterView,
  SerializedReportBatch,
} from "@/components/directeur/reports/DirecteurReportsFilterView";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "التقارير والمؤشرات المالية — مدير المؤسسة — أكاديميا شفاف",
  description: "مؤشرات كتلة الأجور، التطور الشهري، واقتطاعات الضمان الاجتماعي والضريبة مع أدوات التصفية والتحليل",
};

export default async function DirecteurReportsPage() {
  const user = await requireRole(["DIRECTEUR", "ADMIN"]);

  const batches = await prisma.payrollBatch.findMany({
    where: {
      organizationId: user.organizationId,
      period: { year: { gte: 2024, lte: 2035 } },
    },
    include: {
      period: true,
      records: {
        select: { grossAmount: true, netAmount: true, totalDeductions: true },
      },
      _count: { select: { employees: true } },
    },
    orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }],
  });

  // Extract unique years (already server-filtered to 2024-2035)
  const yearSet = new Set<number>();
  batches.forEach((b) => {
    if (b.period?.year) yearSet.add(b.period.year);
  });
  // Always include current and near-future years as defaults
  if (yearSet.size === 0) {
    [2025, 2026, 2027, 2028, 2029].forEach((y) => yearSet.add(y));
  }
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // Convert Decimals to numbers
  const serializedBatches: SerializedReportBatch[] = batches.map((b) => {
    const grossAmount = b.records.reduce((sum, r) => sum + Number(r.grossAmount ?? 0), 0);
    const netAmount = b.records.reduce((sum, r) => sum + Number(r.netAmount ?? 0), 0);
    const totalDeductions = b.records.reduce((sum, r) => sum + Number(r.totalDeductions ?? 0), 0);

    return {
      id: b.id,
      label: b.label,
      versionNumber: b.versionNumber ?? 1,
      status: b.status,
      month: b.period.month,
      year: b.period.year,
      periodLabel: b.period.label,
      employeeCount: b._count.employees,
      grossAmount,
      netAmount,
      totalDeductions,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              التقارير والمؤشرات المالية للإدارة
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            مؤشرات إجمالية لكتلة الأجور، التطور الشهري، واقتطاعات الضمان الاجتماعي والضريبة مع إمكانية التصفية وتصدير البيانات
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl self-start md:self-auto">
          إجمالي الفترات المسجلة: <strong className="font-mono text-slate-900">{batches.length}</strong>
        </div>
      </div>

      {/* Filter View with dynamic KPIs and Table */}
      <DirecteurReportsFilterView
        batches={serializedBatches}
        availableYears={availableYears}
      />
    </div>
  );
}
