import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { CalculationClient } from "@/components/agent/payroll/CalculationClient";
import {
  Calculator,
  ArrowRight,
  Users,
  Clock,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "محرك احتساب الأجور — مساحة الموارد البشرية — UNI-PAY",
  description: "تشغيل محرك الاحتساب وتثبيت كشوف الرواتب للدفعة",
};

interface CalculatePageProps {
  params: Promise<{ id: string }>;
}

export default async function CalculateBatchPage({ params }: CalculatePageProps) {
  await requireRole(["AGENT_RH", "ADMIN"]);
  const { id } = await params;

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      employees: {
        include: { employee: true },
      },
      attendanceRecords: true,
      records: {
        orderBy: { snapshotMatricule: "asc" },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const recordedAttendanceEmployeeIds = new Set(batch.attendanceRecords.map((a) => a.employeeId));
  const missingAttendanceCount = batch.employees.filter(
    (e) => !recordedAttendanceEmployeeIds.has(e.employeeId)
  ).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
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
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                محرك احتساب الأجور (Payroll Engine)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                فترة {batch.period.label} • الدفعة v{batch.versionNumber} ({batch.employees.length} موظف مدرج)
              </p>
            </div>
          </div>
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
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white shadow-xs shrink-0"
        >
          <Calculator className="w-4 h-4" />
          <span>محرك الاحتساب والتحقق</span>
        </Link>
      </div>

      {/* Calculation Client */}
      <CalculationClient
        batchId={batch.id}
        batchStatus={batch.status}
        periodLabel={batch.period.label}
        versionNumber={batch.versionNumber}
        totalEmployees={batch.employees.length}
        recordedAttendanceCount={recordedAttendanceEmployeeIds.size}
        missingAttendanceCount={missingAttendanceCount}
        records={batch.records.map((r) => ({
          id: r.id,
          snapshotMatricule: r.snapshotMatricule,
          snapshotName: r.snapshotName,
          snapshotGrade: r.snapshotGrade,
          snapshotBaseSalary: Number(r.snapshotBaseSalary),
          totalAllowances: Number(r.totalAllowances),
          grossAmount: Number(r.grossAmount),
          totalContributions: Number(r.totalContributions),
          totalTaxes: Number(r.totalTaxes),
          netAmount: Number(r.netAmount),
        }))}
      />
    </div>
  );
}
