
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
import { approveByChefAction, returnByChefAction } from "@/lib/workflow/workflow-actions";
import { ShieldCheck, ExternalLink } from "lucide-react";

interface ChefBatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "مراجعة ومصادقة دفعة الأجور — رئيس المصلحة — أكاديميا شفاف",
};

export default async function ChefBatchDetailPage({
  params,
}: ChefBatchDetailPageProps) {
  const { id } = await params;
  const user = await requireRole(["CHEF_SERVICE", "ADMIN"]);

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
      employees: {
        include: {
          employee: {
            select: {
              id: true,
              matricule: true,
              firstName: true,
              lastName: true,
              grade: true,
            },
          },
        },
        take: 30,
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

  // ── Aggregate Decimal totals server-side → pass as plain numbers to Client ──
  const totalGross = batch.records.reduce((sum, r) => sum + Number(r.grossAmount ?? 0), 0);
  const totalNet = batch.records.reduce((sum, r) => sum + Number(r.netAmount ?? 0), 0);
  const totalDeductions = batch.records.reduce((sum, r) => sum + Number(r.totalDeductions ?? 0), 0);

  const canAct = batch.status === "CHEF_REVIEW";

  return (
    <div className="space-y-6">
      <BatchReviewHeader
        batch={{
          id: batch.id,
          versionNumber: batch.versionNumber ?? 1,
          label: batch.label,
          status: batch.status,
          period: batch.period,
          totalGross,
          totalNet,
          totalDeductions,
          employeeCount: batch._count.employees,
        }}
        backHref="/chef/batches"
        backLabel="العودة لقائمة الدفعات"
        subtitle="مراجعة مطابقة الحسابات والتدقيق قبل المصادقة والإحالة لمديرية المؤسسة"
      />

      <WorkflowTimeline
        currentStatus={batch.status}
        workflowActions={batch.workflowActions}
      />

      {canAct ? (
        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-bold text-blue-950">
              قرار رئيس مصلحة الأجور والرواتب
            </h2>
          </div>
          <p className="text-xs text-blue-800 mb-4">
            بصفتك رئيساً للمصلحة، يرجى التدقيق في صحة الحسابات ومطابقة المعطيات مع نتائج الفحص الآلي.
            عند المصادقة، ستُحال الدفعة مباشرة إلى السيد مدير المؤسسة للمصادقة الإدارية.
          </p>

          <ApproveRejectForm
            batchId={batch.id}
            currentStatus={batch.status}
            approveLabel="المصادقة والإحالة لمدير المؤسسة"
            rejectLabel="إعادة لمصلحة الموظفين للتصحيح"
            approveAction={approveByChefAction}
            rejectAction={returnByChefAction}
          />
        </div>
      ) : batch.status === "READY_FOR_REVIEW" ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              هذه الدفعة جاهزة ومحسوبة، ولكنها <strong>بانتظار الإحالة الرسمية</strong> من طرف عون الموارد البشرية (Agent RH) للبدء في مراجعتها.
            </span>
          </div>
          <span className="text-amber-700 font-mono text-[11px] bg-amber-100 px-2 py-0.5 rounded">
            قيد انتظار الإرسال
          </span>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center justify-between">
          <span>
            هذه الدفعة ليست في طور مراجعة رئيس المصلحة حالياً (الوضعية الحالية: <strong>{batch.status}</strong>).
          </span>
          <span className="text-slate-400 font-mono text-[11px]">للقراءة والمتابعة فقط</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            تقرير التدقيق الذكي (Smart Audit)
          </h3>
          <Link
            href={`/chef/batches/${batch.id}/audit`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
          >
            <span>تقرير التدقيق الكامل</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <WorkflowAuditFindings findings={batch.auditFindings} />
      </div>

      {/* Liste des employés du lot avec lien vers fiche détaillée */}
      {batch.employees.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              موظفو الدفعة ({batch._count.employees})
            </h3>
            <span className="text-xs text-slate-500">معاينة استحقاقات كل موظف على حدة</span>
          </div>
          <div className="divide-y divide-slate-100">
            {batch.employees.map((be) => (
              <div
                key={be.employee.id}
                className="p-3.5 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                    {be.employee.firstName?.[0] || "م"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {be.employee.firstName} {be.employee.lastName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {be.employee.matricule} • {be.employee.grade || "بدون رتبة"}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/chef/batches/${batch.id}/employees/${be.employee.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                >
                  <span>كشف الراتب</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <BatchWorkflowSummary actions={batch.workflowActions} />
    </div>
  );
}
