import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import {
  ComptableHistoryFilterView,
  SerializedComptableAction,
} from "@/components/comptable/history/ComptableHistoryFilterView";
import { History } from "lucide-react";

export const metadata: Metadata = {
  title: "سجل العمليات المحاسبية — المحاسب المالي — أكاديميا شفاف",
  description: "تتبع زمني لكافة التأشيرات والقرارات المحاسبية مع أدوات التصفية والبحث",
};

export default async function ComptableHistoryPage() {
  const user = await requireRole(["COMPTABLE", "ADMIN"]);

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
    take: 150,
  });

  // Unique valid years
  const yearSet = new Set<number>();
  actions.forEach((act) => { if (act.batch?.period?.year) yearSet.add(act.batch.period.year); });
  if (yearSet.size === 0) [2025, 2026, 2027, 2028, 2029].forEach((y) => yearSet.add(y));
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // Serialize
  const serializedActions: SerializedComptableAction[] = actions.map((act) => ({
    id: act.id,
    action: act.action,
    fromStatus: act.fromStatus,
    toStatus: act.toStatus,
    reason: act.reason ?? null,
    createdAt: act.createdAt.toISOString(),
    actor: {
      name: act.actor.firstName && act.actor.lastName
        ? `${act.actor.firstName} ${act.actor.lastName}`
        : act.actor.firstName || act.actor.email,
      email: act.actor.email,
      roleCode: act.actor.role?.code ?? "USER",
      roleNameAr: act.actor.role?.nameAr ?? act.actor.role?.code ?? "مستخدم",
    },
    batch: {
      id: act.batch.id,
      label: act.batch.label ?? null,
      periodMonth: act.batch.period?.month ?? null,
      periodYear: act.batch.period?.year ?? null,
    },
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              سجل التأشيرات والقرارات المحاسبية
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            تتبع زمني وفحص دقيق لكافة عمليات التحقق والتأشير المحاسبي وإعادات التصحيح
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl self-start md:self-auto">
          إجمالي الإجراءات: <strong className="font-mono text-slate-900">{actions.length}</strong>
        </div>
      </div>

      {/* Interactive Filter View */}
      <ComptableHistoryFilterView actions={serializedActions} availableYears={availableYears} />
    </div>
  );
}

