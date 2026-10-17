import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Download,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { getEmployeePayslipDetail } from "@/lib/employe/employe-service";

export const metadata: Metadata = {
  title: "تفاصيل كشف الراتب — فضاء الموظف — UNI-PAY",
  description: "البيانات التفصيلية لكشف الراتب الشهري المعتمد",
};

export default async function EmployePayslipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payslip = await getEmployeePayslipDetail(id);

  // Sécurité absolue : si le bulletin n'appartient pas à l'employé ou n'est pas AUTHORIZED, 404 immédiat
  if (!payslip) {
    notFound();
  }

  const allowances = payslip.lineItems.filter(
    (item) => item.type === "ALLOWANCE" || item.type === "BONUS"
  );
  const deductions = payslip.lineItems.filter(
    (item) => item.type === "DEDUCTION" || item.type === "CONTRIBUTION" || item.type === "TAX"
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── BARRE DE NAVIGATION & ACTIONS ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/employe/payslips"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة إلى سجل كشوف الراتب</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`/api/employe/payslips/${payslip.id}/pdf`}
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل كشف الراتب (PDF)</span>
          </a>
        </div>
      </div>

      {/* ── FEUILLE DU BULLETIN OFFICIEL (STYLYSÉE) ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-10 space-y-8">
        {/* Entête Institutionnel */}
        <div className="text-center border-b border-slate-200 pb-6 space-y-1.5">
          <p className="text-xs font-bold text-slate-600 tracking-wide">
            الجمهورية الجزائرية الديمقراطية الشعبية
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            وزارة التعليم العالي والبحث العلمي
          </p>
          <h1 className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {payslip.employee.organizationName}
          </h1>
          {payslip.employee.organizationUnitName && (
            <p className="text-xs text-slate-500 font-medium">
              {payslip.employee.organizationUnitName}
            </p>
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-extrabold border border-slate-200">
              <span>كشف الراتب الشهري (Bulletin de Paie)</span>
            </span>

            <span className="text-xs font-bold text-blue-700 font-mono">
              الفترة: {payslip.periodLabel} (v{payslip.versionNumber})
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مرخص مالياً (AUTHORIZED)</span>
            </span>
          </div>
        </div>

        {/* Cadre 1 : Identification de l'Employé */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>بيانات الموظف والحساب</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">رقم التسجيل (Matricule)</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {payslip.employee.matricule}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">الاسم واللقب</span>
              <span className="font-bold text-slate-900 text-sm">
                {payslip.employee.fullName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">الرتبة (Grade)</span>
              <span className="font-semibold text-slate-800">
                {payslip.employee.grade ?? "—"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">الوظيفة / المنصب</span>
              <span className="font-medium text-slate-800">
                {payslip.employee.position ?? "أستاذ باحث"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">المؤسسة البنكية</span>
              <span className="font-medium text-slate-800">
                {payslip.employee.bankName ?? "الخزينة العمومية"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">الحساب البنكي (RIB)</span>
              <span className="font-mono font-semibold text-slate-700">
                {payslip.employee.maskedRib ?? "حساب معتمد"}
              </span>
            </div>
          </div>
        </div>

        {/* Cadre 2 : Assiduité (si existant) */}
        {payslip.attendance && (
          <div className="rounded-xl bg-slate-50/70 border border-slate-200/60 p-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>بيانات الحضور والغياب خلال الشهر</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">أيام العمل</span>
                <span className="font-mono font-bold text-slate-800">{payslip.attendance.workingDays} يوماً</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">أيام الحضور</span>
                <span className="font-mono font-bold text-emerald-700">{payslip.attendance.presentDays} يوماً</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">الغيابات</span>
                <span className="font-mono font-bold text-red-600">{payslip.attendance.absentDays} يوماً</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">العطل والإجازات</span>
                <span className="font-mono font-bold text-blue-600">
                  {payslip.attendance.vacationDays + payslip.attendance.sickDays} يوماً
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cadre 3 : Tableau des Éléments de Paie (Gains & Retenues) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            تفاصيل عناصر الأجر والاقتطاعات
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne Gains */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
                <span>المستحقات والعلاوات (Gains)</span>
                <span>المبلغ (د.ج)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {/* Salaire de Base */}
                <div className="px-4 py-2.5 flex justify-between items-center bg-slate-50/50">
                  <span className="font-medium text-slate-900">الأجر القاعدي (Salaire de base)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {payslip.summary.baseSalary.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Indemnités & Primes */}
                {allowances.map((item) => (
                  <div key={item.id} className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-700">{item.labelAr || item.code}</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {item.amount.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50/60 px-4 py-3 border-t border-slate-200 flex justify-between items-center text-xs font-extrabold text-blue-900">
                <span>مجموع الأجر الخام (Total Brut)</span>
                <span className="font-mono text-sm">
                  {payslip.summary.grossAmount.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })} د.ج
                </span>
              </div>
            </div>

            {/* Colonne Retenues */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
                <span>الاقتطاعات النظامية (Retenues)</span>
                <span>المبلغ (د.ج)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {/* CNAS */}
                {payslip.summary.totalContributions > 0 && (
                  <div className="px-4 py-2.5 flex justify-between items-center bg-slate-50/50">
                    <span className="font-medium text-slate-900">اشتراك الضمان الاجتماعي (CNAS 9%)</span>
                    <span className="font-mono font-bold text-red-600">
                      {payslip.summary.totalContributions.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* IRG */}
                {payslip.summary.totalTaxes > 0 && (
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="font-medium text-slate-900">ضريبة الدخل الإجمالي (IRG)</span>
                    <span className="font-mono font-bold text-red-600">
                      {payslip.summary.totalTaxes.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Autres Retenues */}
                {deductions
                  .filter((item) => item.type !== "CONTRIBUTION" && item.type !== "TAX")
                  .map((item) => (
                    <div key={item.id} className="px-4 py-2.5 flex justify-between items-center">
                      <span className="text-slate-700">{item.labelAr || item.code}</span>
                      <span className="font-mono font-semibold text-red-600">
                        {item.amount.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="bg-red-50/50 px-4 py-3 border-t border-slate-200 flex justify-between items-center text-xs font-extrabold text-red-900">
                <span>مجموع الاقتطاعات (Total Retenues)</span>
                <span className="font-mono text-sm">
                  {(
                    payslip.summary.totalDeductions +
                    payslip.summary.totalContributions +
                    payslip.summary.totalTaxes
                  ).toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}{" "}
                  د.ج
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cadre 4 : NET À PAYER EN GRAND */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-right">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest block">
              الصافي المستحق للدفع (Net à Payer)
            </span>
            <p className="text-xs text-slate-400">
              المبلغ الصافي المعتمد والموجه للتحويل بعد استيفاء التأشيرة المالية
            </p>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {payslip.summary.netAmount.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-base font-bold text-blue-400 ms-2">د.ج</span>
          </div>
        </div>

        {/* Mentions Officielles */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>كشف رقمي مؤمن صادر عن منصة UNI-PAY للرقمنة الجامعية</span>
          </div>
          <span className="font-mono">معرف الوثيقة: {payslip.id}</span>
        </div>
      </div>
    </div>
  );
}
