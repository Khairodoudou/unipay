"use client";

/**
 * components/workflow/TakeReviewButton.tsx
 * Bouton de prise en charge formelle d'un lot (Directeur, Comptable, Contrôleur).
 */

import { useState, useTransition } from "react";
import { Loader2, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { WorkflowResult } from "@/lib/workflow/workflow-engine";

interface TakeReviewButtonProps {
  batchId: string;
  action: (batchId: string) => Promise<WorkflowResult>;
  label?: string;
  subtitle?: string;
  variant?: "purple" | "emerald" | "amber";
  onSuccess?: () => void;
}

export function TakeReviewButton({
  batchId,
  action,
  label = "بدء مراجعة ودراسة الدفعة",
  subtitle = "تسجيل استلام الملف رسمياً للبدء في دراسته قبل اتخاذ القرار النهائي",
  variant = "purple",
  onSuccess,
}: TakeReviewButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const colors = {
    purple: {
      bg: "bg-purple-50 border-purple-200",
      btn: "bg-purple-600 hover:bg-purple-700 text-white",
      text: "text-purple-950",
      subtext: "text-purple-800",
    },
    emerald: {
      bg: "bg-emerald-50 border-emerald-200",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
      text: "text-emerald-950",
      subtext: "text-emerald-800",
    },
    amber: {
      bg: "bg-amber-50 border-amber-200",
      btn: "bg-amber-600 hover:bg-amber-700 text-white",
      text: "text-amber-950",
      subtext: "text-amber-800",
    },
  }[variant];

  const handleTake = () => {
    setError(null);
    startTransition(async () => {
      const res = await action(batchId);
      if (res.success) {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(res.error ?? "فشل بدء المراجعة.");
      }
    });
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold" dir="rtl">
        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
        <span>تم استلام الملف وبدء مرحلة المراجعة رسمياً بنجاح.</span>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-xl border ${colors.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`} dir="rtl">
      <div>
        <h4 className={`text-sm font-bold ${colors.text} flex items-center gap-2 mb-1`}>
          <PlayCircle className="w-4 h-4 shrink-0" />
          <span>جاهزة لبدء الدراسة والمراجعة</span>
        </h4>
        <p className={`text-xs ${colors.subtext}`}>
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
        <button
          onClick={handleTake}
          disabled={isPending}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer ${colors.btn}`}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PlayCircle className="w-4 h-4" />
          )}
          <span>{label}</span>
        </button>

        {error && (
          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </span>
        )}
      </div>
    </div>
  );
}
