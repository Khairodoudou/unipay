"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUniversityAction } from "@/lib/super-admin/universities/actions";
import {
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Lock,
  Building2,
  CheckCircle2,
  ShieldAlert,
  Users,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

interface UniversityDeleteControlsProps {
  university: {
    id: string;
    code: string;
    name: string;
    wilaya?: string | null;
    isPrimary?: boolean;
    counts: {
      employees: number;
      units: number;
      batches: number;
      users: number;
    };
  };
  variant?: "button" | "card" | "both";
}

export function UniversityDeleteControls({
  university,
  variant = "both",
}: UniversityDeleteControlsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isPrimary = Boolean(university.isPrimary);

  const isCodeMatching =
    confirmCode.trim().toUpperCase() === university.code.trim().toUpperCase();
  const canSubmit = isCodeMatching && confirmCheckbox && !isPending && !isPrimary;

  const handleOpen = () => {
    if (isPrimary) return;
    setErrorMessage(null);
    setConfirmCode("");
    setConfirmCheckbox(false);
    setReason("");
    setIsSuccess(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setErrorMessage(null);
  };

  const handleDelete = () => {
    if (!canSubmit) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await deleteUniversityAction(
        university.id,
        confirmCode,
        reason.trim() || undefined
      );

      if (!res.success) {
        setErrorMessage(res.error || "فشل حذف المؤسسة الجامعية.");
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          router.push("/super-admin/universities");
          router.refresh();
        }, 1200);
      }
    });
  };

  return (
    <>
      {/* Header Button Variant */}
      {(variant === "button" || variant === "both") && (
        <div>
          {isPrimary ? (
            <div
              title="مؤسسة مرجعية للنظام الوطني — محمية من الحذف"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed select-none"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>مؤسسة مرجعية محمية</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف المؤسسة</span>
            </button>
          )}
        </div>
      )}

      {/* Danger Zone Card Variant */}
      {(variant === "card" || variant === "both") && (
        <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  منطقة العمليات الحساسة (Danger Zone)
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                إجراء غير قابل للتراجع
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              شطب هذه المؤسسة الجامعية نهائياً من المنظومة الوطنية للأجور. يشمل ذلك إزالة الكليات التابعة، وحسابات الإدارة، وفك ارتباط سجلات الرقابة والتدقيق.
            </p>

            {isPrimary ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  هذه المؤسسة تمثل النطاق المرجعي الوطني (UNIPAY-DZ) ولا يمكن حذفها معمارياً.
                </span>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpen}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all shadow-sm hover:shadow-rose-500/20 active:scale-98 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف المؤسسة الجامعية نهائياً...</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-5 animate-in zoom-in-95 duration-150 relative text-right"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    تأكيد حذف المؤسسة الجامعية
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إجراء رقابي مركزي نهائي وشامل
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success State */}
            {isSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-emerald-900">
                  تم حذف المؤسسة بنجاح!
                </h4>
                <p className="text-xs text-emerald-700">
                  جاري تحويلك إلى السجل الوطني للجامعات...
                </p>
              </div>
            ) : (
              <>
                {/* Critical Warning Alert */}
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>تحذير أمني وإداري حاسم</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    أنت على وشك حذف مؤسسة{" "}
                    <strong className="text-rose-900 font-black">
                      «{university.name}»
                    </strong>{" "}
                    بشكل نهائي من قاعدة البيانات الوطنية. لا يمكن استرجاع هذه البيانات بعد الضغط على زر التأكيد.
                  </p>
                </div>

                {/* Resource Impact Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <p className="text-[11px] font-bold text-slate-600">
                    السجلات المرتبطة التي سيتم إزالتها:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200/60 text-slate-700">
                      <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{university.counts.employees} موظف وأستاذ</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200/60 text-slate-700">
                      <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{university.counts.units} كلية ووحدة إدارية</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200/60 text-slate-700">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span>{university.counts.batches} مسيرة رواتب</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200/60 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>{university.counts.users} مستخدم ومسؤول</span>
                    </div>
                  </div>
                </div>

                {/* Confirmation Step 1: Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                    disabled={isPending}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-amber-950 font-semibold leading-relaxed">
                    أقرّ بصفتي مديراً وطنياً عاماً بأنني اطلعت على تبعات العملية وأرغب في تنفيذ الحذف النهائي لهذه المؤسسة.
                  </span>
                </label>

                {/* Confirmation Step 2: Code Verification */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>
                      لتأكيد الحذف، اكتب الرمز المؤسسي:{" "}
                      <code className="bg-rose-100 text-rose-800 font-mono font-black px-2 py-0.5 rounded text-xs select-all">
                        {university.code}
                      </code>
                    </span>
                    {isCodeMatching && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        مطابق
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    placeholder={university.code}
                    disabled={isPending}
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-black text-center text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 uppercase tracking-wider outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Confirmation Step 3: Justification (Optional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">
                    السند الإداري أو سبب الحذف (اختياري للتدقيق الرقابي):
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="مثال: قرار وزاري بإعادة هيكلة أو إلغاء المؤسسة..."
                    disabled={isPending}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 outline-none transition-all"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-rose-500/25 active:scale-98 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جارٍ تنفيذ الحذف بأمان...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>تأكيد الحذف النهائي للمؤسسة</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
