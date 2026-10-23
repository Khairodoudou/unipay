"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Receipt,
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

export interface SerializedComptableBatch {
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

interface ComptableBatchesTableProps {
  batches: SerializedComptableBatch[];
  availableYears: number[];
}

const MONTH_NAMES = [
  "جانفي (01)", "فيفري (02)", "مارس (03)", "أفريل (04)",
  "ماي (05)", "جوان (06)", "جويلية (07)", "أوت (08)",
  "سبتمبر (09)", "أكتوبر (10)", "نوفمبر (11)", "ديسمبر (12)",
];

type StatusFilterTab = "ALL" | "PENDING_ACCOUNTING" | "VALIDATED" | "RETURNED" | "OTHER";

export function ComptableBatchesTable({ batches, availableYears }: ComptableBatchesTableProps) {
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
    pendingAccounting: batches.filter((b) => ["APPROVED_BY_DIRECTOR", "ACCOUNTING_REVIEW"].includes(b.status)).length,
    validated: batches.filter((b) => ["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL", "AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(b.status)).length,
    returned: batches.filter((b) => b.status === "RETURNED_FOR_CORRECTION").length,
    other: batches.filter((b) => ["DRAFT", "CALCULATED", "READY_FOR_REVIEW", "CHEF_REVIEW", "DIRECTOR_REVIEW", "APPROVED_BY_CHEF"].includes(b.status)).length,
  }), [batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (activeTab === "PENDING_ACCOUNTING" && !["APPROVED_BY_DIRECTOR", "ACCOUNTING_REVIEW"].includes(b.status)) return false;
      if (activeTab === "VALIDATED" && !["ACCOUNTING_VALIDATED", "FINANCIAL_CONTROL", "AUTHORIZED", "PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(b.status)) return false;
      if (activeTab === "RETURNED" && b.status !== "RETURNED_FOR_CORRECTION") return false;
      if (activeTab === "OTHER" && !["DRAFT", "CALCULATED", "READY_FOR_REVIEW", "CHEF_REVIEW", "DIRECTOR_REVIEW", "APPROVED_BY_CHEF"].includes(b.status)) return false;
      if (selectedYear !== "ALL" && b.period.year !== Number(selectedYear)) return false;
      if (selectedMonth !== "ALL" && b.period.month !== Number(selectedMonth)) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const label = (b.label || "").toLowerCase();
        if (!label.includes(q) && !`${b.period.month}/${b.period.year}`.includes(q) && !(b.period.label || "").toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "date_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "gross_desc") return b.totalGross - a.totalGross;
      if (sortBy === "net_desc") return b.totalNet - a.totalNet;
      if (sortBy === "employees_desc") return b.employeeCount - a.employeeCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [batches, activeTab, selectedYear, selectedMonth, searchTerm, sortBy]);

  const hasActiveFilters = searchTerm !== "" || selectedYear !== "ALL" || selectedMonth !== "ALL" || activeTab !== "ALL" || sortBy !== "date_desc";
  const resetFilters = () => { setSearchTerm(""); setSelectedYear("ALL"); setSelectedMonth("ALL"); setActiveTab("ALL"); setSortBy("date_desc"); };
  const fmt = (n: number) => new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(n);
  const isPending = (status: string) => ["APPROVED_BY_DIRECTOR", "ACCOUNTING_REVIEW"].includes(status);

  const TABS = [
    { key: "ALL" as const, label: "جميع الدفعات", count: counts.all, cls: "bg-slate-900 text-white" },
    { key: "PENDING_ACCOUNTING" as const, label: "بانتظار تأشيري", count: counts.pendingAccounting, cls: "bg-emerald-600 text-white" },
    { key: "VALIDATED" as const, label: "تم التأشير", count: counts.validated, cls: "bg-teal-600 text-white" },
    { key: "RETURNED" as const, label: "معادة للتصحيح", count: counts.returned, cls: "bg-rose-600 text-white" },
    { key: "OTHER" as const, label: "مراحل أخرى", count: counts.other, cls: "bg-blue-600 text-white" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث بتسمية الدفعة أو دورة الشهر..." className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all" />
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
            <div className="relative min-w-[130px]">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                <option value="ALL">كل الأشهر</option>
                {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative min-w-[140px]">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                <option value="date_desc">الأحدث أولاً</option>
                <option value="date_asc">الأقدم أولاً</option>
                <option value="net_desc">الصافي (الأعلى)</option>
                <option value="gross_desc">الخام (الأعلى)</option>
                <option value="employees_desc">عدد الموظفين (الأعلى)</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {hasActiveFilters && (<button onClick={resetFilters} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /><span>إعادة ضبط</span></button>)}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 shrink-0">السنة المالية:</span>
          </div>
          <button type="button" onClick={() => scrollYears("right")} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0 cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
          <div ref={yearScrollRef} className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth" style={{ scrollbarWidth: "thin", scrollbarColor: "#6ee7b7 #f1f5f9" }}>
            <button type="button" onClick={() => setSelectedYear("ALL")} className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all ${selectedYear === "ALL" ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>الكل</button>
            {validYears.map((yr) => (<button key={yr} type="button" onClick={() => setSelectedYear(String(yr))} className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs shrink-0 cursor-pointer transition-all ${selectedYear === String(yr) ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{yr}</button>))}
          </div>
          <button type="button" onClick={() => scrollYears("left")} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0 cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-2 scrollbar-none">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeTab === tab.key ? tab.cls : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              <span>{tab.label}</span>
              {tab.count > 0 && <span className={`text-[10px] px-1.5 rounded-full ${activeTab === tab.key ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"}`}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center px-1">
        <p className="text-xs text-slate-500 font-medium">
          {filteredBatches.length === 0 ? "لا توجد دفعات تطابق الفلاتر" : `${filteredBatches.length} دفعة معروضة`}
          {hasActiveFilters && filteredBatches.length !== batches.length && <span className="text-slate-400"> من أصل {batches.length}</span>}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredBatches.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">لا توجد دفعات تطابق الفلاتر</p>
            {hasActiveFilters && <button onClick={resetFilters} className="mt-3 text-xs text-emerald-600 hover:underline font-semibold">إعادة ضبط الفلاتر</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم / تسمية الدفعة</th>
                  <th className="py-3 px-4">دورة الأجر</th>
                  <th className="py-3 px-4 text-center"><Users className="w-3.5 h-3.5 inline-block ml-1" />الموظفين</th>
                  <th className="py-3 px-4 text-left"><DollarSign className="w-3.5 h-3.5 inline-block ml-1" />الكتلة الخام</th>
                  <th className="py-3 px-4 text-left">الصافي للدفع</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className={`hover:bg-slate-50/70 transition-colors ${isPending(b.status) ? "bg-emerald-50/30" : ""}`}>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-semibold text-emerald-900 text-sm">{b.label || `دفعة v${b.versionNumber}`}</span>
                        {isPending(b.status) && <span className="text-[10px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />بانتظار تأشيرك</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="flex flex-col">
                        <span className="font-mono">{b.period.month}/{b.period.year}</span>
                        {b.period.label && <span className="text-[11px] text-slate-400">{b.period.label}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 text-center">{b.employeeCount.toLocaleString("ar-DZ")}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 text-left">{fmt(b.totalGross)} د.ج</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-left">{fmt(b.totalNet)} د.ج</td>
                    <td className="py-3 px-4"><StatusBadge status={b.status} size="sm" /></td>
                    <td className="py-3 px-4 text-center">
                      <Link href={`/comptable/batches/${b.id}`} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${isPending(b.status) ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-500 hover:bg-slate-600"}`}>
                        {isPending(b.status) ? (<><FileCheck2 className="w-3.5 h-3.5" /><span>فحص وتأشير</span></>) : (<><CheckCircle2 className="w-3.5 h-3.5" /><span>معاينة</span></>)}
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
