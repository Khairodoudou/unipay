import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { PeriodDetailClient } from "@/components/agent/payroll/PeriodDetailClient";
import {
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  RotateCw,
  Calculator,
} from "lucide-react";

export const metadata: Metadata = {
  title: "تفاصيل فترة الأجر — مساحة الموارد البشرية — UNI-PAY",
  description: "متابعة دفعات الأجور التابعة للفترة الشهرية",
};

interface PeriodDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PeriodDetailPage({ params }: PeriodDetailPageProps) {
  await requireRole(["AGENT_RH", "ADMIN"]);
  const { id } = await params;

  const period = await prisma.payrollPeriod.findUnique({
    where: { id },
    include: {
      batches: {
        orderBy: { versionNumber: "desc" },
        include: {
          _count: {
            select: {
              employees: true,
              records: true,
              attendanceRecords: true,
              lineItems: true,
            },
          },
        },
      },
    },
  });

  if (!period) {
    notFound();
  }

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
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/agent/payroll-periods"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لفترات الأجر</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {period.label}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                <span>السنة: {period.year}</span>
                <span>•</span>
                <span>الشهر: {period.month}</span>
                <span>•</span>
                <span>الحالة الحالية: {period.status}</span>
              </div>
            </div>
          </div>
        </div>

        <PeriodDetailClient period={period} />
      </div>

      {/* Batches Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              دفعات الأجر المسجلة لهذه الفترة (Lots de Paie)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              كل دفعة تتضمن قائمة الموظفين، سجلات الحضور، المنح، والنتائج المحسوبة
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">
            {period.batches.length} دفعات
          </span>
        </div>

        {period.batches.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">لا توجد أي دفعة أجر منشأة بعد</h3>
            <p className="text-xs text-slate-500 mt-1">
              استخدم زر &quot;إنشاء دفعة أجر جديدة&quot; أعلاه للبدء في ربط الموظفين واحتساب الرواتب.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">الدفعة / النسخة</th>
                  <th className="px-5 py-3.5">التسمية والملاحظات</th>
                  <th className="px-5 py-3.5">عدد الموظفين</th>
                  <th className="px-5 py-3.5">سجلات الحضور</th>
                  <th className="px-5 py-3.5">المنح والخصومات</th>
                  <th className="px-5 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {period.batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
                        v{batch.versionNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-xs">
                        {batch.label || "دفعة عادية"}
                      </div>
                      {batch.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate">
                          {batch.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">
                      {batch._count.employees} موظف
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {batch._count.attendanceRecords} سجل
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {batch._count.lineItems} بند
                    </td>
                    <td className="px-5 py-4">{batchStatusBadge(batch.status)}</td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/agent/batches/${batch.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                      >
                        <span>فتح الدفعة</span>
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
