import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  basePath,
  searchParams = {},
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && key !== "page") {
        params.set(key, val);
      }
    });
    params.set("page", page.toString());
    return `${basePath}?${params.toString()}`;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs text-slate-500 font-medium">
      <div>
        عرض <span className="font-bold text-slate-900 font-mono">{startItem}</span> إلى{" "}
        <span className="font-bold text-slate-900 font-mono">{endItem}</span> من إجمالي{" "}
        <span className="font-bold text-slate-900 font-mono">{totalItems}</span> عنصر
      </div>

      <div className="flex items-center gap-1.5">
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 px-2.5 font-bold"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>السابق</span>
          </Link>
        ) : (
          <span className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-300 flex items-center gap-1 px-2.5 cursor-not-allowed">
            <ChevronRight className="w-3.5 h-3.5" />
            <span>السابق</span>
          </span>
        )}

        <span className="px-3 py-1 font-bold text-slate-800 bg-white rounded-lg border border-slate-200 font-mono">
          {currentPage} / {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 px-2.5 font-bold"
          >
            <span>التالي</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-300 flex items-center gap-1 px-2.5 cursor-not-allowed">
            <span>التالي</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
