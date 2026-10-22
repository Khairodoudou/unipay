"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { ALGERIAN_WILAYAS } from "@/lib/constants/algerian-wilayas";

export function UniversityFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") || "";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentWilaya = searchParams.get("wilaya") || "ALL";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = currentQ || currentStatus !== "ALL" || currentWilaya !== "ALL";

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث باسم الجامعة، الرمز المؤسسي، أو الولاية..."
            defaultValue={currentQ}
            onChange={(e) => {
              const val = e.target.value;
              const debounceTimer = setTimeout(() => {
                updateFilters("q", val);
              }, 400);
              return () => clearTimeout(debounceTimer);
            }}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={currentStatus}
            onChange={(e) => updateFilters("status", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">جميع الحالات المؤسسية</option>
            <option value="ACTIVE">نشطة ومفعلة (ACTIVE)</option>
            <option value="SUSPENDED">معلقة بقرار رقابي (SUSPENDED)</option>
            <option value="ARCHIVED">مؤرشفة (ARCHIVED)</option>
          </select>
        </div>

        {/* Wilaya Filter */}
        <div>
          <select
            value={currentWilaya}
            onChange={(e) => updateFilters("wilaya", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">جميع الولايات (58 ولاية)</option>
            {ALGERIAN_WILAYAS.map((w) => (
              <option key={w.code} value={w.nameAr}>
                {w.code} - ولاية {w.nameAr} ({w.nameFr})
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>عوامل التصفية نشطة</span>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>إعادة ضبط التصفية</span>
          </button>
        </div>
      )}
    </div>
  );
}
