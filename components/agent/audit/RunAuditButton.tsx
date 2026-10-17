"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { runBatchSmartAuditAction } from "@/lib/audit/actions";

interface RunAuditButtonProps {
  batchId: string;
  hasFindings: boolean;
}

export function RunAuditButton({ batchId, hasFindings }: RunAuditButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await runBatchSmartAuditAction(batchId);
      if (!res.success) {
        setError(res.error || "فشل تشغيل التدقيق الذكي");
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRunAudit}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري فحص وتدقيق الدفعة...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>{hasFindings ? "إعادة تشغيل التدقيق الذكي" : "تشغيل التدقيق الذكي (Smart Audit)"}</span>
          </>
        )}
      </button>

      {error && (
        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          {error}
        </span>
      )}
    </div>
  );
}
