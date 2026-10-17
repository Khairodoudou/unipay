"use client";

/**
 * components/workflow/SubmitToChefButton.tsx
 * Bouton pour l'Agent RH permettant de soumettre un batch au Chef de Service
 * (Transition READY_FOR_REVIEW -> CHEF_REVIEW).
 */

import { useState, useTransition } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitBatchToChefAction } from "@/lib/workflow/workflow-actions";

interface SubmitToChefButtonProps {
  batchId: string;
  status: string;
}

export function SubmitToChefButton({ batchId, status }: SubmitToChefButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Ce bouton n'est affiché que si le batch est prêt pour soumission
  const canSubmit = status === "READY_FOR_REVIEW";

  if (!canSubmit && !success) return null;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const res = await submitBatchToChefAction(batchId);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error ?? "فشل إرسال الدفعة.");
      }
    });
  };

  if (success) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
        <CheckCircle2 className="w-4 h-4" />
        <span>تمت إحالة الدفعة إلى رئيس المصلحة بنجاح</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5" />
        )}
        <span>إرسال لرئيس المصلحة للمصادقة</span>
      </button>

      {error && (
        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </span>
      )}
    </div>
  );
}
