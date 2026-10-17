"use client";

/**
 * components/workflow/WorkflowAuditFindings.tsx
 * Affichage synthétique des anomalies d'audit pour les décideurs du workflow.
 */

import { AlertTriangle, AlertCircle, Info, ShieldCheck, CheckCircle2 } from "lucide-react";

export interface AuditFindingSummary {
  id: string;
  ruleCode?: string;
  type?: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  category?: string;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  status: "OPEN" | "REVIEWED" | "RESOLVED" | "FALSE_POSITIVE" | string;
  employee?: {
    id: string;
    matricule: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

interface WorkflowAuditFindingsProps {
  findings: AuditFindingSummary[];
  title?: string;
  showAllIfEmpty?: boolean;
}

const SEVERITY_CONFIG: Record<string, { label: string; badgeClass: string; icon: typeof AlertCircle }> = {
  CRITICAL: {
    label: "حرج",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
  },
  HIGH: {
    label: "عالي",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: "متوسط",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Info,
  },
  LOW: {
    label: "منخفض",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Info,
  },
  INFO: {
    label: "إعلامي",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
    icon: Info,
  },
};

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  OPEN: { label: "مفتوح", class: "text-rose-700 bg-rose-50" },
  REVIEWED: { label: "قيد المراجعة", class: "text-amber-700 bg-amber-50" },
  RESOLVED: { label: "تم التصحيح", class: "text-emerald-700 bg-emerald-50" },
  FALSE_POSITIVE: { label: "إنذار خاطئ", class: "text-slate-600 bg-slate-100" },
};

export function WorkflowAuditFindings({
  findings,
  title = "نتائج التدقيق الذكي (Smart Audit)",
}: WorkflowAuditFindingsProps) {
  const criticalCount = findings.filter((f) => f.severity === "CRITICAL" && f.status === "OPEN").length;
  const highCount = findings.filter((f) => f.severity === "HIGH" && f.status === "OPEN").length;
  const mediumCount = findings.filter((f) => f.severity === "MEDIUM" && f.status === "OPEN").length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            فحص آلي تم عبر محرك القواعد والذكاء الاصطناعي قبل تقديم الدفعة
          </p>
        </div>

        {/* Badges de comptage */}
        <div className="flex items-center gap-2 text-xs">
          {criticalCount > 0 && (
            <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-full border border-red-200">
              {criticalCount} حرج
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold rounded-full border border-amber-200">
              {highCount} عالي
            </span>
          )}
          {mediumCount > 0 && (
            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 font-medium rounded-full border border-yellow-200">
              {mediumCount} متوسط
            </span>
          )}
          {findings.length === 0 && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              لا توجد ملاحظات
            </span>
          )}
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-slate-800">سجل التدقيق نظيف تماماً</p>
          <p className="text-xs text-slate-500 mt-1">لم يتم رصد أي خلل أو تعارض حسابي أو تنظيمي في هذه الدفعة.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {findings.map((f) => {
            const config = SEVERITY_CONFIG[f.severity] || SEVERITY_CONFIG.INFO;
            const SeverityIcon = config.icon;
            const statusInfo = STATUS_LABELS[f.status] || { label: f.status, class: "bg-slate-100 text-slate-700" };

            return (
              <div key={f.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <SeverityIcon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${config.badgeClass}`}>
                          {config.label}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-500">
                          {f.ruleCode || f.type}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">{f.titleAr || f.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{f.descriptionAr || f.description}</p>
                      {f.employee && (
                        <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-200">
                          الموظف: <span className="font-semibold text-slate-800">{f.employee.lastName} {f.employee.firstName}</span> ({f.employee.matricule})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
