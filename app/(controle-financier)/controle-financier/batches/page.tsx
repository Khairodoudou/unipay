import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import {
  ControleurBatchesTable,
  SerializedControleurBatch,
} from "@/components/controle-financier/batches/ControleurBatchesTable";

export const metadata: Metadata = {
  title: "جداول الرواتب — الرقابة المالية — أكاديميا شفاف",
  description: "متابعة ودراسة التأشيرات المالية لجداول الرواتب مع أدوات التصفية والبحث المتقدم",
};

export default async function ControleurBatchesPage() {
  const user = await requireRole(["CONTROLEUR_FINANCIER", "ADMIN"]);

  const batches = await prisma.payrollBatch.findMany({
    where: {
      organizationId: user.organizationId,
      period: { year: { gte: 2024, lte: 2035 } },
    },
    include: {
      period: true,
      records: { select: { grossAmount: true, netAmount: true } },
      _count: { select: { employees: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Collect available unique years
  const yearSet = new Set<number>();
  batches.forEach((b) => {
    if (b.period?.year) yearSet.add(b.period.year);
  });
  if (yearSet.size === 0) [2025, 2026, 2027, 2028, 2029].forEach((y) => yearSet.add(y));
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // Serialize batches
  const serializedBatches: SerializedControleurBatch[] = batches.map((b) => ({
    id: b.id,
    label: b.label,
    versionNumber: b.versionNumber ?? 1,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    period: {
      id: b.period.id,
      month: b.period.month,
      year: b.period.year,
      label: b.period.label,
    },
    employeeCount: b._count.employees,
    totalGross: b.records.reduce((sum, r) => sum + Number(r.grossAmount ?? 0), 0),
    totalNet: b.records.reduce((sum, r) => sum + Number(r.netAmount ?? 0), 0),
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            دفعات الأجور للرقابة المالية
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            سجل الجداول ومسار دراسة التأشيرات المالية المسبقة (Visas préalables)
          </p>
        </div>

        <div className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg self-start md:self-auto">
          إجمالي الدفعات: {batches.length} دفعة
        </div>
      </div>

      <ControleurBatchesTable
        batches={serializedBatches}
        availableYears={availableYears}
      />
    </div>
  );
}
