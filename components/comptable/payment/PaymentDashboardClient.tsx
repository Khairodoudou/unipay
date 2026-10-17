"use client";

/**
 * components/comptable/payment/PaymentDashboardClient.tsx
 * Interface de gestion du module de paiement Phase 8.
 *
 * AVERTISSEMENT OBLIGATOIRE affiché dans l'UI :
 * "Export technique générique UNI-PAY — non présenté comme format bancaire officiel."
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CreditCard,
  Play,
  CheckCircle2,
  Lock,
  Download,
  FileText,
  AlertTriangle,
  Info,
  Clock,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import {
  startPaymentProcessingAction,
  confirmPaymentAction,
  closeBatchAction,
  preflightPaymentAction,
} from "@/lib/payment/payment-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthorizedBatch {
  id: string;
  label: string;
  period: string;
  employeeCount: number;
  totalNet: number;
}

interface PaymentOrderRow {
  id: string;
  reference: string;
  status: string;
  totalAmount: number;
  employeeCount: number;
  currency: string;
  bankFormat: string;
  confirmationMethod: string;
  confirmationRef: string | null;
  reconciliationNotes: string | null;
  processingStartedAt: string | null;
  paidAt: string | null;
  closedAt: string | null;
  createdAt: string;
  hasFile: boolean;
  fileHash: string | null;
  transactionCount: number;
  batchId: string;
  batchLabel: string;
  batchStatus: string;
  createdByName: string | null;
  confirmedByName: string | null;
}

interface PaymentDashboardClientProps {
  user: { id: string; roleCode: string; permissions: string[] };
  authorizedBatches: AuthorizedBatch[];
  paymentOrders: PaymentOrderRow[];
  statusCounts: Record<string, number>;
}

// ── Couleurs et labels de statut ──────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PREPARED:   { label: "محضَّر",         color: "bg-yellow-100 text-yellow-800 border-yellow-200",  icon: Clock },
  PROCESSING: { label: "جاري الدفع",     color: "bg-blue-100 text-blue-800 border-blue-200",        icon: RefreshCw },
  PAID:       { label: "مدفوع",          color: "bg-green-100 text-green-800 border-green-200",      icon: CheckCircle2 },
  RECONCILED: { label: "مُطابَق",        color: "bg-teal-100 text-teal-800 border-teal-200",         icon: Shield },
  CLOSED:     { label: "مُقفَل",         color: "bg-slate-100 text-slate-700 border-slate-200",      icon: Lock },
  FAILED:     { label: "فشل الدفع",      color: "bg-red-100 text-red-800 border-red-200",            icon: XCircle },
};

// ── Composant principal ───────────────────────────────────────────────────────

export function PaymentDashboardClient({
  user,
  authorizedBatches,
  paymentOrders,
  statusCounts,
}: PaymentDashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [actionBatchId, setActionBatchId] = useState<string | null>(null);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [closeOrderBatchId, setCloseOrderBatchId] = useState<string | null>(null);
  const [confirmationRef, setConfirmationRef] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [preflight, setPreflight] = useState<Record<string, unknown> | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const canProcess  = user.permissions.includes("payment.process");
  const canConfirm  = user.permissions.includes("payment.confirm");
  const canClose    = user.permissions.includes("payment.close");
  const canRead     = user.permissions.includes("payment.read");

  const setMsg = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handlePreflight = (batchId: string) => {
    setActionBatchId(batchId);
    setPreflight(null);
    startTransition(async () => {
      const res = await preflightPaymentAction(batchId);
      if (res.success && res.data) {
        setPreflight(res.data as unknown as Record<string, unknown>);
      } else {
        setMsg("error", res.error ?? "خطأ في التحقق المسبق.");
      }
    });
  };

  const handleStartProcessing = (batchId: string) => {
    startTransition(async () => {
      const res = await startPaymentProcessingAction(batchId);
      if (res.success) {
        setMsg("success", `✅ تم إطلاق معالجة الدفع — أمر الدفع: ${(res.data as { reference?: string })?.reference ?? ""}`);
        setPreflight(null);
        setActionBatchId(null);
      } else {
        setMsg("error", res.error ?? "فشل إطلاق الدفع.");
      }
    });
  };

  const handleConfirmPayment = (orderId: string, batchId: string) => {
    if (!confirmationRef.trim() || confirmationRef.trim().length < 3) {
      setMsg("error", "مرجع التأكيد مطلوب (3 أحرف كحد أدنى).");
      return;
    }
    startTransition(async () => {
      const res = await confirmPaymentAction({
        batchId,
        confirmationRef: confirmationRef.trim(),
        notes: confirmNotes.trim() || undefined,
      });
      if (res.success) {
        setMsg("success", `✅ تم تأكيد الدفع — الدفعة انتقلت إلى PAID`);
        setConfirmOrderId(null);
        setConfirmationRef("");
        setConfirmNotes("");
      } else {
        setMsg("error", res.error ?? "فشل تأكيد الدفع.");
      }
    });
  };

  const handleCloseBatch = (batchId: string) => {
    startTransition(async () => {
      const res = await closeBatchAction({
        batchId,
        notes: closeNotes.trim() || undefined,
      });
      if (res.success) {
        setMsg("success", `🔒 تم إقفال الدفعة نهائياً.`);
        setCloseOrderBatchId(null);
        setCloseNotes("");
      } else {
        setMsg("error", res.error ?? "فشل إقفال الدفعة.");
      }
    });
  };

  const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8" dir="rtl">

      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              إدارة أوامر الدفع والتسوية
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              الإطار المحاسبي المتحكَّم فيه لدفع مسيرات الأجور بعد التأشيرة المالية
            </p>
          </div>
          {/* Avertissement légal obligatoire */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 max-w-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>ملاحظة قانونية:</strong> الملفات المُولَّدة هي تصدير تقني عام — غير مُقدَّم كصيغة بنكية رسمية.
            </span>
          </div>
        </div>

        {/* Counters */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["PROCESSING", "PAID", "CLOSED", "FAILED"] as const).map(s => (
            <div key={s} className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
              <div className="text-2xl font-bold text-slate-800">{statusCounts[s] ?? 0}</div>
              <div className="text-xs text-slate-500 mt-0.5">{ORDER_STATUS_CONFIG[s]?.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feedback ──────────────────────────────────────────────────────────── */}
      {feedback && (
        <div
          className={`rounded-xl p-4 text-sm font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* ── Dossiers AUTHORIZED → démarrer paiement ───────────────────────── */}
      {canProcess && authorizedBatches.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-600" />
            دفعات مُرخَّصة — جاهزة لبدء الدفع ({authorizedBatches.length})
          </h2>
          <div className="space-y-3">
            {authorizedBatches.map(batch => (
              <div
                key={batch.id}
                className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{batch.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      الفترة: {batch.period} · {batch.employeeCount} موظف ·{" "}
                      <span className="font-medium text-emerald-700">
                        {batch.totalNet.toLocaleString("ar-DZ", { minimumFractionDigits: 2 })} د.ج
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handlePreflight(batch.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                      التحقق المسبق
                    </button>
                    <button
                      onClick={() => handleStartProcessing(batch.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isPending && actionBatchId === batch.id ? "جاري التنفيذ..." : "بدء معالجة الدفع"}
                    </button>
                  </div>
                </div>

                {/* Rapport pre-flight */}
                {actionBatchId === batch.id && preflight && (
                  <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <p className="font-semibold text-slate-700">نتيجة التحقق المسبق</p>
                    {(preflight as { valid?: boolean; totalAmount?: number; employeeCount?: number; errors?: string[]; warnings?: string[] }).valid === true ? (
                      <div className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        التحقق ناجح — المبلغ الإجمالي:{" "}
                        {Number((preflight as { totalAmount?: number }).totalAmount).toLocaleString("ar-DZ", { minimumFractionDigits: 2 })} د.ج
                        · {(preflight as { employeeCount?: number }).employeeCount} موظف
                      </div>
                    ) : (
                      <div className="space-y-1 text-red-700">
                        {((preflight as { errors?: string[] }).errors ?? []).map((e, i) => (
                          <p key={i} className="flex items-start gap-1.5">
                            <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            {e}
                          </p>
                        ))}
                        {((preflight as { warnings?: string[] }).warnings ?? []).map((w, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            {w}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Ordres de paiement existants ──────────────────────────────────── */}
      {canRead && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            سجل أوامر الدفع ({totalOrders})
          </h2>

          {paymentOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">
              لا توجد أوامر دفع بعد.
            </div>
          ) : (
            <div className="space-y-3">
              {paymentOrders.map(order => {
                const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.PREPARED;
                const Icon = cfg.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-xs">
                    {/* Ligne principale */}
                    <div
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg border ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{order.reference}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{order.batchLabel}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {order.employeeCount} موظف ·{" "}
                            {order.totalAmount.toLocaleString("ar-DZ", { minimumFractionDigits: 2 })} {order.currency}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Détails dépliés */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-5 space-y-4 text-xs">
                        {/* Métadonnées */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <p className="text-slate-400 mb-0.5">طريقة الدفع</p>
                            <p className="font-medium text-slate-700">{order.confirmationMethod}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">صيغة الملف</p>
                            <p className="font-medium text-slate-700">{order.bankFormat}</p>
                          </div>
                          {order.paidAt && (
                            <div>
                              <p className="text-slate-400 mb-0.5">تاريخ الدفع</p>
                              <p className="font-medium text-slate-700">
                                {new Date(order.paidAt).toLocaleDateString("fr-DZ")}
                              </p>
                            </div>
                          )}
                          {order.closedAt && (
                            <div>
                              <p className="text-slate-400 mb-0.5">تاريخ الإقفال</p>
                              <p className="font-medium text-slate-700">
                                {new Date(order.closedAt).toLocaleDateString("fr-DZ")}
                              </p>
                            </div>
                          )}
                          {order.confirmationRef && (
                            <div>
                              <p className="text-slate-400 mb-0.5">مرجع التأكيد</p>
                              <p className="font-mono text-slate-700">{order.confirmationRef}</p>
                            </div>
                          )}
                          {order.confirmedByName && (
                            <div>
                              <p className="text-slate-400 mb-0.5">أكّده</p>
                              <p className="font-medium text-slate-700">{order.confirmedByName}</p>
                            </div>
                          )}
                          {order.fileHash && (
                            <div className="col-span-2 sm:col-span-3">
                              <p className="text-slate-400 mb-0.5">SHA-256 الملف</p>
                              <p className="font-mono text-slate-600 truncate text-[10px]">{order.fileHash}</p>
                            </div>
                          )}
                        </div>

                        {/* Notes de rapprochement */}
                        {order.reconciliationNotes && (
                          <p className="text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <strong>ملاحظات التسوية:</strong> {order.reconciliationNotes}
                          </p>
                        )}

                        {/* Avertissement */}
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-700">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            هذا الملف <strong>تصدير تقني عام (GENERIC_BANK_TRANSFER)</strong> — غير مُقدَّم كصيغة بنكية رسمية.
                            UNI-PAY لا يُنفّذ أي تحويل بنكي حقيقي.
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap pt-2">
                          {/* Télécharger le fichier */}
                          {order.hasFile && ["PROCESSING", "PAID", "CLOSED"].includes(order.status) && (
                            <a
                              href={`/api/comptable/payment/${order.id}/download`}
                              download
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              تحميل الملف التقني
                            </a>
                          )}

                          {/* Voir détails complets */}
                          <Link
                            href={`/comptable/payment/${order.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            عرض التفاصيل وحركات الدفع
                          </Link>

                          {/* Confirmer paiement */}
                          {canConfirm && order.status === "PROCESSING" && (
                            <button
                              onClick={() => {
                                setConfirmOrderId(order.id);
                                setConfirmationRef("");
                                setConfirmNotes("");
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تأكيد تنفيذ الدفع
                            </button>
                          )}

                          {/* Modal confirmation */}
                          {confirmOrderId === order.id && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" dir="rtl">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-5 h-5" />
                                  تأكيد تنفيذ الدفع المتحكَّم فيه
                                </div>
                                <p className="text-xs text-slate-500">
                                  يُعدّ هذا تأكيداً رسمياً بأن الدفع تم تنفيذه خارج المنصة (MANUAL_CONTROLLED).
                                </p>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    مرجع التأكيد <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={confirmationRef}
                                    onChange={e => setConfirmationRef(e.target.value)}
                                    placeholder="مثال: TR-2026-10-001"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    ملاحظات (اختياري)
                                  </label>
                                  <textarea
                                    value={confirmNotes}
                                    onChange={e => setConfirmNotes(e.target.value)}
                                    rows={2}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => handleConfirmPayment(order.id, order.batchId)}
                                    disabled={isPending || confirmationRef.trim().length < 3}
                                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                  >
                                    {isPending ? "جاري التأكيد..." : "تأكيد الدفع"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmOrderId(null)}
                                    className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Clôturer */}
                          {canClose && order.status === "PAID" && (
                            <button
                              onClick={() => {
                                setCloseOrderBatchId(order.batchId);
                                setCloseNotes("");
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              إقفال الدفعة نهائياً
                            </button>
                          )}

                          {/* Modal clôture */}
                          {closeOrderBatchId === order.batchId && order.status === "PAID" && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" dir="rtl">
                                <div className="flex items-center gap-2 text-slate-800 font-bold">
                                  <Lock className="w-5 h-5" />
                                  إقفال نهائي للدفعة
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                                  <AlertTriangle className="inline w-3.5 h-3.5 ml-1" />
                                  <strong>تحذير:</strong> هذه العملية لا رجعة فيها. بعد الإقفال، لا يمكن تعديل الدفعة.
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    ملاحظات الإقفال (اختياري)
                                  </label>
                                  <textarea
                                    value={closeNotes}
                                    onChange={e => setCloseNotes(e.target.value)}
                                    rows={2}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => handleCloseBatch(order.batchId)}
                                    disabled={isPending}
                                    className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors"
                                  >
                                    {isPending ? "جاري الإقفال..." : "إقفال نهائياً"}
                                  </button>
                                  <button
                                    onClick={() => setCloseOrderBatchId(null)}
                                    className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
