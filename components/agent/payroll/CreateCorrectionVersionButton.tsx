"use client";

/**
 * components/agent/payroll/CreateCorrectionVersionButton.tsx
 * Bouton pour déclencher le versioning (création de la version v(n+1))
 * lorsqu'un lot est retourné pour correction.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { createBatchCorrectionVersionAction } from "@/lib/workflow/workflow-actions";

interface CreateCorrectionVersionButtonProps {
  batchId: string;
  nextVersion: number;
}

export function CreateCorrectionVersionButton({
  batchId,
  nextVersion,
}: CreateCorrectionVersionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const res = await createBatchCorrectionVersionAction(batchId);
      if (res.success && res.data) {
        router.push(`/agent/batches/${res.data.newBatchId}`);
      } else {
        setError(res.error || "فشل إنشاء النسخة المصححة.");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <PlusCircle className="w-4 h-4" />
        )}
        <span>إنشاء نسخة مصححة جديدة (v{nextVersion})</span>
      </button>
    </div>
  );
}
