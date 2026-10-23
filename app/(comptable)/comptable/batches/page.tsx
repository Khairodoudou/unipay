import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import {
  ComptableBatchesTable,
  SerializedComptableBatch,
} from "@/components/comptable/batches/ComptableBatchesTable";
import { Receipt } from "lucide-react";

export const metadata: Metadata = {
  title: "جداول الرواتب — المحاسب المالي — أكاديميا شفاف",
  description: "مراجعة وتأشير دفعات الأجور مع أدوات التصفية والبحث المتقدم",
};

export default async function ComptableBatchesPage() {
  const user = await requireRole(["COMPTABLE", "ADMIN"]);

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

  // Unique valid years
  const yearSet = new Set<number>();
  batches.forEach((b) => { if (b.period?.year) yearSet.add(b.period.year); });
  if (yearSet.size === 0) [2025, 2026, 2027, 2028, 2029].forEach((y) => yearSet.add(y));
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // Serialize (Decimal → number, Date → string)
  const serializedBatches: SerializedComptableBatch[] = batches.map((b) => ({
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
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              دفعات الأجور للمراجعة والتأشير
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            سجل جداول الرواتب ومسار التسوية المحاسبية مع أدوات التصفية والبحث المتقدم
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl self-start md:self-auto">
          المجموع المسجل: <strong className="font-mono text-slate-900">{batches.length}</strong> دفعة
        </div>
      </div>

      {/* Interactive Filter Table */}
      <ComptableBatchesTable batches={serializedBatches} availableYears={availableYears} />
    </div>
  );
}

