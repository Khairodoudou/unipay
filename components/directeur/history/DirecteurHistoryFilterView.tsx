"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  RotateCcw,
  Send,
  User,
  Calendar,
  MessageSquare,
  Crown,
  ExternalLink,
  X,
  FileCheck2,
} from "lucide-react";
import { WORKFLOW_ACTION_LABELS, BATCH_STATUS_LABELS } from "@/lib/workflow/states";

export interface SerializedDirecteurAction {
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
    periodMonth?: number | null;
    periodYear?: number | null;
  };
}

interface DirecteurHistoryFilterViewProps {
  actions: SerializedDirecteurAction[];
  availableYears: number[];
}

const MONTH_NAMES = [
  "جانفي (01)",
  "فيفري (02)",
  "مارس (03)",
  "أفريل (04)",
  "ماي (05)",
  "جوان (06)",
  "جويلية (07)",
  "أوت (08)",
  "سبتمبر (09)",
  "أكتوبر (10)",
  "نوفمبر (11)",
  "ديسمبر (12)",
];

type ActionTabFilter =
  | "ALL"
  | "DIRECTEUR_APPROVE"
  | "DIRECTEUR_RETURN"
  | "CHEF_APPROVE"
  | "ACCOUNTING_FINANCIAL";

export function DirecteurHistoryFilterView({
  actions,
  availableYears,
}: DirecteurHistoryFilterViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ActionTabFilter>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);

  // Filter to legitimate fiscal years only
  const validYears = useMemo(() => {
    const list = availableYears
      .filter((y) => y >= 2024 && y <= 2035)
      .sort((a, b) => a - b);
    return list.length === 0 ? [2025, 2026, 2027, 2028, 2029] : list;
  }, [availableYears]);

  // Stats calculation
  const stats = useMemo(() => {
    let dirApprovals = 0;
    let dirReturns = 0;
    let withNotes = 0;
    let chefApprovals = 0;
    let accountingFinancial = 0;

    for (const a of actions) {
      if (a.action === "APPROVE_DIRECTOR") dirApprovals++;
      else if (a.action === "RETURN_BY_DIRECTOR") dirReturns++;
      else if (a.action === "APPROVE_CHEF") chefApprovals++;
      else if (["VALIDATE_ACCOUNTING", "GRANT_FINANCIAL_VISA"].includes(a.action)) accountingFinancial++;

      if (a.reason && a.reason.trim()) withNotes++;
    }

    return {
      total: actions.length,
      dirApprovals,
      dirReturns,
      withNotes,
      chefApprovals,
      accountingFinancial,
    };
  }, [actions]);

  // Filtering
  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      // Tab filter
      if (activeTab === "DIRECTEUR_APPROVE" && act.action !== "APPROVE_DIRECTOR") return false;
      if (activeTab === "DIRECTEUR_RETURN" && act.action !== "RETURN_BY_DIRECTOR") return false;
      if (activeTab === "CHEF_APPROVE" && act.action !== "APPROVE_CHEF") return false;
      if (
        activeTab === "ACCOUNTING_FINANCIAL" &&
        !["VALIDATE_ACCOUNTING", "RETURN_BY_ACCOUNTING", "GRANT_FINANCIAL_VISA", "RETURN_BY_FINANCIAL"].includes(act.action)
      ) {
        return false;
      }

      // Role filter
      if (selectedRole !== "ALL" && act.actor.roleCode !== selectedRole) {
        return false;
      }

      // Year filter
      if (selectedYear !== "ALL" && act.batch.periodYear !== Number(selectedYear)) {
        return false;
      }

      // Month filter
      if (selectedMonth !== "ALL" && act.batch.periodMonth !== Number(selectedMonth)) {
        return false;
      }

      // Notes filter
      if (onlyWithNotes && (!act.reason || !act.reason.trim())) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const reasonMatch = (act.reason || "").toLowerCase().includes(q);
        const batchMatch = (act.batch.label || "").toLowerCase().includes(q);
        const actorMatch = act.actor.name.toLowerCase().includes(q);
        const emailMatch = act.actor.email.toLowerCase().includes(q);
        const actionLabel = (WORKFLOW_ACTION_LABELS[act.action] || act.action).toLowerCase();
        const actionMatch = actionLabel.includes(q);

        if (!reasonMatch && !batchMatch && !actorMatch && !emailMatch && !actionMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    actions,
    activeTab,
    selectedRole,
    selectedYear,
    selectedMonth,
    onlyWithNotes,
    searchTerm,
  ]);

  const hasActiveFilters =
    activeTab !== "ALL" ||
    selectedRole !== "ALL" ||
    selectedYear !== "ALL" ||
    selectedMonth !== "ALL" ||
    onlyWithNotes ||
    searchTerm.trim() !== "";

  const resetFilters = () => {
    setActiveTab("ALL");
    setSelectedRole("ALL");
    setSelectedYear("ALL");
    setSelectedMonth("ALL");
    setOnlyWithNotes(false);
    setSearchTerm("");
  };

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVE") || action.includes("VALIDATE") || action.includes("VISA")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {WORKFLOW_ACTION_LABELS[action] || action}
        </span>
      );
    }
    if (action.includes("RETURN") || action.includes("REJECT")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <RotateCcw className="w-3.5 h-3.5" />
          {WORKFLOW_ACTION_LABELS[action] || action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <Send className="w-3.5 h-3.5" />
        {WORKFLOW_ACTION_LABELS[action] || action}
      </span>
    );
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* ── Top KPI Statistics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إجمالي القرارات</span>
            <History className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">عملية مسجلة في المؤسسة</p>
        </div>

        {/* Directeur Approvals */}
        <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-xs bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold">مصادقات المدير</span>
            <Crown className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700">
            {stats.dirApprovals}
          </div>
          <p className="text-[11px] text-purple-600 mt-0.5">اعتماد إداري صادر</p>
        </div>

        {/* Directeur Returns */}
        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-bold">إعادات للتصحيح</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700">
            {stats.dirReturns}
          </div>
          <p className="text-[11px] text-rose-600 mt-0.5">أوامر إعادة لمصلحة الموظفين</p>
        </div>

        {/* Actions with Notes */}
        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold">قرارات بملاحظات</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800">
            {stats.withNotes}
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5">تتضمن توجيهات وأسباب معللة</p>
        </div>
      </div>

      {/* ── Control Bar ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search & Selects */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في الملاحظات، أسباب الإعادة، تسمية الدفعة، أو اسم المسؤول..."
              className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Actor Role Filter */}
            <div className="relative min-w-[130px]">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="ALL">كل المسؤولين</option>
                <option value="DIRECTEUR">مدير الجامعة</option>
                <option value="CHEF_SERVICE">رئيس المصلحة</option>
                <option value="COMPTABLE">المحاسب المالي</option>
                <option value="CONTROLEUR_FINANCIER">المراقب المالي</option>
                <option value="AGENT_RH">عون الأجور (RH)</option>
              </select>
              <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Year Select */}
            <div className="relative min-w-[110px]">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="ALL">كل السنوات</option>
                {validYears.map((yr) => (
                  <option key={yr} value={yr}>
                    سنة {yr}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Month Select */}
            <div className="relative min-w-[120px]">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="ALL">كل الأشهر</option>
                {MONTH_NAMES.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Type Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>جميع الإجراءات</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "ALL" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"
                }`}
              >
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("DIRECTEUR_APPROVE")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "DIRECTEUR_APPROVE"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>مصادقات المدير</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "DIRECTEUR_APPROVE"
                    ? "bg-purple-700 text-white"
                    : "bg-purple-200 text-purple-800 font-bold"
                }`}
              >
                {stats.dirApprovals}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("DIRECTEUR_RETURN")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "DIRECTEUR_RETURN"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادات المدير للتصحيح</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "DIRECTEUR_RETURN"
                    ? "bg-rose-700 text-white"
                    : "bg-rose-200 text-rose-800 font-bold"
                }`}
              >
                {stats.dirReturns}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("CHEF_APPROVE")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "CHEF_APPROVE"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مصادقات رئيس المصلحة</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "CHEF_APPROVE"
                    ? "bg-blue-700 text-blue-100"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {stats.chefApprovals}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ACCOUNTING_FINANCIAL")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "ACCOUNTING_FINANCIAL"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>تأشيرات المحاسب والمراقب المالي</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "ACCOUNTING_FINANCIAL"
                    ? "bg-emerald-700 text-emerald-100"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {stats.accountingFinancial}
              </span>
            </button>
          </div>

          {/* Toggle for Only Notes */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 select-none py-1">
            <input
              type="checkbox"
              checked={onlyWithNotes}
              onChange={(e) => setOnlyWithNotes(e.target.checked)}
              className="w-4 h-4 rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span>تصفية القرارات ذات الملاحظات فقط</span>
          </label>
        </div>
      </div>

      {/* ── Filtered Actions List ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              سجل القرارات الإدارية والتنفيذية
            </h3>
            <span className="text-xs text-slate-500">
              (عرض {filteredActions.length} من أصل {actions.length})
            </span>
          </div>

          {hasActiveFilters && (
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/50">
              فلاتر نشطة
            </span>
          )}
        </div>

        {filteredActions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 mb-1">
              لا توجد قرارات مطابقة لمعايير التصفية
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              جرّب تغيير كلمات البحث أو إعادة ضبط خيارات الفلترة لعرض سجل العمليات.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط جميع الفلاتر</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActions.map((act) => {
              const formattedDate = new Date(act.createdAt).toLocaleString("ar-DZ", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={act.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Top Bar: Action Badge + Status Transition + Date + Batch Link */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {getActionBadge(act.action)}

                      <span className="text-xs text-slate-400">
                        من:{" "}
                        <span className="font-semibold text-slate-700">
                          {BATCH_STATUS_LABELS[act.fromStatus]?.ar || act.fromStatus}
                        </span>{" "}
                        إلى:{" "}
                        <span className="font-semibold text-slate-700">
                          {BATCH_STATUS_LABELS[act.toStatus]?.ar || act.toStatus}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formattedDate}</span>
                      </span>

                      {act.batch.id && (
                        <Link
                          href={`/directeur/batches/${act.batch.id}`}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          <span>معاينة الدفعة</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Batch Details & Actor Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 mt-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    {/* Batch Name */}
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800">
                        {act.batch.label || "دفعة أجور"}
                      </span>
                      {act.batch.periodMonth && act.batch.periodYear && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          (دورة {act.batch.periodMonth}/{act.batch.periodYear})
                        </span>
                      )}
                    </div>

                    {/* Actor Details */}
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-900">{act.actor.name}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded text-[11px] font-bold">
                        {act.actor.roleNameAr || act.actor.roleCode}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Reason */}
                  {act.reason && (
                    <div
                      className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                        act.action.includes("RETURN") || act.action.includes("REJECT")
                          ? "bg-rose-50/80 border-rose-200 text-rose-950"
                          : "bg-amber-50/80 border-amber-200 text-amber-950"
                      }`}
                    >
                      <MessageSquare
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          act.action.includes("RETURN") || act.action.includes("REJECT")
                            ? "text-rose-600"
                            : "text-amber-600"
                        }`}
                      />
                      <div className="flex-1">
                        <span className="font-bold block mb-1">
                          {act.action.includes("RETURN") || act.action.includes("REJECT")
                            ? "سبب الإعادة للتصحيح المدوّن من طرف الإدارة:"
                            : "الملاحظات الإدارية المرفقة بالقرار:"}
                        </span>
                        <p className="whitespace-pre-line text-xs font-medium">
                          {act.reason}
                        </p>
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
