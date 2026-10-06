import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      <p className="text-sm font-medium text-slate-600">جاري تحميل البيانات...</p>
    </div>
  );
}
