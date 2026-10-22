"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter, X } from "lucide-react";

interface AuditFilterBarProps {
  organizations: Array<{ id: string; name: string; code: string }>;
}

export function AuditFilterBar({ organizations }: AuditFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentOrg = searchParams.get("orgId") || "ALL";
  const currentAction = searchParams.get("action") || "ALL";
  const currentQ = searchParams.get("q") || "";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset page on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = currentOrg !== "ALL" || currentAction !== "ALL" || currentQ;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث بالمستخدم، البريد، أو التفاصيل..."
            defaultValue={currentQ}
            onChange={(e) => {
              const val = e.target.value;
              const timer = setTimeout(() => updateFilters("q", val), 400);
              return () => clearTimeout(timer);
            }}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Organization Filter */}
        <div>
          <select
            value={currentOrg}
            onChange={(e) => updateFilters("orgId", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">جميع المؤسسات والجامعات</option>
            <option value="CENTRAL">العمليات المركزية فقط (SUPER_ADMIN)</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.code} — {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Type Filter */}
        <div>
          <select
            value={currentAction}
            onChange={(e) => updateFilters("action", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">جميع أنواع الإجراءات والعمليات</option>
            <option value="LOGIN_SUCCESS">تسجيل دخول ناجح (LOGIN_SUCCESS)</option>
            <option value="LOGIN_FAILED">محاولة دخول فاشلة (LOGIN_FAILED)</option>
            <option value="UNIVERSITY_CREATED">تسجيل جامعة (UNIVERSITY_CREATED)</option>
            <option value="UNIVERSITY_UPDATED">تعديل جامعة (UNIVERSITY_UPDATED)</option>
            <option value="UNIVERSITY_SUSPENDED">تجميد جامعة (UNIVERSITY_SUSPENDED)</option>
            <option value="UNIVERSITY_REACTIVATED">تفعيل جامعة (UNIVERSITY_REACTIVATED)</option>
            <option value="USER_CREATED">إنشاء مستخدم (USER_CREATED)</option>
            <option value="USER_UPDATED">تعديل مستخدم (USER_UPDATED)</option>
            <option value="USER_DELETED">حذف مستخدم (USER_DELETED)</option>
            <option value="BATCH_STEP_APPROVED">مصادقة على دفعة (BATCH_STEP_APPROVED)</option>
            <option value="BATCH_STEP_REJECTED">رفض دفعة (BATCH_STEP_REJECTED)</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>تصفية مخصصة لسجل التدقيق</span>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>إعادة ضبط</span>
          </button>
        </div>
      )}
    </div>
  );
}
