import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { FileCheck2, ChevronLeft } from "lucide-react";
import { StatusBadge } from "@/components/workflow/StatusBadge";

export const metadata: Metadata = {
  title: "دفعات الأجور — رئيس المصلحة — UNI-PAY",
  description: "قائمة دفعات الأجور للمراجعة والمصادقة",
};

export default async function ChefBatchesPage() {
  const user = await requireRole(["CHEF_SERVICE", "ADMIN"]);

  const batches = await prisma.payrollBatch.findMany({
    where: { organizationId: user.organizationId },
    include: {
      period: true,
      records: {
        select: { grossAmount: true, netAmount: true },
      },
      _count: { select: { employees: true } },
      workflowActions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          actor: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            دفعات الأجور للمؤسسة
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            متابعة حالة جميع دفعات الأجور ومسار مصادقتها عبر مختلف المستويات
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg self-start md:self-auto">
          إجمالي الدفعات: {batches.length}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800">سجل دفعات الأجور</span>
        </div>

        {batches.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">لا توجد دفعات أجور مسجلة حتى الآن</p>
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
                  <th className="py-3 px-4">آخر تعديل / قرار</th>
                  <th className="py-3 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => {
                  const lastAction = b.workflowActions[0];
                  const bGross = b.records.reduce((sum, r) => sum + Number(r.grossAmount), 0);
                  const bNet = b.records.reduce((sum, r) => sum + Number(r.netAmount), 0);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-900">
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
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {lastAction ? (
                          <div>
                            <span className="font-medium text-slate-700">{lastAction.action}</span>
                            <span className="block text-[11px] text-slate-400">
                              بواسطة: {lastAction.actor.firstName && lastAction.actor.lastName ? `${lastAction.actor.firstName} ${lastAction.actor.lastName}` : (lastAction.actor.firstName || lastAction.actor.email)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/chef/batches/${b.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                        >
                          <span>معاينة</span>
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
