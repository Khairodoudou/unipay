"use client";

/**
 * components/workflow/BatchReviewHeader.tsx
 * En-tête institutionnel pour la revue d'un lot de paie dans les espaces décisionnels.
 *
 * Accepte les totaux comme plain numbers (totalGross, totalNet, totalDeductions)
 * pour éviter le passage de Decimal Prisma depuis les Server Components.
 */

import Link from "next/link";
import { ArrowRight, Calendar, Users, DollarSign, FileText } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface BatchReviewHeaderProps {
  batch: {
    id: string;
    versionNumber?: number;
    label?: string | null;
    status: string;
    period: {
      month: number;
      year: number;
      label?: string;
      status?: string;
    };
    /** Pre-aggregated totals as plain numbers — compute these in the Server Component */
    totalGross?: number;
    totalNet?: number;
    totalDeductions?: number;
    employeeCount?: number;
    _count?: {
      employees?: number;
      records?: number;
    };
  };
  backHref: string;
  backLabel?: string;
  subtitle?: string;
}

const MONTH_NAMES_AR = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function BatchReviewHeader({
  batch,
  backHref,
  backLabel = "العودة للقائمة",
  subtitle,
}: BatchReviewHeaderProps) {
  const periodLabel =
    batch.period.label ||
    `${MONTH_NAMES_AR[batch.period.month - 1] || batch.period.month} ${batch.period.year}`;
  const versionNum = batch.versionNumber ?? 1;
  const batchDisplay = batch.label || `دفعة ${periodLabel} (v${versionNum})`;

  const totalEmployees =
    batch.employeeCount ?? batch._count?.employees ?? 0;
  const totalGross = batch.totalGross ?? 0;
  const totalNet = batch.totalNet ?? 0;
  const totalDeductions = batch.totalDeductions ?? (totalGross - totalNet);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 mb-6">
      {/* Navigation retour & Statut */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{backLabel}</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            النسخة v{versionNum}
          </span>
          <StatusBadge status={batch.status} size="md" />
        </div>
      </div>

      {/* Titre & Période */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full w-fit mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>دورة الأجر: {periodLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            دفعة الأجور: <span className="font-mono text-blue-900">{batchDisplay}</span>
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>عدد الموظفين</span>
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {totalEmployees.toLocaleString("ar-DZ")}
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>إجمالي الخام (Brut)</span>
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            {formatCurrency(totalGross)}
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>الاقتطاعات (Retenues)</span>
          </div>
          <p className="text-base font-bold text-amber-900 font-mono">
            {formatCurrency(totalDeductions)}
          </p>
        </div>

        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>الصافي للدفع (Net)</span>
          </div>
          <p className="text-lg font-bold text-emerald-900 font-mono">
            {formatCurrency(totalNet)}
          </p>
        </div>
      </div>
    </div>
  );
}
