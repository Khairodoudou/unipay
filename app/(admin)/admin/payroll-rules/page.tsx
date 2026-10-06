import type { Metadata } from "next";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import {
  PayrollRulesTable,
  CreatePayrollRuleForm,
} from "@/components/admin/payroll-rules/PayrollRulesManager";
import { Scale, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "قواعد الأجور — UNI-PAY",
  description: "بنية قواعد الأجور القابلة للتهيئة والإصدار لمنصة UNI-PAY",
};

export default async function AdminPayrollRulesPage() {
  await requireRole("ADMIN");

  const rules = await prisma.payrollRule.findMany({
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
      },
    },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  // Sérialiser les dates pour les Client Components
  const serializedRules = rules.map((rule) => ({
    ...rule,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    versions: rule.versions.map((v) => ({
      ...v,
      effectiveFrom: v.effectiveFrom.toISOString(),
      effectiveTo: v.effectiveTo ? v.effectiveTo.toISOString() : null,
      createdAt: v.createdAt.toISOString(),
    })),
  }));

  const activeCount = rules.filter((r) => r.isActive).length;
  const inactiveCount = rules.length - activeCount;
  const totalVersions = rules.reduce((acc, r) => acc + r.versions.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-teal-600" />
            <span>قواعد الأجور القابلة للتهيئة</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            بنية تحتية لإدارة قواعد الحساب والمعاملات المرجعية مع تتبع التغييرات التاريخية
          </p>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
            {activeCount} نشطة
          </span>
          {inactiveCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
              {inactiveCount} معطّلة
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            {totalVersions} إصدار مسجّل
          </span>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed space-y-1">
          <p>
            <strong className="font-bold">ملاحظة قانونية هامة:</strong> هذه الوحدة توفر بنية
            تحتية لتهيئة قواعد الحساب وتتبع تاريخها. القيم المُدخلة هي قيم مرجعية داخلية تحتاج
            للتحقق من مصادرها الرسمية (مراسيم، قرارات وزارية، قوانين المالية).
          </p>
          <p>
            لا تُمثّل أي قيمة في هذا النظام تصريحاً قانونياً بالامتثال للتشريعات الجزائرية
            الجبائية أو الاجتماعية المعمول بها.
          </p>
        </div>
      </div>

      {/* Create Form (Accordion) */}
      <CreatePayrollRuleForm />

      {/* Rules Table */}
      <PayrollRulesTable rules={serializedRules} />
    </div>
  );
}
