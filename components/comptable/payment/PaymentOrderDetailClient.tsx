"use client";

/**
 * components/comptable/payment/PaymentOrderDetailClient.tsx
 * Vue détaillée d'un ordre de paiement individuel.
 *
 * Exigences de sécurité Phase 8 :
 * - RIB toujours masqué (seuls les 4 derniers chiffres affichés)
 * - Téléchargement via route sécurisée /api/comptable/payment/[id]/download
 * - Avertissement légal obligatoire affiché
 * - Recalcul serveur, pas d'opérations frontend en dur
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  CheckCircle2,
  Lock,
  Clock,
  RefreshCw,
  XCircle,
  Shield,
  FileText,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  confirmPaymentAction,
  closeBatchAction,
} from "@/lib/payment/payment-actions";

interface TransactionRow {
  id: string;
  reference: string;
  amount: number;
  ribMasked: string;
  status: string;
  failureReason: string | null;
  confirmedAt: string | null;
  employee: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    bankName: string | null;
  };
}

interface PaymentOrderDetailProps {
  order: {
    id: string;
    reference: string;
    status: string;
    totalAmount: number;
    employeeCount: number;
    currency: string;
    bankFormat: string;
    fileName: string | null;
    fileHash: string | null;
    fileSize: number | null;
    confirmationMethod: string | null;
    confirmationRef: string | null;
    reconciliationNotes: string | null;
    processingStartedAt: string | null;
    paidAt: string | null;
    closedAt: string | null;
    createdAt: string;
    batchId: string;
    batchLabel: string;
    batchStatus: string;
    periodLabel: string;
    createdByName: string | null;
    confirmedByName: string | null;
  };
  transactions: TransactionRow[];
  user: {
    id: string;
    roleCode: string;
    permissions: string[];
  };
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PREPARED:   { label: "محضَّر",     color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  PROCESSING: { label: "جاري الدفع", color: "bg-blue-100 text-blue-800 border-blue-200",       icon: RefreshCw },
  PAID:       { label: "مدفوع",      color: "bg-green-100 text-green-800 border-green-200",     icon: CheckCircle2 },
  RECONCILED: { label: "مُطابَق",    color: "bg-teal-100 text-teal-800 border-teal-200",        icon: Shield },
  CLOSED:     { label: "مُقفَل",     color: "bg-slate-100 text-slate-700 border-slate-200",     icon: Lock },
  FAILED:     { label: "فشل الدفع",  color: "bg-red-100 text-red-800 border-red-200",           icon: XCircle },
};

export function PaymentOrderDetailClient({
  order,
  transactions,
  user,
}: PaymentOrderDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [copiedHash, setCopiedHash] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [confirmationRef, setConfirmationRef] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canConfirm = user.permissions.includes("payment.confirm");
  const canClose   = user.permissions.includes("payment.close");

  const StatusIcon = ORDER_STATUS_CONFIG[order.status]?.icon ?? Clock;
  const statusConfig = ORDER_STATUS_CONFIG[order.status] ?? {
    label: order.status,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const handleCopyHash = () => {
    if (order.fileHash) {
      navigator.clipboard.writeText(order.fileHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleConfirmPayment = () => {
    if (!confirmationRef.trim()) return;
    startTransition(async () => {
      const res = await confirmPaymentAction({
        batchId: order.batchId,
        confirmationRef: confirmationRef.trim(),
        notes: notes.trim() || undefined,
      });
      if (res.success) {
        setFeedback({ type: "success", message: "تم تأكيد الدفع بنجاح وتحويل الحالة إلى مدفوع (PAID)." });
        setShowConfirmModal(false);
      } else {
        setFeedback({ type: "error", message: res.error ?? "تعذّر تأكيد الدفع." });
      }
    });
  };

  const handleCloseBatch = () => {
    startTransition(async () => {
      const res = await closeBatchAction({
        batchId: order.batchId,
        notes: notes.trim() || undefined,
      });
      if (res.success) {
        setFeedback({ type: "success", message: "تم إقفال الدفعة وأمر الدفع نهائياً (CLOSED). أصبحت السجلات غير قابلة للتعديل." });
        setShowCloseModal(false);
      } else {
        setFeedback({ type: "error", message: res.error ?? "تعذّر إقفال الدفعة." });
      }
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/comptable/payment"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى قائمة أوامر الدفع
        </Link>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusConfig.label}
        </span>
      </div>

      {/* ── Feedback Message ─────────────────────────────────────────────────── */}
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

      {/* ── Avertissement Légal Obligatoire ──────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
        <div>
          <p className="font-bold">تنبيه قانوني ومؤسساتي</p>
          <p className="text-xs text-amber-800 mt-0.5">
            تصدير تقني عام أكاديميا شفاف — غير مُقدَّم كصيغة بنكية رسمية (GENERIC_BANK_TRANSFER). لا يتم إجراء أي تحويل بنكي آلي مباشر دون معالجة محاسبية ومصرفية خارجية معتمدة.
          </p>
        </div>
      </div>

      {/* ── Synthèse de l'Ordre ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-mono">
              {order.reference}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              الدفعة: <span className="font-medium text-slate-700">{order.batchLabel}</span> ({order.periodLabel})
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {order.fileName && (
              <a
                href={`/api/comptable/payment/${order.id}/download`}
                download
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                تحميل الملف التقني (CSV)
              </a>
            )}
            {canConfirm && order.status === "PROCESSING" && (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                تأكيد التنفيذ المتحكَّم فيه
              </button>
            )}
            {canClose && order.status === "PAID" && (
              <button
                onClick={() => setShowCloseModal(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Lock className="w-4 h-4" />
                إقفال الدفعة نهائياً
              </button>
            )}
          </div>
        </div>

        {/* Détails en grille */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-xs text-slate-500 block">المبلغ الإجمالي المصرَّح</span>
            <span className="text-lg font-bold text-emerald-700 mt-1 block">
              {order.totalAmount.toLocaleString("ar-DZ", { minimumFractionDigits: 2 })} {order.currency}
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-xs text-slate-500 block">عدد الموظفين المعنيين</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block">
              {order.employeeCount} موظف
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-xs text-slate-500 block">تاريخ بدء المعالجة</span>
            <span className="text-sm font-semibold text-slate-700 mt-1 block">
              {order.processingStartedAt
                ? new Date(order.processingStartedAt).toLocaleDateString("fr-DZ")
                : "–"}
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-xs text-slate-500 block">تاريخ الإنشاء</span>
            <span className="text-sm font-semibold text-slate-700 mt-1 block">
              {new Date(order.createdAt).toLocaleDateString("fr-DZ")}
            </span>
          </div>
        </div>

        {/* Fichier & Traçabilité */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p className="font-semibold text-slate-700">بيانات الملف التقني</p>
            <div className="text-slate-600 space-y-1">
              <p>اسم الملف: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{order.fileName ?? "لم يُولَّد بعد"}</code></p>
              <p>الصيغة: <span className="font-medium text-slate-800">{order.bankFormat}</span></p>
              {order.fileSize && <p>الحجم: <span className="font-medium text-slate-800">{order.fileSize} بايت</span></p>}
            </div>
            {order.fileHash && (
              <div className="mt-2">
                <span className="text-slate-500 block">بصمة النزاهة الرقمية (SHA-256):</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[11px] bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono break-all max-w-md">
                    {order.fileHash}
                  </code>
                  <button
                    onClick={handleCopyHash}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    title="نسخ البصمة"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-slate-700">بيانات التسوية والتوثيق</p>
            <div className="text-slate-600 space-y-1">
              <p>طريقة التأكيد: <span className="font-medium text-slate-800">{order.confirmationMethod ?? "يدوي متحكَّم فيه"}</span></p>
              {order.confirmationRef && (
                <p>مرجع التأكيد: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">{order.confirmationRef}</code></p>
              )}
              {order.confirmedByName && <p>المؤكِّد: <span className="font-medium text-slate-800">{order.confirmedByName}</span></p>}
              {order.paidAt && <p>تاريخ التأكيد (PAID): <span className="font-medium text-slate-800">{new Date(order.paidAt).toLocaleString("fr-DZ")}</span></p>}
              {order.closedAt && <p>تاريخ الإقفال (CLOSED): <span className="font-medium text-slate-800">{new Date(order.closedAt).toLocaleString("fr-DZ")}</span></p>}
              {order.reconciliationNotes && (
                <p className="mt-1 text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-100">
                  ملاحظات: {order.reconciliationNotes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tableau des Transactions Individuelles ─────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            حركات الدفع الفردية للموظفين ({transactions.length})
          </h2>
          <span className="text-xs text-slate-500">
            يتم عرض الـ RIB بشكل مقنَّع حصرياً (حماية الخصوصية المالية)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">مرجع الحركة</th>
                <th className="py-3 px-4 font-semibold">رقم الموظف</th>
                <th className="py-3 px-4 font-semibold">الاسم واللقب</th>
                <th className="py-3 px-4 font-semibold">البنك</th>
                <th className="py-3 px-4 font-semibold">رقم الحساب (RIB مقنَّع)</th>
                <th className="py-3 px-4 font-semibold">المبلغ الصافي</th>
                <th className="py-3 px-4 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{tx.reference}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{tx.employee.matricule}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {tx.employee.firstName} {tx.employee.lastName}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{tx.employee.bankName ?? "–"}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 tracking-wider">
                    {tx.ribMasked}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    {tx.amount.toLocaleString("ar-DZ", { minimumFractionDigits: 2 })} د.ج
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        tx.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : tx.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {tx.status === "PAID" ? "مدفوع" : tx.status === "FAILED" ? "فشل" : "قيد الانتظار"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Confirmation ──────────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              تأكيد التنفيذ المتحكَّم فيه
            </h3>
            <p className="text-xs text-slate-600">
              أدخل المرجع المحاسبي الخارجي لتأكيد تنفيذ الأمر وتحويل حالة الدفعة إلى <strong>PAID</strong>.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  مرجع التأكيد الإداري / المحاسبي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={confirmationRef}
                  onChange={(e) => setConfirmationRef(e.target.value)}
                  placeholder="مثال: CONF-2026-0042"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ملاحظات التسوية (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="ملاحظات محاسبية إضافية..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isPending || !confirmationRef.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "جاري التأكيد..." : "تأكيد الدفع"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Clôture ───────────────────────────────────────────────────── */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-700" />
              إقفال الدفعة نهائياً (CLOSED)
            </h3>
            <p className="text-xs text-slate-600">
              تحذير: بعد الإقفال تصبح سجلات الأجور وبنود الحضور وحركات الدفع <strong>غير قابلة للتعديل نهائياً</strong>. أي تصحيح مستقبلي سيتطلب فتح نسخة جديدة.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ملاحظات الإقفال النهائي
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="ملاحظات الإقفال القانوني..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowCloseModal(false)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCloseBatch}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50 transition-colors"
              >
                {isPending ? "جاري الإقفال..." : "إقفال نهائي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
