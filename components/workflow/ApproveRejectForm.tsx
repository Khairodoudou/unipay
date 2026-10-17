"use client";

/**
 * components/workflow/ApproveRejectForm.tsx
 * Formulaire approve/reject réutilisable dans les 4 espaces.
 * La raison est obligatoire pour les rejets (min 10 chars).
 */

import { useState, useTransition } from "react";
import { CheckCircle2, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { WorkflowResult } from "@/lib/workflow/workflow-engine";

interface ApproveRejectFormProps {
  batchId: string;
  currentStatus: string;
  approveLabel?: string;
  rejectLabel?: string;
  approveAction: (batchId: string, notes?: string) => Promise<WorkflowResult>;
  rejectAction: (batchId: string, reason: string) => Promise<WorkflowResult>;
  onSuccess?: (newStatus: string) => void;
  disabled?: boolean;
}

export function ApproveRejectForm({
  batchId,
  approveLabel = "مصادقة",
  rejectLabel  = "إعادة للتصحيح",
  approveAction,
  rejectAction,
  onSuccess,
  disabled = false,
}: ApproveRejectFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await approveAction(batchId, notes || undefined);
      if (result.success) {
        setSuccess("تمت العملية بنجاح.");
        onSuccess?.(result.data?.newStatus ?? "");
      } else {
        setError(result.error ?? "حدث خطأ غير متوقع.");
      }
    });
  };

  const handleReject = () => {
    if (reason.trim().length < 10) {
      setError("يجب تقديم سبب مفصّل (10 أحرف على الأقل).");
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await rejectAction(batchId, reason);
      if (result.success) {
        setSuccess("أُعيدت الدفعة للتصحيح بنجاح.");
        onSuccess?.(result.data?.newStatus ?? "");
      } else {
        setError(result.error ?? "حدث خطأ غير متوقع.");
      }
    });
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
        <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0" />
        <span className="text-sm font-medium text-teal-700">{success}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Notes for approval (optional) */}
      {!showRejectForm && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="approve-notes">
            ملاحظات (اختياري)
          </label>
          <textarea
            id="approve-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أضف ملاحظاتك حول هذه المصادقة..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            rows={2}
            disabled={isPending || disabled}
          />
        </div>
      )}

      {/* Reject reason */}
      {showRejectForm && (
        <div>
          <label className="block text-sm font-medium text-red-700 mb-1.5" htmlFor="reject-reason">
            سبب الإعادة <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="يجب تقديم سبب واضح ومفصّل (10 أحرف على الأقل)..."
            className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            rows={3}
            disabled={isPending || disabled}
            minLength={10}
          />
          <p className="mt-1 text-xs text-slate-500">{reason.length} / حد أدنى 10 أحرف</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {!showRejectForm ? (
          <>
            <button
              onClick={handleApprove}
              disabled={isPending || disabled}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={approveLabel}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {approveLabel}
            </button>
            <button
              onClick={() => { setShowRejectForm(true); setError(null); }}
              disabled={isPending || disabled}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={rejectLabel}
            >
              <RotateCcw className="h-4 w-4" />
              {rejectLabel}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleReject}
              disabled={isPending || disabled || reason.trim().length < 10}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="تأكيد الإعادة"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              تأكيد الإعادة
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setReason(""); setError(null); }}
              disabled={isPending}
              className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              aria-label="إلغاء"
            >
              إلغاء
            </button>
          </>
        )}
      </div>
    </div>
  );
}
