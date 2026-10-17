import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { BatchReviewHeader } from "@/components/workflow/BatchReviewHeader";
import { Stamp, CheckCircle2, ShieldCheck } from "lucide-react";

interface ControleurVisaPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "بطاقة التأشيرة المالية — المراقب المالي — UNI-PAY",
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
      <BatchReviewHeader
        batch={batch}
        backHref={`/controle-financier/batches/${batch.id}`}
        backLabel="العودة لصفحة المراجعة"
        subtitle="بطاقة التأشيرة المالية المسبقة والالتزام بمصاريف نفقات المستخدمين"
      />

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                بطاقة الرقابة والالتزام المالي المسبق
              </h2>
              <p className="text-xs text-slate-500">
                الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التعليم العالي والبحث العلمي
              </p>
            </div>
          </div>

          <div>
            {isAuthorized ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                تأشيرة ممنوحة (VISA ACCORDÉ)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                قيد المعاينة (EN COURS)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-800">بيانات الاعتماد المالي</h3>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">طبيعة النفقة:</span>
              <span className="font-medium text-slate-900">نفقات المستخدمين (الأجور والتعويضات)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">الباب الميزانياتي:</span>
              <span className="font-mono font-medium text-slate-900">الباب الأول — المستخدمون</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">دورة الدفع:</span>
              <span className="font-semibold text-slate-900">{batch.period.month} / {batch.period.year}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">تعداد المستخدمين المعنيين:</span>
              <span className="font-mono font-bold text-slate-900">{totalEmployees} موظف</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-800">بيانات المبالغ المالية الملتزم بها</h3>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">مبلغ الالتزام الخام (Brut):</span>
              <span className="font-mono font-bold text-slate-900">
                {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 2 }).format(totalGross)} د.ج
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">مجموع الاقتطاعات (Retenues):</span>
              <span className="font-mono text-amber-900 font-medium">
                {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 2 }).format(totalDeductions)} د.ج
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">الصافي المرخص بصرفه (Net):</span>
              <span className="font-mono font-bold text-emerald-800">
                {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 2 }).format(totalNet)} د.ج
              </span>
            </div>
          </div>
        </div>

        {visaAction && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>بيانات منح التأشيرة المسجلة</span>
            </div>
            <p>
              مُنحت التأشيرة بواسطة: <strong>{visaAction.actor.firstName && visaAction.actor.lastName ? `${visaAction.actor.firstName} ${visaAction.actor.lastName}` : (visaAction.actor.firstName || visaAction.actor.email)}</strong>
            </p>
            <p>
              التاريخ والتوقيت: {new Date(visaAction.createdAt).toLocaleString("ar-DZ")}
            </p>
            {visaAction.reason && (
              <p className="italic mt-1">ملاحظات: {visaAction.reason}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
