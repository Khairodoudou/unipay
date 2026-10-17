import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import {
  Stamp,
  FileCheck2,
  Clock,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  DollarSign,
} from "lucide-react";
import { StatusBadge } from "@/components/workflow/StatusBadge";

export const metadata: Metadata = {
  title: "لوحة القيادة والرقابة — المراقب المالي — UNI-PAY",
  description: "الرقابة المالية المسبقة ومنح التأشيرات على الرواتب",
};

export default async function ControleurDashboardPage() {
  const user = await requireRole(["CONTROLEUR_FINANCIER", "ADMIN"]);

  const [batchesToReview, allBatches] = await Promise.all([
    prisma.payrollBatch.findMany({
      where: {
        organizationId: user.organizationId,
        status: { in: ["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL"] },
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
      include: { period: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const countPending = batchesToReview.length;
  const countAuthorized = allBatches.filter((b) => b.status === "AUTHORIZED").length;
  const countReturned = allBatches.filter((b) => b.status === "RETURNED_FOR_CORRECTION").length;

  const totalPendingGross = batchesToReview.reduce(
    (acc, b) => acc + b.records.reduce((sum, r) => sum + Number(r.grossAmount), 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Stamp className="w-5 h-5 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              مصالح الرقابة المالية المسبقة
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            فحص مشروعية النفقات، توفر الاعتمادات المالية المفتوحة، ومنح التأشيرة المالية المسبقة (Visa)
          </p>
        </div>

        <Link
          href="/controle-financier/batches"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>الجداول بانتظار التأشيرة ({countPending})</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">بانتظار التأشيرة المالية</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3 font-mono">{countPending}</p>
          <p className="text-xs text-amber-600 mt-1 font-medium">أشرت عليها المحاسبة</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">تم منح التأشيرة (مرخص)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3 font-mono">{countAuthorized}</p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">مرخص للصرف (AUTHORIZED)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">أعيدت للتصحيح</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3 font-mono">{countReturned}</p>
          <p className="text-xs text-rose-600 mt-1 font-medium">رفض معلّل بأسباب نظامية</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الاعتمادات المطلوب التأشير عليها</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-3 font-mono truncate">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totalPendingGross)} د.ج
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">مجموع الالتزام المالي</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stamp className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              جداول الأجور المعروضة للتأشيرة المالية المسبقة
            </h2>
          </div>
          <Link
            href="/controle-financier/batches"
            className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
          >
            <span>كافة الجداول</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {batchesToReview.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-70" />
            <p className="text-sm font-semibold text-slate-700">لا توجد جداول بانتظار التأشيرة المالية حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم الدفعة</th>
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
                  const gross = b.records.reduce((sum, r) => sum + Number(r.grossAmount), 0);
                  const net = b.records.reduce((sum, r) => sum + Number(r.netAmount), 0);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-amber-900">
                        {b.label || `دفعة v${b.versionNumber}`}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {b.period.month}/{b.period.year}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {b._count.employees.toLocaleString("ar-DZ")}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(gross)} د.ج
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(net)} د.ج
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/controle-financier/batches/${b.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                        >
                          <span>فحص ومنح التأشيرة</span>
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
