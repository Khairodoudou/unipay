"use client";

import { useState, useTransition } from "react";
import { toggleUniversityStatusAction } from "@/lib/super-admin/universities/actions";
import {
  ShieldAlert,
  AlertTriangle,
  Archive,
  RotateCcw,
  Loader2,
  X,
} from "lucide-react";
import { UniversityDeleteControls } from "./UniversityDeleteControls";

interface UniversityStatusControlsProps {
  university: {
    id: string;
    code: string;
    name: string;
    status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
    suspendedAt: Date | null;
    suspendedReason: string | null;
    archivedAt: Date | null;
    counts?: {
      employees: number;
      units: number;
      batches: number;
      users: number;
    };
  };
}

export function UniversityStatusControls({ university }: UniversityStatusControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const handleStatusChange = (
    targetStatus: "ACTIVE" | "SUSPENDED" | "ARCHIVED",
    reason?: string
  ) => {
    setActionError(null);
    startTransition(async () => {
      const res = await toggleUniversityStatusAction(university.id, targetStatus, reason);
      if (!res.success) {
        setActionError(res.error || "فشل تغيير حالة المؤسسة.");
      } else {
        setShowSuspendModal(false);
        setSuspendReason("");
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900">
            الحالة المؤسسية والرقابة المركزية
          </h2>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            university.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : university.status === "SUSPENDED"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          {university.status === "ACTIVE"
            ? "مؤسسة نشطة ومفعلة"
            : university.status === "SUSPENDED"
            ? "مؤسسة معلقة ومجمدة"
            : "مؤسسة مؤرشفة"}
        </span>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {university.status === "SUSPENDED" && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>تم تجميد النطاق المؤسسي بقرار رقابي مركزي</span>
          </div>
          {university.suspendedReason && (
            <p className="text-slate-700 mt-1">
              <strong>سبب التجميد:</strong> {university.suspendedReason}
            </p>
          )}
          {university.suspendedAt && (
            <p className="text-[11px] text-slate-500 font-mono">
              تاريخ التجميد: {new Date(university.suspendedAt).toLocaleDateString("fr-DZ")}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 leading-relaxed">
        تجميد المؤسسة يمنع مسؤوليها وموظفيها من إجراء أي عمليات مالية أو تسجيل مستخدمين جدد، مع الحفاظ الكامل على الأرشيف والبيانات التاريخية ومطابقة الرقابة المالية.
      </p>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center gap-3">
        {university.status === "ACTIVE" ? (
          <button
            type="button"
            onClick={() => setShowSuspendModal(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors focus-ring cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>تجميد المؤسسة مؤقتاً</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleStatusChange("ACTIVE")}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors focus-ring cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>إعادة تفعيل المؤسسة (Reactivate)</span>
          </button>
        )}

        {university.status !== "ARCHIVED" && (
          <button
            type="button"
            onClick={() => {
              if (confirm("هل أنت متأكد من أرشفة هذه المؤسسة الجامعية؟")) {
                handleStatusChange("ARCHIVED");
              }
            }}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors focus-ring cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            <span>أرشفة المؤسسة (Archive)</span>
          </button>
        )}

        <UniversityDeleteControls
          university={{
            id: university.id,
            code: university.code,
            name: university.name,
            counts: university.counts || {
              employees: 0,
              units: 0,
              batches: 0,
              users: 0,
            },
          }}
          variant="button"
        />
      </div>

      {/* Suspend Reason Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>تجميد حساب المؤسسة الجامعية</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              يرجى تحديد السند الإداري أو الرقابي لتجميد هذه المؤسسة الجامعية:
            </p>

            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="مثال: قرار تجميد تحفظي بناء على تقرير المفتشية العامة رقم..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isPending || !suspendReason.trim()}
                onClick={() => handleStatusChange("SUSPENDED", suspendReason.trim())}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>تأكيد التجميد</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
