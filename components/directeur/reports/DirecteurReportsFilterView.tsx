"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  BarChart3,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Download,
  RotateCcw,
  Percent,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
} from "lucide-react";
import { StatusBadge } from "@/components/workflow/StatusBadge";

export interface SerializedReportBatch {
  id: string;
  label: string | null;
  versionNumber: number;
  status: string;
  month: number;
  year: number;
  periodLabel?: string | null;
  employeeCount: number;
  grossAmount: number;
  netAmount: number;
  totalDeductions: number;
}

interface DirecteurReportsFilterViewProps {
  batches: SerializedReportBatch[];
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

export function DirecteurReportsFilterView({
  batches,
  availableYears,
}: DirecteurReportsFilterViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Filter only legitimate fiscal years (between 2024 and 2035)
  const validYears = useMemo(() => {
    const list = availableYears
      .filter((y) => y >= 2024 && y <= 2035)
      .sort((a, b) => a - b);
    if (list.length === 0) {
      return [2026, 2027, 2028, 2029, 2030];
    }
    return list;
  }, [availableYears]);

  const yearScrollRef = useRef<HTMLDivElement>(null);

  const scrollYears = (direction: "left" | "right") => {
    if (yearScrollRef.current) {
      const scrollAmount = direction === "left" ? -180 : 180;
      yearScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Filter batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Year filter
      if (selectedYear !== "ALL" && b.year !== Number(selectedYear)) {
        return false;
      }

      // Month filter
      if (selectedMonth !== "ALL" && b.month !== Number(selectedMonth)) {
        return false;
      }

      // Status filter
      if (statusFilter === "AUTHORIZED_ONLY") {
        if (!["AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(b.status)) {
          return false;
        }
      } else if (statusFilter === "IN_REVIEW_ONLY") {
        if (!["APPROVED_BY_CHEF", "DIRECTOR_REVIEW", "APPROVED_BY_DIRECTOR", "ACCOUNTING_REVIEW", "ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL"].includes(b.status)) {
          return false;
        }
      }

      // Search text
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const labelMatch = (b.label || "").toLowerCase().includes(q);
        const periodMatch = `${b.month}/${b.year}`.includes(q);
        const versionMatch = `v${b.versionNumber}`.includes(q);
        if (!labelMatch && !periodMatch && !versionMatch) return false;
      }

      return true;
    });
  }, [batches, selectedYear, selectedMonth, statusFilter, searchTerm]);

  // Aggregate metrics
  const totals = useMemo(() => {
    const gross = filteredBatches.reduce((acc, b) => acc + b.grossAmount, 0);
    const net = filteredBatches.reduce((acc, b) => acc + b.netAmount, 0);
    const deductions = filteredBatches.reduce((acc, b) => acc + b.totalDeductions, 0);
    const employees = filteredBatches.reduce((acc, b) => acc + b.employeeCount, 0);

    const deductionRate = gross > 0 ? ((deductions / gross) * 100).toFixed(1) : "0";
    const averageNet = employees > 0 ? Math.round(net / employees) : 0;

    return { gross, net, deductions, employees, deductionRate, averageNet };
  }, [filteredBatches]);

  const hasActiveFilters =
    selectedYear !== "ALL" ||
    selectedMonth !== "ALL" ||
    statusFilter !== "ALL" ||
    searchTerm.trim() !== "";

  const resetFilters = () => {
    setSelectedYear("ALL");
    setSelectedMonth("ALL");
    setStatusFilter("ALL");
    setSearchTerm("");
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["الشهر/السنة", "تسمية الدفعة", "تعداد العمال", "الكتلة الخام (د.ج)", "الاقتطاعات (د.ج)", "الصافي للدفع (د.ج)", "الحالة"];
    const rows = filteredBatches.map((b) => [
      `"${b.month}/${b.year}"`,
      `"${b.label || `دفعة v${b.versionNumber}`}"`,
      b.employeeCount,
      b.grossAmount,
      b.totalDeductions,
      b.netAmount,
      `"${b.status}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rapport_salaires_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── KPI Cards Dynamiques ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">مجموع الأجور الخام (Brut)</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totals.gross)}{" "}
            د.ج
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            إجمالي استحقاقات {filteredBatches.length} دفعة معروضة
          </p>
        </div>

        {/* Total Deductions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold">مجموع الاقتطاعات (IRG + CNAS)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-amber-900 mt-1">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totals.deductions)}{" "}
            د.ج
          </p>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">
            نسبة الاقتطاع العامة: {totals.deductionRate}%
          </p>
        </div>

        {/* Total Net */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold">مجموع الصافي للدفع (Net)</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-950 mt-1">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totals.net)}{" "}
            د.ج
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            السيولة المحولة لحسابات الموظفين
          </p>
        </div>

        {/* Average Net per Employee */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">متوسط صافي الراتب</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-blue-950 mt-1">
            {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totals.averageNet)}{" "}
            د.ج
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            لكل موظف شهرياً عبر {totals.employees.toLocaleString("ar-DZ")} كشف
          </p>
        </div>
      </div>

      {/* ── Control & Filter Bar ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بتسمية الدفعة أو دورة الشهر..."
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

          {/* Quick Selects & Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Select */}
            <div className="relative min-w-[120px]">
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
            <div className="relative min-w-[130px]">
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

            {/* Status Scope Select */}
            <div className="relative min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="ALL">جميع الوضعيات</option>
                <option value="AUTHORIZED_ONLY">المرخصة والمدفوعة فقط</option>
                <option value="IN_REVIEW_ONLY">قيد مسار المصادقة</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={filteredBatches.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              title="تصدير جدول التقرير بصيغة Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Year Filter with Smooth Horizontal Scroll & Nav */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs font-bold text-slate-800 shrink-0">
              السنة المالية:
            </span>
          </div>

          {/* Right scroll button (scrolls right in RTL) */}
          <button
            type="button"
            onClick={() => scrollYears("right")}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0 cursor-pointer"
            title="تمرير لليمين"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Horizontal Scrollable Pills */}
          <div
            ref={yearScrollRef}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#c084fc #f1f5f9",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedYear("ALL")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 cursor-pointer ${
                selectedYear === "ALL"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              الكل
            </button>
            {validYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(String(yr))}
                className={`px-3.5 py-1.5 rounded-xl font-mono font-bold transition-all text-xs shrink-0 cursor-pointer ${
                  selectedYear === String(yr)
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Left scroll button (scrolls left in RTL) */}
          <button
            type="button"
            onClick={() => scrollYears("left")}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0 cursor-pointer"
            title="تمرير لليسار"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              تطور كتل الأجور الشهرية المسجلة
            </h2>
            <span className="text-xs text-slate-500">
              (عرض {filteredBatches.length} دورة)
            </span>
          </div>

          <div className="text-xs font-mono text-slate-600">
            مجموع الصافي للدفع:{" "}
            <strong className="text-emerald-700 font-bold">
              {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(totals.net)} د.ج
            </strong>
          </div>
        </div>

        {filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">
              لا توجد بيانات مطابقة لمعايير التصفية
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              لم نتمكن من العثور على أي دورة أجور تطابق خيارات التصفية الحالية.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">الشهر / السنة</th>
                  <th className="py-3.5 px-4">الدفعة</th>
                  <th className="py-3.5 px-4">تعداد العمال</th>
                  <th className="py-3.5 px-4">الكتلة الخام</th>
                  <th className="py-3.5 px-4">الاقتطاعات (IRG + CNAS)</th>
                  <th className="py-3.5 px-4">الصافي للدفع</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {b.month}/{b.year}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-purple-950">
                      {b.label || `دفعة v${b.versionNumber}`}
                      {b.versionNumber > 1 && (
                        <span className="text-[10px] font-mono mr-1.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                          v{b.versionNumber}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {b.employeeCount.toLocaleString("ar-DZ")}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(b.grossAmount)}{" "}
                      د.ج
                    </td>

                    <td className="py-3.5 px-4 font-mono text-amber-800 font-medium">
                      {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(b.totalDeductions)}{" "}
                      د.ج
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(b.netAmount)}{" "}
                      د.ج
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/directeur/batches/${b.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-xs font-bold transition-colors"
                      >
                        <span>معاينة</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
