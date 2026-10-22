"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar, Filter, X } from "lucide-react";

interface BatchYearFilterProps {
  availableYears: number[];
  selectedYear?: number;
  totalBatches: number;
}

export function BatchYearFilter({
  availableYears,
  selectedYear,
  totalBatches,
}: BatchYearFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelectYear = (yearStr: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (yearStr && yearStr !== "ALL") {
      params.set("year", yearStr);
    } else {
      params.delete("year");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("year");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Up to 5 most recent/relevant years for quick pill buttons
  const quickYears = availableYears.slice(0, 5);
  const isSelectedInQuick = selectedYear
    ? quickYears.includes(selectedYear)
    : false;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
      {/* Top Row: Label, Quick Pills, and Count Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200/60">
              <Filter className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              تصفية حسب السنة:
            </span>
          </div>

          {/* Quick Pills */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSelectYear("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${
                !selectedYear
                  ? "bg-white text-teal-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الكل
            </button>

            {quickYears.map((yr) => {
              const isActive = selectedYear === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleSelectYear(String(yr))}
                  className={`px-3 py-1.5 rounded-lg font-mono transition-all text-xs ${
                    isActive
                      ? "bg-white text-teal-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {yr}
                </button>
              );
            })}

            {selectedYear && !isSelectedInQuick && (
              <button
                type="button"
                onClick={() => handleSelectYear(String(selectedYear))}
                className="px-3 py-1.5 rounded-lg font-mono transition-all text-xs bg-white text-teal-700 shadow-2xs font-bold"
              >
                {selectedYear}
              </button>
            )}
          </div>
        </div>

        {/* Count Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="text-xs font-medium whitespace-nowrap">
            {selectedYear ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 font-bold whitespace-nowrap">
                <span>سنة {selectedYear}</span>
                <span className="text-teal-400">•</span>
                <span className="font-mono">{totalBatches}</span>
                <span>دفعة</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold whitespace-nowrap">
                <span>المجموع:</span>
                <span className="font-mono">{totalBatches}</span>
                <span>دفعة</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Dropdown select and reset button */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-slate-100">
        {/* Dropdown for All Years */}
        {availableYears.length > 0 && (
          <div className="relative">
            <select
              value={selectedYear ? String(selectedYear) : "ALL"}
              onChange={(e) => handleSelectYear(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold pl-8 pr-3 py-1.5 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer font-mono"
            >
              <option value="ALL">كل السنوات ({availableYears.length})</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  سنة {yr}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Reset button if filter is active */}
        {selectedYear && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors"
            title="إلغاء التصفية"
          >
            <X className="w-3.5 h-3.5" />
            <span>إلغاء الفلتر</span>
          </button>
        )}
      </div>
    </div>
  );
}
