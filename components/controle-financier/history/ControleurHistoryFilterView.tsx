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
  Stamp,
  Clock,
} from "lucide-react";
import { WORKFLOW_ACTION_LABELS, BATCH_STATUS_LABELS } from "@/lib/workflow/states";

export interface SerializedControleurAction {
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

interface ControleurHistoryFilterViewProps {
  actions: SerializedControleurAction[];
  availableYears: number[];
}

const MONTH_NAMES = [
  "جانفي (01)", "فيفري (02)", "مارس (03)", "أفريل (04)",
  "ماي (05)", "جوان (06)", "جويلية (07)", "أوت (08)",
  "سبتمبر (09)", "أكتوبر (10)", "نوفمبر (11)", "ديسمبر (12)",
];

export function ControleurHistoryFilterView({ actions, availableYears }: ControleurHistoryFilterViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [actionType, setActionType] = useState<string>("ALL");

  const validYears = useMemo(() => {
    const list = availableYears.filter((y) => y >= 2024 && y <= 2035).sort((a, b) => a - b);
    return list.length === 0 ? [2025, 2026, 2027, 2028, 2029] : list;
  }, [availableYears]);

  const stats = useMemo(() => {
    return {
      total: actions.length,
      visas: actions.filter((a) => a.action === "GRANT_FINANCIAL_VISA").length,
      returned: actions.filter((a) => a.action.includes("RETURN")).length,
      withNotes: actions.filter((a) => a.reason && a.reason.trim().length > 0).length,
    };
  }, [actions]);

  const filteredActions = useMemo(() => {
    return actions.filter((item) => {
      // Filter year
      if (selectedYear !== "ALL") {
        const itemYear = item.batch.periodYear ? String(item.batch.periodYear) : String(new Date(item.createdAt).getFullYear());
        if (itemYear !== selectedYear) return false;
      }

      // Filter month
      if (selectedMonth !== "ALL") {
        const itemMonth = item.batch.periodMonth ? String(item.batch.periodMonth) : String(new Date(item.createdAt).getMonth() + 1);
        if (itemMonth !== selectedMonth) return false;
      }

      // Filter action type
      if (actionType !== "ALL") {
        if (actionType === "VISA" && item.action !== "GRANT_FINANCIAL_VISA") return false;
        if (actionType === "RETURN" && !item.action.includes("RETURN")) return false;
        if (actionType === "REVIEW" && !item.action.includes("TAKE")) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchBatch = (item.batch.label || "").toLowerCase().includes(q);
        const matchActor = (item.actor.name || "").toLowerCase().includes(q) || (item.actor.email || "").toLowerCase().includes(q);
        const matchReason = (item.reason || "").toLowerCase().includes(q);
        if (!matchBatch && !matchActor && !matchReason) return false;
      }

      return true;
    });
  }, [actions, selectedYear, selectedMonth, actionType, searchTerm]);

  const hasActiveFilters = searchTerm !== "" || selectedYear !== "ALL" || selectedMonth !== "ALL" || actionType !== "ALL";

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedYear("ALL");
    setSelectedMonth("ALL");
    setActionType("ALL");
  };

  return (
    <div className="space-y-6">
      {/* ── KPIs Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي العمليات</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-800 mt-2">{stats.total}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">تأشيرات مالية ممنوحة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">{stats.visas}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">إعادات للتصحيح</span>
            <RotateCcw className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-2">{stats.returned}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">بملاحظات وتعليلات</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-2">{stats.withNotes}</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث باسم الدفعة، المراقب، أو سبب التأشيرة..."
              className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action type */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">نوع العملية:</span>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">جميع العمليات</option>
              <option value="VISA">تأشيرة مالية (GRANT_VISA)</option>
              <option value="RETURN">إعادة للتصحيح (RETURN)</option>
              <option value="REVIEW">استلام للرقابة (TAKE_REVIEW)</option>
            </select>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">السنة:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">جميع السنوات</option>
              {validYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">الشهر:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">جميع الأشهر</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Timeline List ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredActions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">لا توجد عمليات مسجلة مطابقة للفلاتر</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActions.map((item) => {
              const actionLabel = WORKFLOW_ACTION_LABELS[item.action] ?? item.action;
              const isVisa = item.action === "GRANT_FINANCIAL_VISA";
              const isReturn = item.action.includes("RETURN");
              const isTake = item.action.includes("TAKE");

              const badgeColor = isVisa
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : isReturn
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : isTake
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 text-slate-700 border-slate-200";

              return (
                <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100">
                        <Stamp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.batch.label || "دفعة رواتب"}
                          </span>
                          {item.batch.periodMonth && item.batch.periodYear && (
                            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                              {item.batch.periodMonth}/{item.batch.periodYear}
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                            {actionLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {item.actor.name} ({item.actor.roleNameAr || item.actor.roleCode})
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(item.createdAt).toLocaleString("ar-DZ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1 self-start sm:self-auto font-mono">
                      <span>{BATCH_STATUS_LABELS[item.fromStatus]?.ar ?? item.fromStatus}</span>
                      <span>←</span>
                      <strong className="text-slate-800">{BATCH_STATUS_LABELS[item.toStatus]?.ar ?? item.toStatus}</strong>
                    </div>
                  </div>

                  {item.reason && (
                    <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs text-slate-700 border border-slate-200/70 mr-12">
                      <span className="font-semibold text-slate-800 ml-1">الملاحظات / السند القانوني:</span>
                      <span>{item.reason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 text-center py-1">
        عرض {filteredActions.length} من إجمالي {actions.length} عملية مسجلة
      </div>
    </div>
  );
}
