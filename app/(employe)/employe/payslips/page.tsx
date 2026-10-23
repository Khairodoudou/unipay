import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Filter,
} from "lucide-react";
import {
  getEmployeePayslips,
  getAvailablePayslipYears,
} from "@/lib/employe/employe-service";

export const metadata: Metadata = {
  title: "كشوف الراتب — فضاء الموظف — أكاديميا شفاف",
  description: "سجل كشوف الراتب الشهرية المعتمدة والمتاحة للتحميل والطباعة",
};

export default async function EmployePayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const selectedYear = yearParam ? parseInt(yearParam, 10) : undefined;

  const [payslips, availableYears] = await Promise.all([
    getEmployeePayslips({ year: selectedYear }),
    getAvailablePayslipYears(),
  ]);

  return (
    <div className="space-y-6">
      {/* ── EN-TÊTE DE LA PAGE & FILTRES ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>أرشيف كشوف الراتب الشهرية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            كشوف الأجور الرسمية الصادرة والمؤشر عليها بالترخيص المالي (AUTHORIZED)
          </p>
        </div>

        {/* Filtre par Année */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold">
            <Link
              href="/employe/payslips"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                !selectedYear
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الكل
            </Link>
            {availableYears.map((yr) => (
              <Link
                key={yr}
                href={`/employe/payslips?year=${yr}`}
                className={`px-3 py-1.5 rounded-lg transition-colors font-mono ${
                  selectedYear === yr
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {yr}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── LISTE OU TABLEAU DES BULLETINS ─────────────────────────────────── */}
      {payslips.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">فترة الكشف</th>
                  <th className="py-3.5 px-4">الأجر الخام (Brut)</th>
                  <th className="py-3.5 px-4">مجموع الاقتطاعات</th>
                  <th className="py-3.5 px-4">الصافي للدفع (Net)</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payslips.map((payslip) => (
                  <tr
                    key={payslip.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {payslip.periodLabel}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            الإصدار v{payslip.versionNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-medium text-slate-700">
                      {payslip.grossAmount.toLocaleString("fr-DZ", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-slate-400">د.ج</span>
                    </td>

                    <td className="py-4 px-4 font-mono font-medium text-red-600">
                      -
                      {(
                        payslip.totalDeductions +
                        payslip.totalContributions +
                        payslip.totalTaxes
                      ).toLocaleString("fr-DZ", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-slate-400">د.ج</span>
                    </td>

                    <td className="py-4 px-4 font-mono font-extrabold text-slate-900">
                      {payslip.netAmount.toLocaleString("fr-DZ", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-slate-500 font-bold">د.ج</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{payslip.statusTextAr}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/employe/payslips/${payslip.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="عرض تفاصيل الكشف"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">معاينة</span>
                        </Link>

                        <a
                          href={`/api/employe/payslips/${payslip.id}/pdf`}
                          download
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
                          title="تحميل كشف الراتب بصيغة PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">تنزيل PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              لا توجد كشوف راتب متاحة حالياً
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              لم تصدر بعد كشوف رواتب معتمدة بالتأشيرة المالية الرسمية (AUTHORIZED) للفترة المحددة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
