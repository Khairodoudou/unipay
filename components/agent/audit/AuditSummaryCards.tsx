"use client";

import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ListFilter,
  ShieldAlert,
} from "lucide-react";
import { AuditSummaryData } from "@/lib/audit/types";

interface AuditSummaryCardsProps {
  summary: AuditSummaryData;
  activeSeverityFilter?: string;
  onSeverityClick?: (severity: string) => void;
}

export function AuditSummaryCards({
  summary,
  activeSeverityFilter,
  onSeverityClick,
}: AuditSummaryCardsProps) {
  const cards = [
    {
      id: "ALL",
      labelAr: "إجمالي الملاحظات",
      count: summary.totalFindings,
      icon: ListFilter,
      color: "text-slate-900",
      bg: "bg-slate-50",
      border: "border-slate-200",
      ring: activeSeverityFilter === "" ? "ring-2 ring-teal-600" : "",
    },
    {
      id: "CRITICAL",
      labelAr: "حرجة (مانعة)",
      count: summary.critical,
      icon: AlertOctagon,
      color: "text-rose-700",
      bg: "bg-rose-50/70",
      border: "border-rose-200",
      ring: activeSeverityFilter === "CRITICAL" ? "ring-2 ring-rose-600" : "",
    },
    {
      id: "HIGH",
      labelAr: "شديدة الأهمية",
      count: summary.high,
      icon: ShieldAlert,
      color: "text-orange-700",
      bg: "bg-orange-50/70",
      border: "border-orange-200",
      ring: activeSeverityFilter === "HIGH" ? "ring-2 ring-orange-600" : "",
    },
    {
      id: "WARNING",
      labelAr: "تنبيهات تدقيق",
      count: summary.warning,
      icon: AlertTriangle,
      color: "text-amber-700",
      bg: "bg-amber-50/70",
      border: "border-amber-200",
      ring: activeSeverityFilter === "WARNING" ? "ring-2 ring-amber-600" : "",
    },
    {
      id: "INFO",
      labelAr: "إعلامية",
      count: summary.info,
      icon: Info,
      color: "text-blue-700",
      bg: "bg-blue-50/70",
      border: "border-blue-200",
      ring: activeSeverityFilter === "INFO" ? "ring-2 ring-blue-600" : "",
    },
    {
      id: "RESOLVED",
      labelAr: "تمت التسوية",
      count: summary.resolved + summary.falsePositive,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50/70",
      border: "border-emerald-200",
      ring: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const clickable = Boolean(onSeverityClick && card.id !== "RESOLVED");

        return (
          <button
            key={card.id}
            type="button"
            disabled={!clickable}
            onClick={() => onSeverityClick?.(card.id === "ALL" ? "" : card.id)}
            className={`p-3.5 rounded-2xl border ${card.border} ${card.bg} ${card.ring} flex flex-col justify-between text-right transition-all ${
              clickable ? "hover:scale-[1.02] cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-center justify-between">
              <Icon className={`w-4 h-4 ${card.color}`} />
              <span className={`text-xl font-extrabold font-mono ${card.color}`}>
                {card.count}
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-700 truncate">
              {card.labelAr}
            </div>
          </button>
        );
      })}
    </div>
  );
}
