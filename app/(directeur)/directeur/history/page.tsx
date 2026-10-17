import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { BatchWorkflowSummary } from "@/components/workflow/BatchWorkflowSummary";
import { History } from "lucide-react";

export const metadata: Metadata = {
  title: "سجل القرارات — مدير المؤسسة — UNI-PAY",
};

export default async function DirecteurHistoryPage() {
  const user = await requireRole(["DIRECTEUR", "ADMIN"]);

  const actions = await prisma.workflowAction.findMany({
    where: {
      batch: { organizationId: user.organizationId },
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
          label: true,
          period: { select: { month: true, year: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              سجل القرارات الإدارية للمؤسسة
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            تتبع زمني لكافة قرارات المصادقة والإعادة للتصحيح الصادرة عن الإدارة والمصالح
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg self-start md:self-auto">
          إجمالي الإجراءات: {actions.length}
        </div>
      </div>

      <BatchWorkflowSummary actions={actions} />
    </div>
  );
}
