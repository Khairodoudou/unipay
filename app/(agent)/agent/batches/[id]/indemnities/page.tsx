import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { IndemnitiesManager } from "@/components/agent/payroll/IndemnitiesManager";
import {
  DollarSign,
  ArrowRight,
  Users,
  Clock,
  Calculator,
} from "lucide-react";

export const metadata: Metadata = {
  title: "المنح والخصومات — مساحة الموارد البشرية — UNI-PAY",
  description: "إدارة البنود الإضافية للمنح والمكافآت والاقتطاعات لدفعة الأجر",
};

interface IndemnitiesPageProps {
  params: Promise<{ id: string }>;
}

export default async function IndemnitiesPage({ params }: IndemnitiesPageProps) {
  await requireRole(["AGENT_RH", "ADMIN"]);
  const { id } = await params;

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      employees: {
        include: { employee: true },
        orderBy: { employee: { matricule: "asc" } },
      },
      lineItems: {
        include: { employee: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const employeeOptions = batch.employees.map(({ employee: e }) => ({
    id: e.id,
    matricule: e.matricule,
    fullName: `${e.firstName} ${e.lastName}`,
  }));

  const lineItemsData = batch.lineItems.map((item) => ({
    id: item.id,
    employeeId: item.employeeId,
    employeeMatricule: item.employee.matricule,
    employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
    type: item.type,
    code: item.code,
    labelAr: item.labelAr,
    amount: Number(item.amount),
    notes: item.notes,
  }));

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
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                المنح والمكافآت والخصومات (Indemnités & Retenues)
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
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white shadow-xs shrink-0"
        >
          <DollarSign className="w-4 h-4" />
          <span>المنح والخصومات</span>
        </Link>
        <Link
          href={`/agent/batches/${batch.id}/calculate`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 shrink-0 transition-colors"
        >
          <Calculator className="w-4 h-4 text-teal-600" />
          <span>محرك الاحتساب والتحقق</span>
        </Link>
      </div>

      {/* Indemnities Manager Component */}
      <IndemnitiesManager
        batchId={batch.id}
        batchStatus={batch.status}
        employees={employeeOptions}
        lineItems={lineItemsData}
      />
    </div>
  );
}
