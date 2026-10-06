"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, RotateCcw } from "lucide-react";
import { useTransition } from "react";

interface RoleOption {
  code: string;
  nameAr: string;
}

interface UserFilterBarProps {
  roles: RoleOption[];
}

export function UserFilterBar({ roles }: UserFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentRole = searchParams.get("role") || "";
  const currentStatus = searchParams.get("status") || "";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // reset to page 1

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="البحث بالاسم أو البريد الإلكتروني..."
            defaultValue={currentSearch}
            onChange={(e) => updateFilters("search", e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
        </div>

        {/* Role Filter */}
        <div className="sm:col-span-3">
          <select
            value={currentRole}
            onChange={(e) => updateFilters("role", e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-slate-700"
          >
            <option value="">جميع الأدوار ({roles.length})</option>
            {roles.map((r) => (
              <option key={r.code} value={r.code}>
                {r.nameAr} ({r.code})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-2">
          <select
            value={currentStatus}
            onChange={(e) => updateFilters("status", e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-slate-700"
          >
            <option value="">كافة الحالات</option>
            <option value="active">مفعّل فقط</option>
            <option value="inactive">معطّل فقط</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={!currentSearch && !currentRole && !currentStatus}
            className="w-full sm:w-auto p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            title="إعادة تعيين الفلاتر"
          >
            <RotateCcw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
