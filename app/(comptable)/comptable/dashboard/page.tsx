import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import {
  Receipt,
  FileCheck2,
  Clock,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  DollarSign,
  BookOpenCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/workflow/StatusBadge";

export const metadata: Metadata = {
  title: "لوحة القيادة المحاسبية — المحاسب المالي — UNI-PAY",
  description: "المراجعة والتأشير المحاسبي لكشوف الأجور",
};

export default async function ComptableDashboardPage() {
  const user = await requireRole(["COMPTABLE", "ADMIN"]);

  const [batchesToReview, allBatches] = await Promise.all([
    prisma.payrollBatch.findMany({
      where: {
        organizationId: user.organizationId,
        status: { in: ["APPROVED_BY_DIRECTOR", "ACCOUNTING_REVIEW"] },
      },
      include: {
        period: true,
        records: { select: { grossAmount: true, netAmount: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),

    prisma.payrollBatch.findMany({
      where: { organizationId: user.organizationId },
      include: {
        period: true,
        records: { select: { netAmount: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const countPending = batchesToReview.length;
  const countValidated = allBatches.filter((b) =>
    ["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL", "AUTHORIZED"].includes(b.status)
  ).length;
  const countReturned = allBatches.filter((b) => b.status === "RETURNED_FOR_CORRECTION").length;

  const totalPendingNet = batchesToReview.reduce(
    (acc, b) => acc + b.records.reduce((sum, r) => sum + Number(r.netAmount), 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              مصلحة المحاسبة والميزانية
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            فحص القيود المحاسبية، تسوية اقتطاعات الضمان الاجتماعي والضريبة والتأشير المالي
          </p>
        </div>

        <Link
          href="/comptable/batches"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>الجداول بانتظار التأشير ({countPending})</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">بانتظار التأشير المحاسبي</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3 font-mono">{countPending}</p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">صادق عليها المدير</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">تم التأشير والتحقق</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3 font-mono">{countValidated}</p>
          <p className="text-xs text-blue-600 mt-1 font-medium">أحيلت للمراقب المالي</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">أعيدت للتصحيح</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3 font-mono">{countReturned}</p>
          <p className="text-xs text-rose-600 mt-1 font-medium">تحفظات محاسبية</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الصافي قيد المعالجة</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-3 font-mono truncate">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totalPendingNet)} د.ج
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">الصافي للدفع</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              جداول الأجور بانتظار التأشير المحاسبي
            </h2>
          </div>
          <Link href="/comptable/batches" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
            <span>عرض الكل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {batchesToReview.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-70" />
            <p className="text-sm font-semibold text-slate-700">لا توجد جداول بانتظار التأشير المحاسبي حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم / تسمية الدفعة</th>
                  <th className="py-3 px-4">دورة الأجر</th>
                  <th className="py-3 px-4">الموظفين</th>
                  <th className="py-3 px-4">الكتلة الخام</th>
                  <th className="py-3 px-4">الصافي للدفع</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchesToReview.map((b) => {
                  const bGross = b.records.reduce((sum, r) => sum + Number(r.grossAmount), 0);
                  const bNet = b.records.reduce((sum, r) => sum + Number(r.netAmount), 0);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-900">
                        {b.label || `دفعة v${b.versionNumber}`}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {b.period.month}/{b.period.year}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {b._count.employees.toLocaleString("ar-DZ")}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(bGross)} د.ج
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(bNet)} د.ج
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/comptable/batches/${b.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                        >
                          <span>فحص وتأشير</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
