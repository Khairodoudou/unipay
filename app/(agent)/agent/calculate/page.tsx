import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import {
  Calculator,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "الاحتساب والتحقق — مساحة الموارد البشرية — UNI-PAY",
  description: "مركز معالجة واحتساب مسيرات الرواتب لمنصة UNI-PAY",
};

export default async function GlobalCalculatePage() {
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
        },
      },
    },
  });

  const pendingBatches = batches.filter((b) =>
    ["DRAFT", "RETURNED_FOR_CORRECTION"].includes(b.status)
  );
  const calculatedBatches = batches.filter((b) => b.status === "CALCULATED");
  const readyBatches = batches.filter((b) => b.status === "READY_FOR_REVIEW");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              مركز الاحتساب والتحقق (Payroll Engine Hub)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تشغيل ومتابعة خوارزميات احتساب الأجور والضرائب (IRG) والاشتراكات الاجتماعية (CNAS)
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">دفعات قيد التحضير والتدقيق</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl font-black font-mono text-amber-600">
              {pendingBatches.length}
            </span>
            <span className="text-xs text-slate-400">تحتاج حساب أو إعادة حساب</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">دفعات محسوبة بنجاح</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl font-black font-mono text-teal-700">
              {calculatedBatches.length}
            </span>
            <span className="text-xs text-slate-400">بانتظار إرسالها للمراجعة</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">دفعات جاهزة للمراجعة</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl font-black font-mono text-emerald-700">
              {readyBatches.length}
            </span>
            <span className="text-xs text-slate-400">READY_FOR_REVIEW</span>
          </div>
        </div>
      </div>

      {/* Section 1: Batches Needing Calculation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              دفعات بانتظار الاحتساب والمعالجة (Pending Batches)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              الدفعات التي تم تجهيز موظفيها وسجلات حضورهم وتحتاج تشغيل محرك الأجور
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            {pendingBatches.length} دفعة
          </span>
        </div>

        {pendingBatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            لا توجد أي دفعة معلقة حالياً بانتظار الاحتساب.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3">فترة الأجر</th>
                  <th className="px-5 py-3">النسخة</th>
                  <th className="px-5 py-3">الموظفين</th>
                  <th className="px-5 py-3">اكتمال الحضور</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {b.period.label}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                      v{b.versionNumber}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-800">
                      {b._count.employees} موظف
                    </td>
                    <td className="px-5 py-3.5">
                      {b._count.attendanceRecords >= b._count.employees && b._count.employees > 0 ? (
                        <span className="text-emerald-700 font-bold">مكتمل 100%</span>
                      ) : (
                        <span className="text-amber-700 font-bold">
                          {b._count.attendanceRecords} / {b._count.employees}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/agent/batches/${b.id}/calculate`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition-colors shadow-2xs"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>تشغيل الاحتساب</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Calculated & Ready Batches */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              الدفعات المحسوبة والجاهزة للمراجعة (Calculated & Ready)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              الدفعات التي اكتمل احتسابها وتثبيت لقطاتها المالية
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
            {calculatedBatches.length + readyBatches.length} دفعة
          </span>
        </div>

        {calculatedBatches.length + readyBatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            لا توجد دفعات محسوبة بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3">فترة الأجر</th>
                  <th className="px-5 py-3">النسخة</th>
                  <th className="px-5 py-3">الموظفين المحسوبين</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3">تاريخ الاحتساب</th>
                  <th className="px-5 py-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...calculatedBatches, ...readyBatches].map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {b.period.label}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                      v{b.versionNumber}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-800 font-bold">
                      {b._count.records} سجل
                    </td>
                    <td className="px-5 py-3.5">
                      {b.status === "READY_FOR_REVIEW" ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          جاهز للمراجعة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                          <Calculator className="w-3 h-3" />
                          مُحتسب
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {b.calculatedAt
                        ? new Date(b.calculatedAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/agent/batches/${b.id}/calculate`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                      >
                        <span>عرض النتائج</span>
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
