import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RotateCw,
  Calculator,
  ArrowUpRight,
  Plus,
} from "lucide-react";

export const metadata: Metadata = {
  title: "دفعات الأجور — مساحة الموارد البشرية — UNI-PAY",
  description: "متابعة وإدارة دفعات الأجور ومسيرات الرواتب",
};

export default async function BatchesPage() {
  await requireRole(["AGENT_RH", "ADMIN"]);

  const batches = await prisma.payrollBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      period: true,
      _count: {
        select: {
          employees: true,
          records: true,
          attendanceRecords: true,
          lineItems: true,
        },
      },
    },
  });

  const batchStatusBadge = (status: string) => {
    switch (status) {
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            جاهز للمراجعة (READY_FOR_REVIEW)
          </span>
        );
      case "CALCULATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Calculator className="w-3 h-3" />
            مُحتسب (CALCULATED)
          </span>
        );
      case "RETURNED_FOR_CORRECTION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCw className="w-3 h-3" />
            معاد للتصحيح
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" />
            مسودة (DRAFT)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              دفعات الأجور (Lots de Paie)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            سجل كافة دفعات الأجور المحضرة، إصداراتها، وحالات تقدمها نحو الاحتساب والمراجعة
          </p>
        </div>

        <Link
          href="/agent/payroll-periods"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء دفعة جديدة من فترات الأجر</span>
        </Link>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {batches.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">لا توجد دفعات أجر مسجلة بعد</h3>
            <p className="text-xs text-slate-500 mt-1">
              توجه إلى فترات الأجر لإنشاء أول دفعة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">فترة الأجر</th>
                  <th className="px-5 py-3.5">النسخة (Version)</th>
                  <th className="px-5 py-3.5">التسمية</th>
                  <th className="px-5 py-3.5">الموظفين</th>
                  <th className="px-5 py-3.5">الحضور</th>
                  <th className="px-5 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5">تاريخ الاحتساب</th>
                  <th className="px-5 py-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{b.period.label}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {b.period.year}/{b.period.month}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
                        v{b.versionNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {b.label || "دفعة عادية"}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">
                      {b._count.employees} موظف
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {b._count.attendanceRecords} مسجل
                    </td>
                    <td className="px-5 py-4">{batchStatusBadge(b.status)}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-500">
                      {b.calculatedAt
                        ? new Date(b.calculatedAt).toLocaleDateString("fr-FR")
                        : "لم يُحتسب بعد"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/agent/batches/${b.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                      >
                        <span>إدارة الدفعة</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
