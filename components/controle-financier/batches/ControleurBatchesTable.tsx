"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Stamp,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import { StatusBadge } from "@/components/workflow/StatusBadge";

export interface SerializedControleurBatch {
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
    label: string | null;
  };
  employeeCount: number;
  totalGross: number;
  totalNet: number;
}

interface ControleurBatchesTableProps {
  batches: SerializedControleurBatch[];
  availableYears: number[];
}

const MONTH_NAMES = [
  "جانفي (01)", "فيفري (02)", "مارس (03)", "أفريل (04)",
  "ماي (05)", "جوان (06)", "جويلية (07)", "أوت (08)",
  "سبتمبر (09)", "أكتوبر (10)", "نوفمبر (11)", "ديسمبر (12)",
];

type StatusFilterTab = "ALL" | "PENDING_VISA" | "AUTHORIZED" | "RETURNED" | "OTHER";

export function ControleurBatchesTable({ batches, availableYears }: ControleurBatchesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<StatusFilterTab>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "gross_desc" | "net_desc" | "employees_desc">("date_desc");

  const validYears = useMemo(() => {
    const list = availableYears.filter((y) => y >= 2024 && y <= 2035).sort((a, b) => a - b);
    return list.length === 0 ? [2025, 2026, 2027, 2028, 2029] : list;
  }, [availableYears]);

  const yearScrollRef = useRef<HTMLDivElement>(null);
  const scrollYears = (direction: "left" | "right") => {
    if (yearScrollRef.current) {
      yearScrollRef.current.scrollBy({ left: direction === "left" ? -180 : 180, behavior: "smooth" });
    }
  };

  const counts = useMemo(() => ({
    all: batches.length,
    pendingVisa: batches.filter((b) => ["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL"].includes(b.status)).length,
    authorized: batches.filter((b) => ["AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(b.status)).length,
    returned: batches.filter((b) => b.status === "RETURNED_FOR_CORRECTION").length,
    other: batches.filter((b) => ["DRAFT", "CALCULATED", "READY_FOR_REVIEW", "CHEF_REVIEW", "DIRECTOR_REVIEW", "APPROVED_BY_DIRECTOR", "ACCOUNTING_REVIEW"].includes(b.status)).length,
  }), [batches]);

  const filteredBatches = useMemo(() => {
    return batches
      .filter((batch) => {
        // Tab filter
        if (activeTab === "PENDING_VISA" && !["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL"].includes(batch.status)) return false;
        if (activeTab === "AUTHORIZED" && !["AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(batch.status)) return false;
        if (activeTab === "RETURNED" && batch.status !== "RETURNED_FOR_CORRECTION") return false;
        if (activeTab === "OTHER" && ["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL", "AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED", "RETURNED_FOR_CORRECTION"].includes(batch.status)) return false;

        // Year filter
        if (selectedYear !== "ALL" && String(batch.period.year) !== selectedYear) return false;

        // Month filter
        if (selectedMonth !== "ALL" && String(batch.period.month) !== selectedMonth) return false;

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchLabel = (batch.label || "").toLowerCase().includes(q);
          const matchVersion = `v${batch.versionNumber}`.toLowerCase().includes(q);
          const matchPeriod = `${batch.period.month}/${batch.period.year}`.includes(q);
          if (!matchLabel && !matchVersion && !matchPeriod) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date_desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "date_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "gross_desc") return b.totalGross - a.totalGross;
        if (sortBy === "net_desc") return b.totalNet - a.totalNet;
        if (sortBy === "employees_desc") return b.employeeCount - a.employeeCount;
        return 0;
      });
  }, [batches, activeTab, selectedYear, selectedMonth, searchTerm, sortBy]);

  const hasActiveFilters = searchTerm !== "" || activeTab !== "ALL" || selectedYear !== "ALL" || selectedMonth !== "ALL" || sortBy !== "date_desc";

  const resetFilters = () => {
    setSearchTerm("");
    setActiveTab("ALL");
    setSelectedYear("ALL");
    setSelectedMonth("ALL");
    setSortBy("date_desc");
  };

  return (
    <div className="space-y-4">
      {/* ── Status Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "ALL"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>الكل</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "ALL" ? "bg-amber-700/50 text-white" : "bg-slate-100 text-slate-600"}`}>
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("PENDING_VISA")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "PENDING_VISA"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>بانتظار التأشيرة المالية</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "PENDING_VISA" ? "bg-amber-700/50 text-white" : "bg-amber-200/70 text-amber-900"}`}>
            {counts.pendingVisa}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("AUTHORIZED")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "AUTHORIZED"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>مُنحت التأشيرة (مرخص للصرف)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "AUTHORIZED" ? "bg-emerald-700/50 text-white" : "bg-slate-100 text-slate-600"}`}>
            {counts.authorized}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("RETURNED")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "RETURNED"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
          <span>معادة للتصحيح</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "RETURNED" ? "bg-rose-700/50 text-white" : "bg-slate-100 text-slate-600"}`}>
            {counts.returned}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("OTHER")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "OTHER"
              ? "bg-slate-800 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>مراحل سابقة</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "OTHER" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"}`}>
            {counts.other}
          </span>
        </button>
      </div>

      {/* ── Horizontal Scrollable Year Filter (2024 - 2035) ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>السنة المالية:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollYears("right")}
              title="تمرير لليمين"
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100 border border-slate-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollYears("left")}
              title="تمرير لليسار"
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100 border border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={yearScrollRef}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300"
          style={{ scrollBehavior: "smooth" }}
        >
          <button
            onClick={() => setSelectedYear("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              selectedYear === "ALL"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            كل السنوات
          </button>
          {validYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(String(year))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-all ${
                selectedYear === String(year)
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search, Month & Sorting Controls ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الدفعة، رقم النسخة (v1)، أو الدورة..."
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

        {/* Sort by */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">ترتيب:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="date_desc">الأحدث أولاً</option>
            <option value="date_asc">الأقدم أولاً</option>
            <option value="gross_desc">الكتلة الخام (الأعلى)</option>
            <option value="net_desc">الصافي للدفع (الأعلى)</option>
            <option value="employees_desc">عدد الموظفين (الأكثر)</option>
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

      {/* ── Batches Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Stamp className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">لا توجد دفعات أجور مطابقة للفلاتر المحددة</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-amber-700 hover:underline font-medium inline-block"
              >
                إلغاء جميع الفلاتر لإظهار كافة الدفعات
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم الدفعة</th>
                  <th className="py-3 px-4">دورة الأجر</th>
                  <th className="py-3 px-4">الموظفين</th>
                  <th className="py-3 px-4">الكتلة الخام (Brut)</th>
                  <th className="py-3 px-4">الصافي للدفع (Net)</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => {
                  const isPendingVisa = ["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL"].includes(b.status);
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isPendingVisa ? "bg-amber-50/40 font-medium" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isPendingVisa && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="بانتظار دراسة التأشيرة المالية" />
                          )}
                          <div>
                            <span className="font-mono font-semibold text-slate-900 block">
                              {b.label || `دفعة v${b.versionNumber}`}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              نسخة {b.versionNumber}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {b.period.month}/{b.period.year}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {b.employeeCount.toLocaleString("ar-DZ")}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 2 }).format(b.totalGross)} د.ج
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 2 }).format(b.totalNet)} د.ج
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/controle-financier/batches/${b.id}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isPendingVisa
                                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            <span>{isPendingVisa ? "دراسة التأشيرة" : "معاينة"}</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </Link>
                          {["AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(b.status) && (
                            <Link
                              href={`/controle-financier/batches/${b.id}/visa`}
                              title="معاينة بطاقة التأشيرة الرسمية"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs"
                            >
                              <Stamp className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 text-center py-1">
        عرض {filteredBatches.length} من إجمالي {batches.length} دفعة أجور مسجلة
      </div>
    </div>
  );
}
