"use client";

import { useState, useMemo } from "react";
import {
  History,
  Search,
  Filter,
  Calendar,
  X,
  RotateCcw,
  CheckCircle2,
  User,
  MessageSquare,
  Send,
} from "lucide-react";
import { WORKFLOW_ACTION_LABELS, BATCH_STATUS_LABELS } from "@/lib/workflow/states";

export interface SerializedComptableAction {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  reason?: string | null;
  createdAt: string;
  actor: {
    name: string;
    email: string;
    roleCode: string;
    roleNameAr: string;
  };
  batch: {
    id: string;
    label: string | null;
    periodMonth: number | null;
    periodYear: number | null;
  };
}

interface ComptableHistoryFilterViewProps {
  actions: SerializedComptableAction[];
  availableYears: number[];
}

const MONTH_NAMES = [
  "جانفي (01)", "فيفري (02)", "مارس (03)", "أفريل (04)",
  "ماي (05)", "جوان (06)", "جويلية (07)", "أوت (08)",
  "سبتمبر (09)", "أكتوبر (10)", "نوفمبر (11)", "ديسمبر (12)",
];

export function ComptableHistoryFilterView({ actions, availableYears }: ComptableHistoryFilterViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [actionType, setActionType] = useState<string>("ALL");

  const validYears = useMemo(() => {
    const list = availableYears.filter((y) => y >= 2024 && y <= 2035).sort((a, b) => a - b);
    return list.length === 0 ? [2025, 2026, 2027, 2028, 2029] : list;
  }, [availableYears]);

  const stats = useMemo(() => {
    let validates = 0, returns = 0, withNotes = 0;
    for (const a of actions) {
      if (a.action.includes("VALIDATE") || a.action.includes("VISA")) validates++;
      else if (a.action.includes("RETURN")) returns++;
      if (a.reason && a.reason.trim()) withNotes++;
    }
    return { total: actions.length, validates, returns, withNotes };
  }, [actions]);

  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      if (selectedYear !== "ALL" && act.batch.periodYear !== Number(selectedYear)) return false;
      if (selectedMonth !== "ALL" && act.batch.periodMonth !== Number(selectedMonth)) return false;
      if (actionType === "VALIDATE" && !act.action.includes("VALIDATE") && !act.action.includes("VISA")) return false;
      if (actionType === "RETURN" && !act.action.includes("RETURN")) return false;
      if (actionType === "WITH_NOTES" && !(act.reason && act.reason.trim())) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const batchLabel = (act.batch.label || "").toLowerCase();
        const actorName = act.actor.name.toLowerCase();
        if (!batchLabel.includes(q) && !actorName.includes(q) && !act.actor.email.includes(q)) return false;
      }
      return true;
    });
  }, [actions, selectedYear, selectedMonth, actionType, searchTerm]);

  const hasActiveFilters = searchTerm !== "" || selectedYear !== "ALL" || selectedMonth !== "ALL" || actionType !== "ALL";
  const resetFilters = () => { setSearchTerm(""); setSelectedYear("ALL"); setSelectedMonth("ALL"); setActionType("ALL"); };

  const getActionBadge = (action: string) => {
    if (action.includes("VALIDATE") || action.includes("VISA")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {WORKFLOW_ACTION_LABELS[action] || action}
        </span>
      );
    }
    if (action.includes("RETURN")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <RotateCcw className="w-3.5 h-3.5" />
          {WORKFLOW_ACTION_LABELS[action] || action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Send className="w-3.5 h-3.5" />
        {WORKFLOW_ACTION_LABELS[action] || action}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الإجراءات", value: stats.total, color: "slate" },
          { label: "تأشيرات وتحقق", value: stats.validates, color: "emerald" },
          { label: "إعادات للتصحيح", value: stats.returns, color: "rose" },
          { label: "بملاحظات", value: stats.withNotes, color: "amber" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white border rounded-2xl p-4 shadow-xs border-slate-200`}>
            <p className="text-xs font-semibold text-slate-500 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold font-mono ${kpi.color === "emerald" ? "text-emerald-700" : kpi.color === "rose" ? "text-rose-700" : kpi.color === "amber" ? "text-amber-700" : "text-slate-900"}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث بتسمية الدفعة أو المسؤول..." className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all" />
            {searchTerm && (<button onClick={() => setSearchTerm("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[120px]">
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                <option value="ALL">كل السنوات</option>
                {validYears.map((yr) => <option key={yr} value={yr}>سنة {yr}</option>)}
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative min-w-[120px]">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                <option value="ALL">كل الأشهر</option>
                {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative min-w-[160px]">
              <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                <option value="ALL">جميع الإجراءات</option>
                <option value="VALIDATE">التأشيرات والتحقق</option>
                <option value="RETURN">الإعادات للتصحيح</option>
                <option value="WITH_NOTES">بملاحظات فقط</option>
              </select>
              <History className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {hasActiveFilters && (<button onClick={resetFilters} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /><span>إعادة ضبط</span></button>)}
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-500 font-medium px-1">
        {filteredActions.length === 0 ? "لا توجد إجراءات تطابق الفلاتر" : `${filteredActions.length} إجراء معروض`}
        {hasActiveFilters && filteredActions.length !== actions.length && <span className="text-slate-400"> من أصل {actions.length}</span>}
      </p>

      {/* Results */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredActions.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">لا توجد إجراءات تطابق الفلاتر</p>
            {hasActiveFilters && <button onClick={resetFilters} className="mt-3 text-xs text-emerald-600 hover:underline font-semibold">إعادة ضبط الفلاتر</button>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActions.map((act) => {
              const dateStr = new Date(act.createdAt).toLocaleString("ar-DZ", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
              return (
                <div key={act.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(act.action)}
                      <span className="text-xs text-slate-400">
                        من: <span className="font-medium text-slate-600">{BATCH_STATUS_LABELS[act.fromStatus]?.ar || act.fromStatus}</span>
                        {" "}إلى: <span className="font-medium text-slate-600">{BATCH_STATUS_LABELS[act.toStatus]?.ar || act.toStatus}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900">{act.actor.name}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">{act.actor.roleNameAr}</span>
                    {act.batch.periodMonth && act.batch.periodYear && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-500">{act.batch.periodMonth}/{act.batch.periodYear}</span>
                      </>
                    )}
                    {act.batch.label && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600 truncate max-w-[200px]">{act.batch.label}</span>
                      </>
                    )}
                  </div>

                  {act.reason && (
                    <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block mb-0.5">ملاحظات محاسبية:</span>
                        <p className="whitespace-pre-line leading-relaxed">{act.reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
