import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { BatchReviewHeader } from "@/components/workflow/BatchReviewHeader";
import { WorkflowAuditFindings } from "@/components/workflow/WorkflowAuditFindings";
import { Sparkles } from "lucide-react";

interface ChefBatchAuditPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "تقرير التدقيق الذكي — رئيس المصلحة — UNI-PAY",
};

export default async function ChefBatchAuditPage({
  params,
}: ChefBatchAuditPageProps) {
  const { id } = await params;
  const user = await requireRole(["CHEF_SERVICE", "ADMIN"]);

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      records: {
        select: { grossAmount: true, netAmount: true, totalDeductions: true },
      },
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
          aiAnalyses: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!batch || batch.organizationId !== user.organizationId) {
    notFound();
  }

  const findingWithAI = batch.auditFindings.find((f) => f.aiAnalyses && f.aiAnalyses.length > 0);
  const latestAI = findingWithAI?.aiAnalyses?.[0] ?? null;

  return (
    <div className="space-y-6">
      <BatchReviewHeader
        batch={batch}
        backHref={`/chef/batches/${batch.id}`}
        backLabel="العودة لصفحة مراجعة الدفعة"
        subtitle="تقرير مفصل لفحوصات التدقيق الذكي والذكاء الاصطناعي (Smart Audit)"
      />

      {latestAI && (
        <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-200/80 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-indigo-950">
              ملخص التحليل الذكي للدفعة (Gemini AI Audit)
            </h3>
          </div>
          <div className="p-4 bg-white/90 rounded-lg border border-indigo-100 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {latestAI.analysis}
          </div>
          {latestAI.recommendation && (
            <div className="mt-3 p-3 bg-white/95 rounded-lg border border-indigo-200 text-xs text-indigo-900 leading-relaxed">
              <strong className="block mb-1 text-indigo-950">التوصية المقترحة:</strong>
              {latestAI.recommendation}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-indigo-700">
            <span>النموذج: {latestAI.model}</span>
            <span>تاريخ التحليل: {new Date(latestAI.createdAt).toLocaleDateString("ar-DZ")}</span>
          </div>
        </div>
      )}

      <WorkflowAuditFindings
        findings={batch.auditFindings}
        title="كافة الملاحظات والمخالفات المرصودة"
      />
    </div>
  );
}
