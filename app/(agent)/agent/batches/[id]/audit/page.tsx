import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { AuditSummaryCards } from "@/components/agent/audit/AuditSummaryCards";
import { FindingsTable } from "@/components/agent/audit/FindingsTable";
import { RunAuditButton } from "@/components/agent/audit/RunAuditButton";
import {
  ArrowRight,
  Users,
  Clock,
  Calculator,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import { FindingType, FindingSeverity, FindingStatus } from "@/lib/audit/types";

export const metadata: Metadata = {
  title: "التدقيق الذكي للدفعة — مساحة الموارد البشرية — UNI-PAY",
  description: "الكشف الآلي عن الشذوذ والملاحظات والتحليل المعزز بالذكاء الاصطناعي",
};

interface BatchAuditPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ severity?: string }>;
}

export default async function BatchAuditPage({
  params,
  searchParams,
}: BatchAuditPageProps) {
  await requireRole(["AGENT_RH", "ADMIN"]);
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const severityFilter = sParams.severity || "";

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      employees: {
        select: { id: true },
      },
      auditFindings: {
        include: {
          employee: {
            include: {
              organizationUnit: true,
            },
          },
          aiAnalyses: {
            select: { id: true },
          },
        },
        orderBy: [
          { severity: "asc" }, // CRITICAL d'abord (selon l'ordre alphabétique ou priorité)
          { createdAt: "desc" },
        ],
      },
    },
  });

  if (!batch) {
    notFound();
  }

  // Calcul du résumé des anomalies directement depuis la base
  const totalFindings = batch.auditFindings.length;
  let critical = 0;
  let high = 0;
  let warning = 0;
  let info = 0;
  let open = 0;
  let reviewed = 0;
  let confirmed = 0;
  let falsePositive = 0;
  let resolved = 0;

  for (const f of batch.auditFindings) {
    if (f.severity === "CRITICAL") critical++;
    else if (f.severity === "HIGH") high++;
    else if (f.severity === "WARNING") warning++;
    else if (f.severity === "INFO") info++;

    if (f.status === "OPEN") open++;
    else if (f.status === "REVIEWED") reviewed++;
    else if (f.status === "CONFIRMED") confirmed++;
    else if (f.status === "FALSE_POSITIVE") falsePositive++;
    else if (f.status === "RESOLVED") resolved++;
  }

  const summary = {
    totalFindings,
    critical,
    high,
    warning,
    info,
    open,
    reviewed,
    confirmed,
    falsePositive,
    resolved,
  };

  const tableFindings = batch.auditFindings.map((f) => ({
    id: f.id,
    batchId: f.batchId,
    employeeId: f.employeeId,
    employeeName: f.employee ? `${f.employee.firstName} ${f.employee.lastName}` : null,
    employeeMatricule: f.employee?.matricule || null,
    departmentName: f.employee?.organizationUnit?.name || null,
    type: f.type as FindingType,
    severity: f.severity as FindingSeverity,
    title: f.title,
    description: f.description,
    detectedValue: f.detectedValue,
    expectedValue: f.expectedValue,
    source: f.source,
    confidence: f.confidence,
    status: f.status as FindingStatus,
    createdAt: f.createdAt,
    aiAnalysesCount: f.aiAnalyses.length,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/agent/batches/${batch.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لدفعة {batch.period.label} (v{batch.versionNumber})</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  التدقيق الذكي لمسيرة الأجور (Smart Audit)
                </h1>
                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                  v{batch.versionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                دفعة شهر {batch.period.label} • فحص تلقائي للشذوذ الحسابي، ومطابقة البيانات، والتحليل الذكي
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RunAuditButton batchId={batch.id} hasFindings={totalFindings > 0} />
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        <Link
          href={`/agent/batches/${batch.id}`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 transition-colors"
        >
          <Users className="w-4 h-4 text-slate-400" />
          <span>الموظفون في الدفعة</span>
        </Link>
        <Link
          href={`/agent/batches/${batch.id}/attendance`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 transition-colors"
        >
          <Clock className="w-4 h-4 text-slate-400" />
          <span>سجلات الحضور والغيابات</span>
        </Link>
        <Link
          href={`/agent/batches/${batch.id}/indemnities`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 transition-colors"
        >
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span>المنح والخصومات</span>
        </Link>
        <Link
          href={`/agent/batches/${batch.id}/calculate`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 transition-colors"
        >
          <Calculator className="w-4 h-4 text-slate-400" />
          <span>محرك الاحتساب والتحقق</span>
        </Link>
        <Link
          href={`/agent/batches/${batch.id}/audit`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 text-white shadow-xs shrink-0"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>التدقيق الذكي ({totalFindings})</span>
        </Link>
      </div>

      {/* Audit Summary Cards */}
      <AuditSummaryCards summary={summary} activeSeverityFilter={severityFilter} />

      {/* Findings Table */}
      <FindingsTable
        batchId={batch.id}
        findings={tableFindings}
        initialSeverityFilter={severityFilter}
      />
    </div>
  );
}
