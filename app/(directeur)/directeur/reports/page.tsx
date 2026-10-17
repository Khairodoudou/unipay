import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "التقارير والمؤشرات — مدير المؤسسة — UNI-PAY",
};

export default async function DirecteurReportsPage() {
  const user = await requireRole(["DIRECTEUR", "ADMIN"]);

  const batches = await prisma.payrollBatch.findMany({
    where: { organizationId: user.organizationId },
    include: {
      period: true,
      records: {
        select: { grossAmount: true, netAmount: true, totalDeductions: true },
      },
      _count: { select: { employees: true } },
    },
    orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }],
  });

  const totalGrossAll = batches.reduce(
    (acc, b) => acc + b.records.reduce((sum, r) => sum + Number(r.grossAmount), 0),
    0
  );
  const totalNetAll = batches.reduce(
    (acc, b) => acc + b.records.reduce((sum, r) => sum + Number(r.netAmount), 0),
    0
  );
  const totalDeductionsAll = batches.reduce(
    (acc, b) => acc + b.records.reduce((sum, r) => sum + Number(r.totalDeductions), 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              التقارير والمؤشرات المالية للإدارة
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            مؤشرات إجمالية لكتلة الأجور، التطور الشهري، واقتطاعات الضمان الاجتماعي والضريبة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">مجموع الأجور الخام التراكمي</span>
          <p className="text-xl font-bold text-slate-900 mt-2 font-mono">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totalGrossAll)} د.ج
          </p>
          <p className="text-xs text-slate-400 mt-1">كافة الدفعات المسجلة</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">مجموع الاقتطاعات (IRG + CNAS)</span>
          <p className="text-xl font-bold text-amber-900 mt-2 font-mono">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totalDeductionsAll)} د.ج
          </p>
          <p className="text-xs text-slate-400 mt-1">المستحقات الضريبية وشبه الضريبية</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800">مجموع الصافي المصروف</span>
          <p className="text-xl font-bold text-emerald-950 mt-2 font-mono">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totalNetAll)} د.ج
          </p>
          <p className="text-xs text-emerald-700 mt-1">صافي أجور الموظفين الإجمالي</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">تطور كتل الأجور الشهرية</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">الشهر / السنة</th>
                <th className="py-3 px-4">الدفعة</th>
                <th className="py-3 px-4">تعداد العمال</th>
                <th className="py-3 px-4">الكتلة الخام</th>
                <th className="py-3 px-4">الاقتطاعات</th>
                <th className="py-3 px-4">الصافي</th>
                <th className="py-3 px-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => {
                const bGross = b.records.reduce((sum, r) => sum + Number(r.grossAmount), 0);
                const bNet = b.records.reduce((sum, r) => sum + Number(r.netAmount), 0);
                const bDeduc = b.records.reduce((sum, r) => sum + Number(r.totalDeductions), 0);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {b.period.month}/{b.period.year}
                    </td>
                    <td className="py-3 px-4 font-mono text-purple-900">
                      {b.label || `دفعة v${b.versionNumber}`}
                    </td>
                    <td className="py-3 px-4 font-mono">{b._count.employees}</td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(bGross)} د.ج
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-800">
                      {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(bDeduc)} د.ج
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(bNet)} د.ج
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">{b.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
