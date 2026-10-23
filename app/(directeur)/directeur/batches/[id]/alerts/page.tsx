import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { BatchReviewHeader } from "@/components/workflow/BatchReviewHeader";
import { WorkflowAuditFindings } from "@/components/workflow/WorkflowAuditFindings";
import { AlertTriangle } from "lucide-react";

interface DirecteurAlertsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "التنبيهات والمخالفات الحرجة — مدير المؤسسة — أكاديميا شفاف",
};

export default async function DirecteurAlertsPage({
  params,
}: DirecteurAlertsPageProps) {
  const { id } = await params;
  const user = await requireRole(["DIRECTEUR", "ADMIN"]);

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      records: {
        select: { grossAmount: true, netAmount: true, totalDeductions: true },
      },
      _count: { select: { employees: true } },
      auditFindings: {
        where: {
          severity: { in: ["CRITICAL", "HIGH"] },
        },
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
    },
  });

  if (!batch || batch.organizationId !== user.organizationId) {
    notFound();
  }

  return (
    <div className="space-y-6">
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
        backHref={`/directeur/batches/${batch.id}`}
        backLabel="العودة لمراجعة الدفعة"
        subtitle="حصر التنبيهات عالية الأهمية والحرجة التي تستوجب فحص الإدارة"
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          تعرض هذه الشاشة فقط الملاحظات المصنفة كـ <strong>حرجة (CRITICAL)</strong> أو <strong>عالية (HIGH)</strong> لتمكين الإدارة من اتخاذ قرارات دقيقة ومبنية على المخاطر.
        </p>
      </div>

      <WorkflowAuditFindings
        findings={batch.auditFindings}
        title="التنبيهات الحرجة والعالية في هذه الدفعة"
      />
    </div>
  );
}
