import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { BatchReviewHeader } from "@/components/workflow/BatchReviewHeader";
import { WorkflowTimeline } from "@/components/workflow/WorkflowTimeline";
import { ApproveRejectForm } from "@/components/workflow/ApproveRejectForm";
import { BatchWorkflowSummary } from "@/components/workflow/BatchWorkflowSummary";
import { WorkflowAuditFindings } from "@/components/workflow/WorkflowAuditFindings";
import { approveByDirectorAction, returnByDirectorAction } from "@/lib/workflow/workflow-actions";
import { Crown, ExternalLink } from "lucide-react";

interface DirecteurBatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "المصادقة الإدارية على الدفعة — مدير المؤسسة — UNI-PAY",
};

export default async function DirecteurBatchDetailPage({
  params,
}: DirecteurBatchDetailPageProps) {
  const { id } = await params;
  const user = await requireRole(["DIRECTEUR", "ADMIN"]);

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      records: {
        select: {
          grossAmount: true,
          netAmount: true,
          totalDeductions: true,
        },
      },
      _count: {
        select: { employees: true },
      },
      auditFindings: {
        include: {
          employee: {
            select: {
              id: true,
              matricule: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      },
      workflowActions: {
        include: {
          actor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { code: true, nameAr: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!batch || batch.organizationId !== user.organizationId) {
    notFound();
  }

  const canAct = ["APPROVED_BY_CHEF", "DIRECTOR_REVIEW"].includes(batch.status);

  return (
    <div className="space-y-6">
      <BatchReviewHeader
        batch={batch}
        backHref="/directeur/batches"
        backLabel="العودة لقائمة الدفعات"
        subtitle="المصادقة الإدارية والتنفيذية قبل الإحالة للمصالح المالية والمحاسبية"
      />

      <WorkflowTimeline
        currentStatus={batch.status}
        workflowActions={batch.workflowActions}
      />

      {canAct ? (
        <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-purple-700" />
            <h2 className="text-base font-bold text-purple-950">
              قرار مدير المؤسسة الجامعية
            </h2>
          </div>
          <p className="text-xs text-purple-800 mb-4">
            بصفتك المسؤول الأول عن المؤسسة والآمر بالصرف، تمثل مصادقتك ترخيصاً إدارياً بإحالة كشوف الأجور
            إلى مصلحة المحاسبة والميزانية.
          </p>

          <ApproveRejectForm
            batchId={batch.id}
            currentStatus={batch.status}
            approveLabel="المصادقة الإدارية والإحالة للمحاسبة"
            rejectLabel="إعادة لمصلحة الموظفين للتصحيح"
            approveAction={approveByDirectorAction}
            rejectAction={returnByDirectorAction}
          />
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center justify-between">
          <span>
            هذه الدفعة ليست في طور مصادقة المدير حالياً (الوضعية الحالية: <strong>{batch.status}</strong>).
          </span>
          <span className="text-slate-400 font-mono text-[11px]">للقراءة والمتابعة فقط</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            تقرير التدقيق والملاحظات
          </h3>
          <Link
            href={`/directeur/batches/${batch.id}/alerts`}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 inline-flex items-center gap-1"
          >
            <span>التنبيهات العالية والحرجة</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <WorkflowAuditFindings findings={batch.auditFindings} />
      </div>

      <BatchWorkflowSummary actions={batch.workflowActions} />
    </div>
  );
}
