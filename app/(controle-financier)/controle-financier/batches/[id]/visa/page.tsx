import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { BatchReviewHeader } from "@/components/workflow/BatchReviewHeader";
import { PrintVisaButton } from "@/components/controle-financier/visa/PrintVisaButton";
import { Stamp, CheckCircle2, ShieldCheck, ChevronRight, FileText } from "lucide-react";

interface ControleurVisaPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "بطاقة التأشيرة المالية — المراقب المالي — UNI-PAY",
  description: "بطاقة الالتزام المالي والتأشيرة المسبقة لنفقات المستخدمين والأجور",
};

export default async function ControleurVisaPage({
  params,
}: ControleurVisaPageProps) {
  const { id } = await params;
  const user = await requireRole(["CONTROLEUR_FINANCIER", "ADMIN"]);

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      records: { select: { grossAmount: true, netAmount: true, totalDeductions: true } },
      _count: { select: { employees: true } },
      workflowActions: {
        where: {
          action: "GRANT_FINANCIAL_VISA",
        },
        include: {
          actor: true,
        },
        take: 1,
      },
    },
  });

  if (!batch || batch.organizationId !== user.organizationId) {
    notFound();
  }

  const totalGross = batch.records.reduce((sum, r) => sum + Number(r.grossAmount), 0);
  const totalNet = batch.records.reduce((sum, r) => sum + Number(r.netAmount), 0);
  const totalDeductions = totalGross - totalNet;
  const totalEmployees = batch._count.employees;

  const visaAction = batch.workflowActions[0];
  const isAuthorized = batch.status === "AUTHORIZED" || Boolean(visaAction);

  return (
    <div className="space-y-6">
      {/* ── Screen Navigation & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link
          href={`/controle-financier/batches/${batch.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-colors self-start"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة لصفحة مراجعة الدفعة</span>
        </Link>

        <div className="flex items-center gap-2">
          <PrintVisaButton />
        </div>
      </div>

      {/* ── Screen Review Header (Hidden in Print) ── */}
      <div className="print:hidden">
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
            employeeCount: batch._count?.employees ?? 0,
          }}
          backHref={`/controle-financier/batches/${batch.id}`}
          backLabel="العودة لصفحة المراجعة"
          subtitle="بطاقة التأشيرة المالية المسبقة والالتزام بمصاريف نفقات المستخدمين"
        />
      </div>

      {/* ── OFFICIAL ADMINISTRATIVE PRINTABLE CERTIFICATE ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-6 print:w-full print:block">
        
        {/* En-tête République Algérienne Officiel */}
        <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900">
          <p className="font-bold text-sm tracking-wide text-slate-900">
            الجمهورية الجزائرية الديمقراطية الشعبية
          </p>
          <p className="font-semibold text-xs text-slate-700">
            وزارة التعليم العالي والبحث العلمي
          </p>
          <p className="font-bold text-sm text-slate-900">
            جامعة الجزائر — مصلحة الرقابة المالية والميزانية
          </p>
          <div className="pt-3">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 inline-block px-4 py-1.5 border-2 border-slate-900 rounded-lg">
              بطاقة الالتزام المالي والتأشيرة المسبقة لنفقات المستخدمين
            </h1>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Fiche d&apos;Engagement Budgétaire et Visa Préalable de Contrôle Financier
            </p>
          </div>
        </div>

        {/* Méta-informations du lot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs print:bg-white print:border-slate-300">
          <div>
            <span className="text-slate-500 block text-[11px]">تسمية الدفعة:</span>
            <span className="font-bold text-slate-900 font-mono">{batch.label || `دفعة v${batch.versionNumber}`}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">السنة المالية:</span>
            <span className="font-bold text-slate-900 font-mono">{batch.period.year}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">دورة الأجر:</span>
            <span className="font-bold text-slate-900">{batch.period.month} / {batch.period.year}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">الوضعية القانونية:</span>
            <span className="font-bold text-emerald-800">
              {isAuthorized ? "تأشيرة ممنوحة (VISA ACCORDÉ)" : "قيد المعاينة (EN COURS)"}
            </span>
          </div>
        </div>

        {/* ── Tableaux des Données Budgétaires & Financières ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Tableau 1: Imputation Budgétaire */}
          <div className="border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
            <div className="bg-slate-100 p-3 border-b border-slate-300 font-bold text-slate-800 flex items-center justify-between">
              <span>بيانات التعيين والاعتماد المالي</span>
              <FileText className="w-4 h-4 text-slate-500 print:hidden" />
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">طبيعة النفقة:</span>
                <span className="font-semibold text-slate-900">نفقات المستخدمين (الأجور والتعويضات)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الباب الميزانياتي:</span>
                <span className="font-bold font-mono text-slate-900">الباب الأول — المستخدمون (Chapitre 1)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">نوع الميزانية:</span>
                <span className="font-medium text-slate-800">ميزانية التسيير للتعليم العالي</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">تعداد المستخدمين المعنيين:</span>
                <span className="font-bold font-mono text-slate-950 text-sm">{totalEmployees} موظف</span>
              </div>
            </div>
          </div>

          {/* Tableau 2: Décomposition des Montants */}
          <div className="border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
            <div className="bg-slate-100 p-3 border-b border-slate-300 font-bold text-slate-800 flex items-center justify-between">
              <span>تفصيل المبالغ المالية الملتزم بها</span>
              <Stamp className="w-4 h-4 text-slate-500 print:hidden" />
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">مبلغ الالتزام الخام (Brut Total):</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {new Intl.NumberFormat("ar-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalGross)} د.ج
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">مجموع الاقتطاعات (Retenues):</span>
                <span className="font-semibold font-mono text-amber-900">
                  {new Intl.NumberFormat("ar-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalDeductions)} د.ج
                </span>
              </div>
              <div className="flex justify-between py-1 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                <span className="text-emerald-950 font-bold">الصافي المرخص بصرفه (Net):</span>
                <span className="font-extrabold font-mono text-emerald-800 text-sm">
                  {new Intl.NumberFormat("ar-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalNet)} د.ج
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cadre Officiel d'Approbation & Cachet du Contrôleur Financier ── */}
        <div className="border-2 border-slate-800 rounded-xl p-6 bg-slate-50/40 relative print:bg-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            
            {/* Données de Visa */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-300 pb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>قرار مصالح الرقابة المالية المسبقة (Avis de Contrôle)</span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-800 pt-1">
                <p>
                  بناءً على فحص مشروعية النفقة ومطابقتها للقوانين والتنظيمات السارية، وتوفر الاعتمادات المالية المفتوحة:
                </p>
                <p className="font-bold text-emerald-800 text-sm pt-1">
                  تأشيرة مقبولة بالترخيص بصرف نفقات الأجور المذكورة أعلاه.
                </p>
                {visaAction && (
                  <div className="pt-2 text-slate-700 text-[11px] space-y-1 font-mono">
                    <p>• المراقب المالي المعتمد: <strong>{visaAction.actor.firstName && visaAction.actor.lastName ? `${visaAction.actor.firstName} ${visaAction.actor.lastName}` : (visaAction.actor.firstName || visaAction.actor.email)}</strong></p>
                    <p>• تاريخ وتوقيت منح التأشيرة: <strong>{new Date(visaAction.createdAt).toLocaleString("ar-DZ")}</strong></p>
                    {visaAction.reason && <p className="italic text-slate-600 font-sans">• ملاحظات: {visaAction.reason}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Zone de Cachet et Signature */}
            <div className="w-64 border-2 border-dashed border-slate-400 rounded-xl p-4 text-center bg-white shrink-0 self-center sm:self-auto min-h-[140px] flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-600 block">
                خاتم وتوقيع المراقب المالي
              </span>

              {isAuthorized && (
                <div className="my-2 py-1 px-2 border-2 border-emerald-600 rounded-lg text-emerald-700 font-mono font-extrabold text-xs rotate-[-3deg] inline-block mx-auto">
                  ✓ VISA ACCORDÉ
                </div>
              )}

              <span className="text-[10px] text-slate-400 font-mono block">
                جامعة الجزائر
              </span>
            </div>
          </div>
        </div>

        {/* Bas de page officiel */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
          وثيقة رسمية صادرة وموثقة آلياً عبر نظام UNI-PAY للرقابة المالية المسبقة وتسيير أجور مؤسسات التعليم العالي
        </div>
      </div>
    </div>
  );
}

