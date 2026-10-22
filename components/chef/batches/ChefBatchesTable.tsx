"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Search,
  Filter,
  X,
  ChevronLeft,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ArrowUpDown,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { StatusBadge } from "@/components/workflow/StatusBadge";

export interface SerializedBatch {
  id: string;
  label: string | null;
  versionNumber: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  period: {
    id: string;
    month: number;
    year: number;
    label?: string | null;
  };
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  lastAction: {
    action: string;
    actorName: string;
    actorEmail: string;
    createdAt: string;
  } | null;
}

interface ChefBatchesTableProps {
  batches: SerializedBatch[];
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

type StatusFilterTab =
  | "ALL"
  | "PENDING_CHEF"
  | "READY"
  | "APPROVED_CHEF"
  | "RETURNED"
  | "NEXT_LEVELS"
  | "COMPLETED";

export function ChefBatchesTable({
  batches,
  availableYears,
}: ChefBatchesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<StatusFilterTab>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "gross_desc" | "net_desc" | "employees_desc">("date_desc");

  // Filter to legitimate fiscal years only
  const validYears = useMemo(() => {
    const list = availableYears
      .filter((y) => y >= 2024 && y <= 2035)
      .sort((a, b) => a - b);
    return list.length === 0 ? [2025, 2026, 2027, 2028, 2029] : list;
  }, [availableYears]);

  // Tab counts calculation
  const counts = useMemo(() => {
    return {
      all: batches.length,
      pendingChef: batches.filter((b) => b.status === "CHEF_REVIEW").length,
      ready: batches.filter((b) => b.status === "READY_FOR_REVIEW").length,
      approvedChef: batches.filter((b) => b.status === "APPROVED_BY_CHEF").length,
      returned: batches.filter((b) => b.status === "RETURNED_FOR_CORRECTION").length,
      nextLevels: batches.filter((b) =>
        [
          "DIRECTOR_REVIEW",
          "APPROVED_BY_DIRECTOR",
          "ACCOUNTING_REVIEW",
          "ACCOUNTING_VALIDATED",
          "FINANCIAL_CONTROL",
        ].includes(b.status)
      ).length,
      completed: batches.filter((b) =>
        ["AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(b.status)
      ).length,
    };
  }, [batches]);

  // Filtered and sorted batches
  const filteredBatches = useMemo(() => {
    return batches
      .filter((b) => {
        // Status tab filter
        if (activeTab === "PENDING_CHEF" && b.status !== "CHEF_REVIEW") return false;
        if (activeTab === "READY" && b.status !== "READY_FOR_REVIEW") return false;
        if (activeTab === "APPROVED_CHEF" && b.status !== "APPROVED_BY_CHEF") return false;
        if (activeTab === "RETURNED" && b.status !== "RETURNED_FOR_CORRECTION") return false;
        if (
          activeTab === "NEXT_LEVELS" &&
          ![
            "DIRECTOR_REVIEW",
            "APPROVED_BY_DIRECTOR",
            "ACCOUNTING_REVIEW",
            "ACCOUNTING_VALIDATED",
            "FINANCIAL_CONTROL",
          ].includes(b.status)
        )
          return false;
        if (
          activeTab === "COMPLETED" &&
          !["AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(b.status)
        )
          return false;

        // Year filter
        if (selectedYear !== "ALL" && b.period.year !== Number(selectedYear)) {
          return false;
        }

        // Month filter
        if (selectedMonth !== "ALL" && b.period.month !== Number(selectedMonth)) {
          return false;
        }

        // Search text filter
        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          const labelMatch = (b.label || "").toLowerCase().includes(q);
          const versionMatch = `v${b.versionNumber}`.includes(q);
          const monthYearMatch = `${b.period.month}/${b.period.year}`.includes(q);
          const actorMatch = (b.lastAction?.actorName || "").toLowerCase().includes(q);
          const actionMatch = (b.lastAction?.action || "").toLowerCase().includes(q);

          if (!labelMatch && !versionMatch && !monthYearMatch && !actorMatch && !actionMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date_desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "date_asc") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "gross_desc") {
          return b.totalGross - a.totalGross;
        }
        if (sortBy === "net_desc") {
          return b.totalNet - a.totalNet;
        }
        if (sortBy === "employees_desc") {
          return b.employeeCount - a.employeeCount;
        }
        return 0;
      });
  }, [batches, activeTab, selectedYear, selectedMonth, searchTerm, sortBy]);

  // Filtered Totals
  const totals = useMemo(() => {
    return filteredBatches.reduce(
      (acc, b) => ({
        gross: acc.gross + b.totalGross,
        net: acc.net + b.totalNet,
        employees: acc.employees + b.employeeCount,
      }),
      { gross: 0, net: 0, employees: 0 }
    );
  }, [filteredBatches]);

  const hasActiveFilters =
    activeTab !== "ALL" ||
    selectedYear !== "ALL" ||
    selectedMonth !== "ALL" ||
    searchTerm.trim() !== "" ||
    sortBy !== "date_desc";

  const resetFilters = () => {
    setActiveTab("ALL");
    setSelectedYear("ALL");
    setSelectedMonth("ALL");
    setSearchTerm("");
    setSortBy("date_desc");
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* ── Control Panel (Filter Bar) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Search & Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بتسمية الدفعة، رقم الإصدار، الشهر، أو المسؤول..."
              className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
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

          {/* Quick Selects (Year, Month, Sort) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Select */}
            <div className="relative min-w-[120px]">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
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
            <div className="relative min-w-[130px]">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
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

            {/* Sort Dropdown */}
            <div className="relative min-w-[140px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
              >
                <option value="date_desc">الأحدث أولاً</option>
                <option value="date_asc">الأقدم أولاً</option>
                <option value="net_desc">الصافي (الأعلى)</option>
                <option value="gross_desc">الخام (الأعلى)</option>
                <option value="employees_desc">عدد الموظفين (الأعلى)</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>جميع الدفعات</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "ALL" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("PENDING_CHEF")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "PENDING_CHEF"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>بانتظار مراجعتك</span>
            {counts.pendingChef > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "PENDING_CHEF"
                    ? "bg-blue-700 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {counts.pendingChef}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("APPROVED_CHEF")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "APPROVED_CHEF"
                ? "bg-teal-600 text-white shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>صادقت عليها</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "APPROVED_CHEF"
                  ? "bg-teal-700 text-teal-100"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.approvedChef}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("RETURNED")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "RETURNED"
                ? "bg-rose-600 text-white shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>معادة للتصحيح</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "RETURNED"
                  ? "bg-rose-700 text-rose-100"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.returned}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("READY")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "READY"
                ? "bg-amber-600 text-white shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>جاهزة قبل الإرسال</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "READY"
                  ? "bg-amber-700 text-amber-100"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.ready}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("NEXT_LEVELS")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "NEXT_LEVELS"
                ? "bg-purple-600 text-white shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>بالمراحل الإدارية والمحاسبية</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "NEXT_LEVELS"
                  ? "bg-purple-700 text-purple-100"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.nextLevels}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "COMPLETED"
                ? "bg-emerald-700 text-white shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>مرخصة / مدفوعة</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "COMPLETED"
                  ? "bg-emerald-800 text-emerald-100"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.completed}
            </span>
          </button>
        </div>

        {/* Filter Summary Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 text-slate-500">
          <div>
            النتائج المعروضة:{" "}
            <strong className="text-slate-900 font-mono text-sm">
              {filteredBatches.length}
            </strong>{" "}
            من أصل{" "}
            <strong className="text-slate-700 font-mono">
              {batches.length}
            </strong>{" "}
            دفعة
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>إجمالي الموظفين:</span>
              <strong className="text-slate-800 font-mono">
                {totals.employees.toLocaleString("ar-DZ")}
              </strong>
            </span>

            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>الكتلة الخام:</span>
              <strong className="text-slate-800 font-mono">
                {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totals.gross)}{" "}
                د.ج
              </strong>
            </span>

            <span className="flex items-center gap-1.5">
              <span>الصافي للدفع:</span>
              <strong className="text-emerald-700 font-bold font-mono">
                {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totals.net)}{" "}
                د.ج
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">
              لا توجد دفعات أجور مطابقة
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              لم نتمكن من العثور على أي دفعة تطابق معايير التصفية والبحث المحددة.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط جميع الفلاتر</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">رقم / تسمية الدفعة</th>
                  <th className="py-3.5 px-4">دورة الأجر</th>
                  <th className="py-3.5 px-4">الموظفين</th>
                  <th className="py-3.5 px-4">الكتلة الخام</th>
                  <th className="py-3.5 px-4">الصافي للدفع</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">آخر تعديل / قرار</th>
                  <th className="py-3.5 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => {
                  const isPendingAction = b.status === "CHEF_REVIEW";

                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors ${
                        isPendingAction
                          ? "bg-blue-50/30 hover:bg-blue-50/60"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-900">
                            {b.label || `دفعة v${b.versionNumber}`}
                          </span>
                          {b.versionNumber > 1 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                              v{b.versionNumber}
                            </span>
                          )}
                          {isPendingAction && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold animate-pulse">
                              مطلوب قرارك
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {b.period.month}/{b.period.year}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {b.employeeCount.toLocaleString("ar-DZ")}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {new Intl.NumberFormat("ar-DZ", {
                          maximumFractionDigits: 0,
                        }).format(b.totalGross)}{" "}
                        د.ج
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {new Intl.NumberFormat("ar-DZ", {
                          maximumFractionDigits: 0,
                        }).format(b.totalNet)}{" "}
                        د.ج
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {b.lastAction ? (
                          <div>
                            <span className="font-semibold text-slate-700 block">
                              {b.lastAction.action}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              بواسطة: {b.lastAction.actorName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/chef/batches/${b.id}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                            isPendingAction
                              ? "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-500/20"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          <span>{isPendingAction ? "مراجعة واتخاذ القرار" : "معاينة"}</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
