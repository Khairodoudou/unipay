import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { ChefBatchesTable, SerializedBatch } from "@/components/chef/batches/ChefBatchesTable";

export const metadata: Metadata = {
  title: "دفعات الأجور — رئيس المصلحة — أكاديميا شفاف",
  description: "قائمة وتصفية دفعات الأجور للمراجعة والمصادقة",
};

export default async function ChefBatchesPage() {
  const user = await requireRole(["CHEF_SERVICE", "ADMIN"]);

  const batches = await prisma.payrollBatch.findMany({
    where: {
      organizationId: user.organizationId,
      period: { year: { gte: 2024, lte: 2035 } },
    },
    include: {
      period: true,
      records: {
        select: { grossAmount: true, netAmount: true },
      },
      _count: { select: { employees: true } },
      workflowActions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          actor: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Collect available unique years (server-filtered to 2024-2035)
  const yearSet = new Set<number>();
  batches.forEach((b) => {
    if (b.period?.year) yearSet.add(b.period.year);
  });
  if (yearSet.size === 0) {
    [2025, 2026, 2027, 2028, 2029].forEach((y) => yearSet.add(y));
  }
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // Convert Prisma Decimal and Date objects into plain serializable data
  const serializedBatches: SerializedBatch[] = batches.map((b) => {
    const totalGross = b.records.reduce((sum, r) => sum + Number(r.grossAmount ?? 0), 0);
    const totalNet = b.records.reduce((sum, r) => sum + Number(r.netAmount ?? 0), 0);
    const lastAction = b.workflowActions[0] || null;

    let actorName = "—";
    if (lastAction?.actor) {
      if (lastAction.actor.firstName && lastAction.actor.lastName) {
        actorName = `${lastAction.actor.firstName} ${lastAction.actor.lastName}`;
      } else {
        actorName = lastAction.actor.firstName || lastAction.actor.email;
      }
    }

    return {
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
      totalGross,
      totalNet,
      lastAction: lastAction
        ? {
            action: lastAction.action,
            actorName,
            actorEmail: lastAction.actor.email,
            createdAt: lastAction.createdAt.toISOString(),
          }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            دفعات الأجور للمؤسسة
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            متابعة وتصفية كافة جداول الرواتب والتحقق من وضعيات المصادقة والتدقيق
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl">
            إجمالي الدفعات المسجلة: <strong className="font-mono text-slate-900">{batches.length}</strong>
          </span>
        </div>
      </div>

      {/* Interactive Filter & Batches Table */}
      <ChefBatchesTable
        batches={serializedBatches}
        availableYears={availableYears}
      />
    </div>
  );
}
