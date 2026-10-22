import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import {
  ControleurHistoryFilterView,
  SerializedControleurAction,
} from "@/components/controle-financier/history/ControleurHistoryFilterView";
import { Stamp } from "lucide-react";

export const metadata: Metadata = {
  title: "سجل التأشيرات المالية — المراقب المالي — UNI-PAY",
  description: "تتبع زمني لكافة التأشيرات والقرارات المالية مع أدوات التصفية والبحث المتقدم",
};

export default async function ControleurHistoryPage() {
  const user = await requireRole(["CONTROLEUR_FINANCIER", "ADMIN"]);

  const actions = await prisma.workflowAction.findMany({
    where: {
      batch: {
        organizationId: user.organizationId,
        period: { year: { gte: 2024, lte: 2035 } },
      },
    },
    include: {
      actor: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: { select: { code: true, nameAr: true } },
        },
      },
      batch: {
        select: {
          id: true,
          label: true,
          period: { select: { month: true, year: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Extract available years
  const yearSet = new Set<number>();
  actions.forEach((a) => {
    if (a.batch?.period?.year) yearSet.add(a.batch.period.year);
  });
  if (yearSet.size === 0) [2025, 2026, 2027, 2028, 2029].forEach((y) => yearSet.add(y));
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // Serialize actions
  const serializedActions: SerializedControleurAction[] = actions.map((a) => ({
    id: a.id,
    action: a.action,
    fromStatus: a.fromStatus,
    toStatus: a.toStatus,
    reason: a.reason,
    createdAt: a.createdAt.toISOString(),
    actor: {
      name:
        a.actor.firstName && a.actor.lastName
          ? `${a.actor.firstName} ${a.actor.lastName}`
          : a.actor.firstName || a.actor.email,
      email: a.actor.email,
      roleCode: a.actor.role?.code || "",
      roleNameAr: a.actor.role?.nameAr || a.actor.role?.code || "",
    },
    batch: {
      id: a.batch.id,
      label: a.batch.label,
      periodMonth: a.batch.period?.month ?? null,
      periodYear: a.batch.period?.year ?? null,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Stamp className="w-5 h-5 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              سجل التأشيرات والقرارات المالية
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            تتبع زمني لكافة التأشيرات الممنوحة (Visas) وقرارات الرفض مع أسبابها القانونية
          </p>
        </div>

        <div className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg self-start md:self-auto">
          إجمالي الإجراءات: {actions.length}
        </div>
      </div>

      <ControleurHistoryFilterView
        actions={serializedActions}
        availableYears={availableYears}
      />
    </div>
  );
}
