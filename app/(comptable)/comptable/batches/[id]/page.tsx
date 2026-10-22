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
import { validateAccountingAction, returnByAccountingAction, takeAccountingReviewAction } from "@/lib/workflow/workflow-actions";
import { TakeReviewButton } from "@/components/workflow/TakeReviewButton";
import { Receipt, BookOpenCheck, ExternalLink } from "lucide-react";

interface ComptableBatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "التأشير المحاسبي للدفعة — المحاسب المالي — UNI-PAY",
};

export default async function ComptableBatchDetailPage({
  params,
}: ComptableBatchDetailPageProps) {
  const { id } = await params;
  const user = await requireRole(["COMPTABLE", "ADMIN"]);

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      records: { select: { grossAmount: true, netAmount: true, totalDeductions: true } },
      _count: { select: { employees: true } },
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

  // Le Comptable peut agir si le statut est APPROVED_BY_DIRECTOR ou ACCOUNTING_REVIEW
  const canAct = ["APPROVED_BY_DIRECTOR", "ACCOUNTING_REVIEW"].includes(batch.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <BatchReviewHeader
        batch={{
          id: batch.id,
          versionNumber: batch.versionNumber ?? 1,
          label: batch.label,
          status: batch.status,
          period: batch.period,
          totalGross: batch.records.reduce((s, r) => s + Number(r.grossAmount ?? 0), 0),
          totalNet: batch.records.reduce((s, r) => s + Number(r.netAmount ?? 0), 0),
          totalDeductions: batch.records.reduce((s, r) => s + Number(r.totalDeductions ?? 0), 0),
          employeeCount: batch._count?.employees ?? 0,
        }}
        backHref="/comptable/batches"
        backLabel="العودة لقائمة الدفعات"
        subtitle="التأشير المحاسبي والتحقق من حسابات الأجور والتسويات"
      />

      {/* Timeline */}
      <WorkflowTimeline
        currentStatus={batch.status}
        workflowActions={batch.workflowActions}
      />

      {batch.status === "APPROVED_BY_DIRECTOR" && (
        <TakeReviewButton
          batchId={batch.id}
          action={takeAccountingReviewAction}
          label="استلام وبدء المراجعة المحاسبية"
          subtitle="صودق على هذه الدفعة من طرف مدير المؤسسة وهي الآن بانتظار التأشير المحاسبي"
          variant="emerald"
        />
      )}

      {/* Zone de décision Comptable */}
      {canAct ? (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-emerald-950">
              قرار التأشير المحاسبي (Validation Comptable)
            </h2>
          </div>
          <p className="text-xs text-emerald-800 mb-4">
            بصفتك المحاسب المالي للمؤسسة، بعد التحقق من صحة القيود المحاسبية ومطابقة الاقتطاعات، تمكّن هذه
            العملية من إحالة الجدول إلى مصالح الرقابة المالية (Contrôleur Financier).
          </p>

          <ApproveRejectForm
            batchId={batch.id}
            currentStatus={batch.status}
            approveLabel="التأشير المحاسبي والإحالة للرقابة المالية"
            rejectLabel="إعادة لمصلحة الموظفين للتصحيح"
            approveAction={validateAccountingAction}
            rejectAction={returnByAccountingAction}
          />
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center justify-between">
          <span>
            هذه الدفعة ليست في طور التأشير المحاسبي حالياً (الوضعية الحالية: <strong>{batch.status}</strong>).
          </span>
          <span className="text-slate-400 font-mono text-[11px]">للقراءة والمتابعة فقط</span>
        </div>
      )}

      {/* Accès rapide aux écritures comptables */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">جدول القيود المحاسبية المفصلة</h4>
            <p className="text-xs text-slate-500">معاينة تفاصيل الحسابات (حـ/631، حـ/635، حـ/421، حـ/431، حـ/442)</p>
          </div>
        </div>
        <Link
          href={`/comptable/batches/${batch.id}/entries`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
        >
          <span>معاينة القيود</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Synthèse Audit Findings */}
      <WorkflowAuditFindings findings={batch.auditFindings} />

      {/* Historique des décisions */}
      <BatchWorkflowSummary actions={batch.workflowActions} />
    </div>
  );
}
