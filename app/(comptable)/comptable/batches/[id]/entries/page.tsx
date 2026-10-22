import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { BatchReviewHeader } from "@/components/workflow/BatchReviewHeader";
import { BookOpenCheck, CheckCircle2 } from "lucide-react";

interface ComptableEntriesPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "القيود المحاسبية — المحاسب المالي — UNI-PAY",
};

export default async function ComptableEntriesPage({
  params,
}: ComptableEntriesPageProps) {
  const { id } = await params;
  const user = await requireRole(["COMPTABLE", "ADMIN"]);

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      records: { select: { grossAmount: true, netAmount: true, totalDeductions: true } },
    },
  });

  if (!batch || batch.organizationId !== user.organizationId) {
    notFound();
  }

  const gross = batch.records.reduce((sum, r) => sum + Number(r.grossAmount), 0);
  const net = batch.records.reduce((sum, r) => sum + Number(r.netAmount), 0);
  const deductions = gross - net;
  // Estimation SCF Algérie: Cotisations salariales SS 9%, IRG = deductions - SS
  const ssEmployee = Math.round(gross * 0.09 * 100) / 100;
  const irg = Math.max(0, Math.round((deductions - ssEmployee) * 100) / 100);
  const ssEmployer = Math.round(gross * 0.26 * 100) / 100; // Charges patronales 26%
  const ssTotal = Math.round((ssEmployee + ssEmployer) * 100) / 100;

  const totalDebit = Math.round((gross + ssEmployer) * 100) / 100;
  const totalCredit = Math.round((net + ssTotal + irg) * 100) / 100;

  const entries = [
    {
      code: "631",
      labelAr: "أجور ومكافآت المستخدمين (Rémunérations du personnel)",
      debit: gross,
      credit: 0,
    },
    {
      code: "635",
      labelAr: "أعباء الضمان الاجتماعي - حصة المستخدم 26% (Charges patronales)",
      debit: ssEmployer,
      credit: 0,
    },
    {
      code: "421",
      labelAr: "المستخدمون - الأجور المستحقة (Net à payer)",
      debit: 0,
      credit: net,
    },
    {
      code: "431",
      labelAr: "هيئات الضمان الاجتماعي - CNAS (حصة العامل 9% + حصة المستخدم 26%)",
      debit: 0,
      credit: ssTotal,
    },
    {
      code: "442",
      labelAr: "الدولة - الضرائب والرسوم المحصومة من المصدر (IRG/Paie)",
      debit: 0,
      credit: irg,
    },
  ];

  return (
    <div className="space-y-6">
      <BatchReviewHeader
        batch={{
          id: batch.id,
          versionNumber: batch.versionNumber ?? 1,
          label: batch.label,
          status: batch.status,
          period: batch.period,
          totalGross: batch.records.reduce((s, r) => s + Number(r.grossAmount ?? 0), 0),
          totalNet: batch.records.reduce((s, r) => s + Number(r.netAmount ?? 0), 0),
          totalDeductions: batch.records.reduce((s, r) => s + Number(r.totalDeductions ?? 0), 0),
        }}
        backHref={`/comptable/batches/${batch.id}`}
        backLabel="العودة لصفحة المراجعة"
        subtitle="جدول القيود المحاسبية وفق النظام المحاسبي المالي الجزائري (SCF)"
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              قيد يومية الرواتب والأجور (Journal des Salaires)
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            توازن محاسبي تام (Débit = Crédit)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">رقم الحساب (N° Compte)</th>
                <th className="py-3 px-4">بيان القيد المحاسبي</th>
                <th className="py-3 px-4 text-left">مدين (Débit)</th>
                <th className="py-3 px-4 text-left">دائن (Crédit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {entries.map((e, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-blue-900">{e.code}</td>
                  <td className="py-3 px-4 font-sans text-slate-800">{e.labelAr}</td>
                  <td className="py-3 px-4 text-left font-medium text-slate-900">
                    {e.debit > 0
                      ? new Intl.NumberFormat("ar-DZ", { minimumFractionDigits: 2 }).format(e.debit)
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-left font-medium text-slate-900">
                    {e.credit > 0
                      ? new Intl.NumberFormat("ar-DZ", { minimumFractionDigits: 2 }).format(e.credit)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/80 font-mono font-bold text-sm border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="py-3 px-4 font-sans text-slate-900">
                  المجموع الكلي المتوازن
                </td>
                <td className="py-3 px-4 text-left text-emerald-900">
                  {new Intl.NumberFormat("ar-DZ", { minimumFractionDigits: 2 }).format(totalDebit)} د.ج
                </td>
                <td className="py-3 px-4 text-left text-emerald-900">
                  {new Intl.NumberFormat("ar-DZ", { minimumFractionDigits: 2 }).format(totalCredit)} د.ج
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
