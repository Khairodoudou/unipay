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
import { grantFinancialVisaAction, returnByFinancialAction, takeFinancialControlAction } from "@/lib/workflow/workflow-actions";
import { TakeReviewButton } from "@/components/workflow/TakeReviewButton";
import { Stamp, ExternalLink, FileCheck } from "lucide-react";

interface ControleurBatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "منح التأشيرة المالية — المراقب المالي — أكاديميا شفاف",
};

export default async function ControleurBatchDetailPage({
  params,
}: ControleurBatchDetailPageProps) {
  const { id } = await params;
  const user = await requireRole(["CONTROLEUR_FINANCIER", "ADMIN"]);

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

  // Le Contrôleur peut agir si le statut est ACCOUNTING_VALIDATED ou FINANCIAL_CONTROL
  const canAct = ["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL"].includes(batch.status);

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
        backHref="/controle-financier/batches"
        backLabel="العودة لقائمة الدفعات"
        subtitle="فحص مشروعية الاعتمادات ومنح التأشيرة المالية المسبقة (Visa de Contrôle Financier)"
      />

      {/* Timeline */}
      <WorkflowTimeline
        currentStatus={batch.status}
        workflowActions={batch.workflowActions}
      />

      {batch.status === "ACCOUNTING_VALIDATED" && (
        <TakeReviewButton
          batchId={batch.id}
          action={takeFinancialControlAction}
          label="استلام وبدء الرقابة المالية"
          subtitle="تم التأشير المحاسبي على الدفعة وهي الآن بانتظار التأشيرة المالية المسبقة والترخيص بالصرف"
          variant="amber"
        />
      )}

      {/* Zone de décision Contrôleur */}
      {canAct ? (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Stamp className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-amber-950">
              قرار التأشيرة المالية المسبقة (Visa Préalable)
            </h2>
          </div>
          <p className="text-xs text-amber-900 mb-4 leading-relaxed">
            وفقاً للتشريع المالي الساري، بعد التحقق من مطابقة النفقات والصفات القانونية وتوفر الاعتمادات،
            يمنح المراقب المالي التأشيرة المالية التي ترخّص بصرف الدفعة (AUTHORIZED). في حال وجود مخالفة
            نظامية غير قابلة للتسوية، يتم الرفض مع بيان السند القانوني الإلزامي.
          </p>

          <ApproveRejectForm
            batchId={batch.id}
            currentStatus={batch.status}
            approveLabel="منح التأشيرة المالية والترخيص بالصرف (AUTHORIZED)"
            rejectLabel="رفض ومنح إشعار بالإعادة للتصحيح"
            approveAction={grantFinancialVisaAction}
            rejectAction={returnByFinancialAction}
          />
        </div>
      ) : ["AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(batch.status) ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Stamp className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <span>تم منح التأشيرة المالية المسبقة والترخيص بالصرف</span>
                  <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    VISA ACCORDÉ
                  </span>
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  استوفت الدفعة كافة شروط الاعتماد المالي والرقابة المسبقة وانتقلت لمرحلة الصرف والتسوية البنكية.
                </p>
              </div>
            </div>
            <Link
              href={`/controle-financier/batches/${batch.id}/visa`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <span>معاينة بطاقة التأشيرة الرسمية</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center justify-between">
          <span>
            هذه الدفعة ليست في طور الرقابة المالية حالياً (الوضعية الحالية: <strong>{batch.status}</strong>).
          </span>
          <span className="text-slate-400 font-mono text-[11px]">للقراءة والمتابعة فقط</span>
        </div>
      )}

      {/* Fiche d'engagement financier */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="w-5 h-5 text-amber-600" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">بطاقة الالتزام المالي والمطابقة</h4>
            <p className="text-xs text-slate-500">معاينة بطاقة التدقيق المالي وبيانات فحص الاعتماد</p>
          </div>
        </div>
        <Link
          href={`/controle-financier/batches/${batch.id}/visa`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-colors"
        >
          <span>معاينة البطاقة</span>
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
