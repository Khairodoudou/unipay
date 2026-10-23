"use client";

/**
 * components/comptable/payment/PaymentDashboardClient.tsx
 * Interface de gestion du module de paiement Phase 8 avec filtrage professionnel complet.
 *
 * AVERTISSEMENT OBLIGATOIRE affiché dans l'UI :
 * "Export technique générique أكاديميا شفاف — non présenté comme format bancaire officiel."
 */

import { useState, useTransition, useMemo, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Shield,
  Search,
  Filter,
  X,
  Calendar,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  Users,
  Coins,
  Receipt,
  ExternalLink,
} from "lucide-react";
import {
  startPaymentProcessingAction,
  confirmPaymentAction,
  closeBatchAction,
  preflightPaymentAction,
} from "@/lib/payment/payment-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthorizedBatch {
  id: string;
  label: string;
  period: string;
  periodYear?: number | null;
  periodMonth?: number | null;
  employeeCount: number;
  totalNet: number;
  createdAt?: string;
}

export interface PaymentOrderRow {
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
  batchPeriodYear?: number | null;
  batchPeriodMonth?: number | null;
  createdByName: string | null;
  confirmedByName: string | null;
}

export interface PaymentDashboardClientProps {
  user: { id: string; roleCode: string; permissions: string[] };
  authorizedBatches: AuthorizedBatch[];
  paymentOrders: PaymentOrderRow[];
  statusCounts: Record<string, number>;
  availableYears?: number[];
}

// ── Configuration des statuts d'ordre de paiement ─────────────────────────────

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; borderActive: string; bgActive: string; icon: React.ElementType; badgeBg: string }
> = {
  PREPARED: {
    label: "محضَّر",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    borderActive: "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50",
    bgActive: "bg-amber-500 text-white",
    icon: Clock,
    badgeBg: "bg-amber-500",
  },
  PROCESSING: {
    label: "جاري الدفع",
    color: "bg-blue-50 text-blue-800 border-blue-200",
    borderActive: "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50",
    bgActive: "bg-blue-600 text-white",
    icon: RefreshCw,
    badgeBg: "bg-blue-500",
  },
  PAID: {
    label: "مدفوع",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    borderActive: "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50",
    bgActive: "bg-emerald-600 text-white",
    icon: CheckCircle2,
    badgeBg: "bg-emerald-500",
  },
  RECONCILED: {
    label: "مُطابَق",
    color: "bg-teal-50 text-teal-800 border-teal-200",
    borderActive: "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/50",
    bgActive: "bg-teal-600 text-white",
    icon: Shield,
    badgeBg: "bg-teal-500",
  },
  CLOSED: {
    label: "مُقفَل",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    borderActive: "border-slate-700 ring-2 ring-slate-700/20 bg-slate-100/70",
    bgActive: "bg-slate-800 text-white",
    icon: Lock,
    badgeBg: "bg-slate-600",
  },
  FAILED: {
    label: "فشل الدفع",
    color: "bg-rose-50 text-rose-800 border-rose-200",
    borderActive: "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50",
    bgActive: "bg-rose-600 text-white",
    icon: XCircle,
    badgeBg: "bg-rose-500",
  },
};

const MONTH_NAMES = [
  "جانفي (01)", "فيفري (02)", "مارس (03)", "أفريل (04)",
  "ماي (05)", "جوان (06)", "جويلية (07)", "أوت (08)",
  "سبتمبر (09)", "أكتوبر (10)", "نوفمبر (11)", "ديسمبر (12)",
];

// ── Composant principal ───────────────────────────────────────────────────────

export function PaymentDashboardClient({
  user,
  authorizedBatches,
  paymentOrders,
  statusCounts,
  availableYears = [],
}: PaymentDashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [processingBatchId, setProcessingBatchId] = useState<string | null>(null);
  const [loadingPreflightId, setLoadingPreflightId] = useState<string | null>(null);
  const [preflightMap, setPreflightMap] = useState<Record<string, Record<string, unknown>>>({});
  const [openPreflights, setOpenPreflights] = useState<Record<string, boolean>>({});
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [closeOrderBatchId, setCloseOrderBatchId] = useState<string | null>(null);
  const [confirmationRef, setConfirmationRef] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // ── Filtres professionnels ──────────────────────────────────────────────────
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "employees_desc">("date_desc");
  const [authorizedSearch, setAuthorizedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const yearScrollRef = useRef<HTMLDivElement>(null);

  const canProcess = user.permissions.includes("payment.process");
  const canConfirm = user.permissions.includes("payment.confirm");
  const canClose   = user.permissions.includes("payment.close");
  const canRead    = user.permissions.includes("payment.read");

  const setMsg = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Années disponibles
  const validYears = useMemo(() => {
    const list = availableYears.filter((y) => y >= 2024 && y <= 2035).sort((a, b) => a - b);
    return list.length === 0 ? [2024, 2025, 2026, 2027, 2028, 2029, 2030] : list;
  }, [availableYears]);

  const scrollYears = (direction: "left" | "right") => {
    if (yearScrollRef.current) {
      yearScrollRef.current.scrollBy({ left: direction === "left" ? -180 : 180, behavior: "smooth" });
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handlePreflight = (batchId: string) => {
    if (openPreflights[batchId]) {
      setOpenPreflights(prev => ({ ...prev, [batchId]: false }));
      return;
    }

    setOpenPreflights(prev => ({ ...prev, [batchId]: true }));
    if (preflightMap[batchId]) return;

    setLoadingPreflightId(batchId);
    startTransition(async () => {
      try {
        const res = await preflightPaymentAction(batchId);
        if (res.success && res.data) {
          setPreflightMap(prev => ({ ...prev, [batchId]: res.data as unknown as Record<string, unknown> }));
        } else {
          setMsg("error", res.error ?? "خطأ في التحقق المسبق.");
        }
      } finally {
        setLoadingPreflightId(null);
      }
    });
  };

  const handleStartProcessing = (batchId: string) => {
    setProcessingBatchId(batchId);
    startTransition(async () => {
      try {
        const res = await startPaymentProcessingAction(batchId);
        if (res.success) {
          setMsg("success", `✅ تم إطلاق معالجة الدفع — أمر الدفع: ${(res.data as { reference?: string })?.reference ?? ""}`);
          setOpenPreflights(prev => ({ ...prev, [batchId]: false }));
        } else {
          setMsg("error", res.error ?? "فشل إطلاق الدفع.");
        }
      } finally {
        setProcessingBatchId(null);
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

  // ── Filtrage des ordres de paiement ─────────────────────────────────────────

  const orderCountsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: paymentOrders.length,
      PROCESSING: 0,
      PAID: 0,
      CLOSED: 0,
      RECONCILED: 0,
      FAILED: 0,
      PREPARED: 0,
    };
    for (const o of paymentOrders) {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      } else {
        counts[o.status] = 1;
      }
    }
    return counts;
  }, [paymentOrders]);

  const filteredOrders = useMemo(() => {
    return paymentOrders
      .filter((order) => {
        // Filtre de statut
        if (statusTab !== "ALL" && order.status !== statusTab) {
          return false;
        }

        // Filtre d'année
        if (selectedYear !== "ALL") {
          const yr = order.batchPeriodYear ?? (order.createdAt ? new Date(order.createdAt).getFullYear() : null);
          if (yr !== Number(selectedYear)) return false;
        }

        // Filtre de mois
        if (selectedMonth !== "ALL") {
          const mo = order.batchPeriodMonth ?? (order.createdAt ? new Date(order.createdAt).getMonth() + 1 : null);
          if (mo !== Number(selectedMonth)) return false;
        }

        // Recherche textuelle
        if (orderSearch.trim()) {
          const q = orderSearch.toLowerCase().trim();
          const ref = (order.reference || "").toLowerCase();
          const batch = (order.batchLabel || "").toLowerCase();
          const confRef = (order.confirmationRef || "").toLowerCase();
          const creator = (order.createdByName || "").toLowerCase();
          const confirmer = (order.confirmedByName || "").toLowerCase();
          const notes = (order.reconciliationNotes || "").toLowerCase();
          if (
            !ref.includes(q) &&
            !batch.includes(q) &&
            !confRef.includes(q) &&
            !creator.includes(q) &&
            !confirmer.includes(q) &&
            !notes.includes(q)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date_asc") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "amount_desc") {
          return b.totalAmount - a.totalAmount;
        }
        if (sortBy === "amount_asc") {
          return a.totalAmount - b.totalAmount;
        }
        if (sortBy === "employees_desc") {
          return b.employeeCount - a.employeeCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [paymentOrders, statusTab, selectedYear, selectedMonth, orderSearch, sortBy]);

  // Pagination des ordres
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    if (pageSize >= filteredOrders.length) return filteredOrders;
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  // Statistiques financières filtrées
  const filteredFinancialSummary = useMemo(() => {
    const totalAmount = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalEmployees = filteredOrders.reduce((sum, o) => sum + o.employeeCount, 0);
    return {
      count: filteredOrders.length,
      totalAmount,
      totalEmployees,
    };
  }, [filteredOrders]);

  // ── Filtrage des batches autorisés ──────────────────────────────────────────

  const filteredAuthorizedBatches = useMemo(() => {
    return authorizedBatches.filter((batch) => {
      if (selectedYear !== "ALL" && batch.periodYear && batch.periodYear !== Number(selectedYear)) {
        return false;
      }
      if (selectedMonth !== "ALL" && batch.periodMonth && batch.periodMonth !== Number(selectedMonth)) {
        return false;
      }
      if (authorizedSearch.trim()) {
        const q = authorizedSearch.toLowerCase().trim();
        const label = (batch.label || "").toLowerCase();
        const period = (batch.period || "").toLowerCase();
        if (!label.includes(q) && !period.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [authorizedBatches, selectedYear, selectedMonth, authorizedSearch]);

  const hasActiveFilters =
    orderSearch.trim() !== "" ||
    statusTab !== "ALL" ||
    selectedYear !== "ALL" ||
    selectedMonth !== "ALL" ||
    sortBy !== "date_desc" ||
    authorizedSearch.trim() !== "";

  const resetFilters = () => {
    setOrderSearch("");
    setStatusTab("ALL");
    setSelectedYear("ALL");
    setSelectedMonth("ALL");
    setSortBy("date_desc");
    setAuthorizedSearch("");
    setPage(1);
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("ar-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const fmtInt = (n: number) =>
    new Intl.NumberFormat("ar-DZ").format(n);

  // Status Tab definition
  const STATUS_TABS = [
    { key: "ALL", label: "جميع الأوامر", count: orderCountsByStatus.ALL ?? 0, icon: Receipt, activeCls: "bg-slate-900 text-white" },
    { key: "PROCESSING", label: "جاري الدفع", count: orderCountsByStatus.PROCESSING ?? 0, icon: RefreshCw, activeCls: "bg-blue-600 text-white" },
    { key: "PAID", label: "مدفوع", count: orderCountsByStatus.PAID ?? 0, icon: CheckCircle2, activeCls: "bg-emerald-600 text-white" },
    { key: "CLOSED", label: "مُقفَل", count: orderCountsByStatus.CLOSED ?? 0, icon: Lock, activeCls: "bg-slate-700 text-white" },
    { key: "RECONCILED", label: "مُطابَق", count: orderCountsByStatus.RECONCILED ?? 0, icon: Shield, activeCls: "bg-teal-600 text-white" },
    { key: "FAILED", label: "فشل الدفع", count: orderCountsByStatus.FAILED ?? 0, icon: XCircle, activeCls: "bg-rose-600 text-white" },
    { key: "PREPARED", label: "محضَّر", count: orderCountsByStatus.PREPARED ?? 0, icon: Clock, activeCls: "bg-amber-600 text-white" },
  ];

  return (
    <div className="space-y-8" dir="rtl">

      {/* ── En-tête & Avertissement légal ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  إدارة أوامر الدفع والتسوية
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  الإطار المحاسبي لمتابعة أوامر الدفع وتأكيد الحوالات بعد التأشيرة المالية
                </p>
              </div>
            </div>
          </div>
          {/* Avertissement légal obligatoire */}
          <div className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3.5 py-2.5 text-xs text-amber-900 max-w-md shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="leading-relaxed">
              <strong className="font-semibold">ملاحظة تنظيمية:</strong> الملفات المُولَّدة هي تصدير تقني عام (Generic Bank Format) غير مقدَّم كصيغة بنكية موحدة ملزمة.
            </div>
          </div>
        </div>

        {/* ── KPI Cards interactives (Click to Filter) ─────────────────────── */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              مؤشرات الأداء السريعة (اضغط على أي مؤشر لتصفية القائمة):
            </span>
            {statusTab !== "ALL" && (
              <button
                type="button"
                onClick={() => setStatusTab("ALL")}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>إلغاء تحديد الحالة</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {STATUS_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusTab(prev => (prev === tab.key ? "ALL" : tab.key));
                    setPage(1);
                  }}
                  className={`group relative text-right p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30"
                      : "bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[11px] font-semibold truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {tab.label}
                    </span>
                    <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-extrabold ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {tab.count}
                    </span>
                    <span className={`text-[10px] ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                      أمر
                    </span>
                  </div>
                  {isSelected && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Feedback Message ─────────────────────────────────────────────────── */}
      {feedback && (
        <div
          className={`rounded-xl p-4 text-sm font-medium border flex items-center justify-between shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Barre de filtre professionnelle unifiée ─────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Ligne 1: Recherche globale + Menus déroulants + Bouton Reset */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setPage(1);
              }}
              placeholder="بحث برقم الأمر (OP-...)، اسم الدفعة، مرجع التأكيد (TR-...) أو اسم المسؤول..."
              className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
            {orderSearch && (
              <button
                onClick={() => {
                  setOrderSearch("");
                  setPage(1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Menus de filtres & Tri */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sélection de l'année */}
            <div className="relative min-w-[125px]">
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="ALL">كل السنوات</option>
                {validYears.map((yr) => (
                  <option key={yr} value={yr}>
                    سنة {yr}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sélection du mois */}
            <div className="relative min-w-[135px]">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="ALL">كل الأشهر</option>
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Tri */}
            <div className="relative min-w-[155px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="date_desc">الأحدث تاريخاً</option>
                <option value="date_asc">الأقدم تاريخاً</option>
                <option value="amount_desc">المبلغ (الأعلى)</option>
                <option value="amount_asc">المبلغ (الأدنى)</option>
                <option value="employees_desc">عدد الموظفين (الأعلى)</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Réinitialiser les filtres */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                title="إعادة تعيين كافة الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Ligne 2: Sélecteur rapide d'année horizontal à défilement */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 shrink-0">السنة المالية:</span>
          </div>

          <button
            type="button"
            onClick={() => scrollYears("right")}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0 cursor-pointer"
            title="تمرير لليمين"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div
            ref={yearScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedYear("ALL");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                selectedYear === "ALL"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              الكل
            </button>
            {validYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setSelectedYear(String(yr));
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedYear === String(yr)
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollYears("left")}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0 cursor-pointer"
            title="تمرير لليسار"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ligne 3: Résumé statistique des résultats filtrés */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-700">
              النتائج المصفاة:{" "}
              <strong className="text-emerald-700 font-bold">{filteredFinancialSummary.count}</strong> أمر دفع
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              إجمالي المبالغ:{" "}
              <strong className="text-slate-900 font-bold">
                {fmtCurrency(filteredFinancialSummary.totalAmount)} د.ج
              </strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              الموظفون المشمولون:{" "}
              <strong className="text-slate-900 font-bold">
                {fmtInt(filteredFinancialSummary.totalEmployees)} موظف
              </strong>
            </span>
          </div>

          {/* Badges des filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {statusTab !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                  <span>الحالة: {ORDER_STATUS_CONFIG[statusTab]?.label ?? statusTab}</span>
                  <button onClick={() => setStatusTab("ALL")} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedYear !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                  <span>السنة: {selectedYear}</span>
                  <button onClick={() => setSelectedYear("ALL")} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedMonth !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                  <span>الشهر: {MONTH_NAMES[Number(selectedMonth) - 1]}</span>
                  <button onClick={() => setSelectedMonth("ALL")} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {orderSearch && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                  <span>بحث: &quot;{orderSearch}&quot;</span>
                  <button onClick={() => setOrderSearch("")} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 1: Batches AUTHORIZED → Prêts à déclencher un paiement ──── */}
      {canProcess && authorizedBatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600" />
              <span>دفعات مُرخَّصة — جاهزة لبدء الدفع</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {filteredAuthorizedBatches.length} من {authorizedBatches.length}
              </span>
            </h2>

            {/* Mini recherche pour les batches autorisés si plus de 2 */}
            {authorizedBatches.length > 2 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={authorizedSearch}
                  onChange={(e) => setAuthorizedSearch(e.target.value)}
                  placeholder="تصفية الدفعات المرخصة..."
                  className="w-full pr-8 pl-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {filteredAuthorizedBatches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-xs">
              لا توجد دفعات مرخصة تطابق معايير التصفية الحالية (السنة / الشهر / البحث).
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAuthorizedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white border border-emerald-200/90 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{batch.label}</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          مرخص للصرف
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>الفترة: <strong className="text-slate-700">{batch.period}</strong></span>
                        <span className="text-slate-300">·</span>
                        <span>{batch.employeeCount} موظف</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-emerald-700">
                          {fmtCurrency(batch.totalNet)} د.ج
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap items-center">
                      <button
                        onClick={() => handlePreflight(batch.id)}
                        disabled={isPending && loadingPreflightId === batch.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          openPreflights[batch.id]
                            ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        }`}
                      >
                        <Info className="w-3.5 h-3.5" />
                        {loadingPreflightId === batch.id
                          ? "جاري الفحص..."
                          : openPreflights[batch.id]
                          ? "إخفاء التحقق"
                          : "التحقق المسبق"}
                      </button>

                      {(() => {
                        const pData = preflightMap[batch.id];
                        const isPreflightFailed = Boolean(pData && (pData as { valid?: boolean }).valid === false);
                        const isThisProcessing = processingBatchId === batch.id;
                        return (
                          <button
                            onClick={() => handleStartProcessing(batch.id)}
                            disabled={isPending || isPreflightFailed}
                            title={
                              isPreflightFailed
                                ? "لا يمكن بدء معالجة الدفع لوجود أخطاء في التحقق المسبق"
                                : undefined
                            }
                            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                              isPreflightFailed
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-xs"
                            }`}
                          >
                            <Play className="w-3.5 h-3.5" />
                            {isThisProcessing ? "جاري إطلاق الدفع..." : "بدء معالجة الدفع"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Rapport pre-flight */}
                  {openPreflights[batch.id] && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800">
                          نتيجة التحقق المسبق — <span className="text-slate-600">{batch.label}</span>
                        </p>
                        {loadingPreflightId === batch.id && (
                          <span className="text-slate-400 text-[11px] animate-pulse">
                            جاري الفحص الحسابي والبنكي...
                          </span>
                        )}
                      </div>
                      {loadingPreflightId === batch.id && !preflightMap[batch.id] && (
                        <div className="py-2 text-slate-500">جاري الاتصال والتحقق من الحسابات وسلامة الـ RIBs...</div>
                      )}
                      {preflightMap[batch.id] && (() => {
                        const p = preflightMap[batch.id] as {
                          valid?: boolean;
                          totalAmount?: number;
                          employeeCount?: number;
                          errors?: string[];
                          warnings?: string[];
                        };
                        return p.valid === true ? (
                          <div className="text-emerald-700 flex items-center gap-1.5 py-1">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>
                              التحقق ناجح — المبلغ الإجمالي:{" "}
                              <strong>{fmtCurrency(p.totalAmount ?? 0)} د.ج</strong> · {p.employeeCount} موظف
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-rose-700 py-1">
                            {(p.errors ?? []).map((e, i) => (
                              <p key={i} className="flex items-start gap-1.5">
                                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-600" />
                                <span>{e}</span>
                              </p>
                            ))}
                            {(p.warnings ?? []).map((w, i) => (
                              <p key={i} className="flex items-start gap-1.5 text-amber-700">
                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                                <span>{w}</span>
                              </p>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Section 2: Ordres de paiement existants ─────────────────────────── */}
      {canRead && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>سجل أوامر الدفع</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredOrders.length} {filteredOrders.length !== paymentOrders.length ? `من ${paymentOrders.length}` : ""}
              </span>
            </h2>

            {/* Pagination Size Selector */}
            {filteredOrders.length > 10 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>عرض في الصفحة:</span>
                {[10, 25, 50].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setPageSize(sz);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                      pageSize === sz
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Aucun ordre trouvé */}
          {paymentOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <CreditCard className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="font-semibold text-slate-600 text-sm">لا توجد أوامر دفع بعد في المؤسسة.</p>
              <p className="text-xs text-slate-400">ستظهر هنا أوامر الدفع بمجرد إطلاقها من الدفعات المرخصة أعلاه.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <SlidersHorizontal className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">
                لم يتم العثور على أي أوامر دفع تطابق خيارات التصفية المحددة.
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                جرب تعديل مصطلح البحث، السنة، الشهر أو تغيير حالة أمر الدفع المحددة.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط كافة الفلاتر</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedOrders.map((order) => {
                const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.PREPARED;
                const Icon = cfg.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-slate-200 rounded-xl shadow-xs transition-shadow hover:shadow-sm"
                  >
                    {/* Ligne principale cliquable */}
                    <div
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm tracking-wide">
                              {order.reference}
                            </span>
                            {order.batchPeriodYear && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                دورة {order.batchPeriodYear}/{order.batchPeriodMonth ? String(order.batchPeriodMonth).padStart(2, "0") : ""}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-medium">{order.batchLabel}</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{fmtInt(order.employeeCount)} موظف</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-bold text-slate-800">
                              {fmtCurrency(order.totalAmount)} {order.currency}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span>{order.transactionCount} حركة</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </span>
                        <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Détails dépliés */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-5 space-y-4 text-xs bg-slate-50/40">
                        {/* Métadonnées en grille */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <p className="text-slate-400 text-[11px] mb-0.5">طريقة الدفع</p>
                            <p className="font-semibold text-slate-800">{order.confirmationMethod}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <p className="text-slate-400 text-[11px] mb-0.5">صيغة الملف</p>
                            <p className="font-semibold text-slate-800">{order.bankFormat}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <p className="text-slate-400 text-[11px] mb-0.5">تاريخ الإنشاء</p>
                            <p className="font-semibold text-slate-800">
                              {new Date(order.createdAt).toLocaleDateString("fr-DZ")}
                            </p>
                          </div>
                          {order.paidAt && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <p className="text-slate-400 text-[11px] mb-0.5">تاريخ الدفع</p>
                              <p className="font-semibold text-emerald-700">
                                {new Date(order.paidAt).toLocaleDateString("fr-DZ")}
                              </p>
                            </div>
                          )}
                          {order.closedAt && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <p className="text-slate-400 text-[11px] mb-0.5">تاريخ الإقفال</p>
                              <p className="font-semibold text-slate-700">
                                {new Date(order.closedAt).toLocaleDateString("fr-DZ")}
                              </p>
                            </div>
                          )}
                          {order.confirmationRef && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <p className="text-slate-400 text-[11px] mb-0.5">مرجع التأكيد</p>
                              <p className="font-mono font-bold text-slate-800">{order.confirmationRef}</p>
                            </div>
                          )}
                          {order.confirmedByName && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <p className="text-slate-400 text-[11px] mb-0.5">أكّده</p>
                              <p className="font-semibold text-slate-800">{order.confirmedByName}</p>
                            </div>
                          )}
                          {order.createdByName && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <p className="text-slate-400 text-[11px] mb-0.5">أنشأه</p>
                              <p className="font-semibold text-slate-800">{order.createdByName}</p>
                            </div>
                          )}
                        </div>

                        {/* File Hash */}
                        {order.fileHash && (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <p className="text-slate-400 text-[11px] mb-0.5">SHA-256 بصمة الملف التقني المولد</p>
                            <p className="font-mono text-slate-600 truncate text-[11px]" dir="ltr">
                              {order.fileHash}
                            </p>
                          </div>
                        )}

                        {/* Notes de rapprochement */}
                        {order.reconciliationNotes && (
                          <div className="text-slate-700 bg-white rounded-lg p-3 border border-slate-200/80">
                            <strong className="text-slate-900">ملاحظات التسوية:</strong> {order.reconciliationNotes}
                          </div>
                        )}

                        {/* Avertissement */}
                        <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/70 rounded-lg p-3 text-amber-800">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                          <span>
                            هذا الملف <strong>تصدير تقني عام (GENERIC_BANK_TRANSFER)</strong> — غير مُقدَّم كصيغة بنكية رسمية ملزمة.
                            أكاديميا شفاف لا يُنفّذ أي تحويل بنكي حقيقي تلقائي.
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-200/70">
                          {/* Télécharger le fichier */}
                          {order.hasFile && ["PROCESSING", "PAID", "CLOSED"].includes(order.status) && (
                            <a
                              href={`/api/comptable/payment/${order.id}/download`}
                              download
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              تحميل الملف التقني
                            </a>
                          )}

                          {/* Voir détails complets */}
                          <Link
                            href={`/comptable/payment/${order.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تأكيد تنفيذ الدفع
                            </button>
                          )}

                          {/* Clôturer */}
                          {canClose && order.status === "PAID" && (
                            <button
                              onClick={() => {
                                setCloseOrderBatchId(order.batchId);
                                setCloseNotes("");
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              إقفال الدفعة نهائياً
                            </button>
                          )}
                        </div>

                        {/* Modal confirmation */}
                        {confirmOrderId === order.id && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
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
                                  onChange={(e) => setConfirmationRef(e.target.value)}
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
                                  onChange={(e) => setConfirmNotes(e.target.value)}
                                  rows={2}
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handleConfirmPayment(order.id, order.batchId)}
                                  disabled={isPending || confirmationRef.trim().length < 3}
                                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  {isPending ? "جاري التأكيد..." : "تأكيد الدفع"}
                                </button>
                                <button
                                  onClick={() => setConfirmOrderId(null)}
                                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Modal clôture */}
                        {closeOrderBatchId === order.batchId && order.status === "PAID" && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" dir="rtl">
                              <div className="flex items-center gap-2 text-slate-800 font-bold">
                                <Lock className="w-5 h-5" />
                                إقفال نهائي للدفعة
                              </div>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                                <AlertTriangle className="inline w-3.5 h-3.5 ml-1" />
                                <strong>تحذير:</strong> هذه العملية لا رجعة فيها. بعد الإقفال، تصبح الدفعة للقراءة فقط ولا يمكن تعديلها.
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                  ملاحظات الإقفال (اختياري)
                                </label>
                                <textarea
                                  value={closeNotes}
                                  onChange={(e) => setCloseNotes(e.target.value)}
                                  rows={2}
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handleCloseBatch(order.batchId)}
                                  disabled={isPending}
                                  className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  {isPending ? "جاري الإقفال..." : "إقفال نهائياً"}
                                </button>
                                <button
                                  onClick={() => setCloseOrderBatchId(null)}
                                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Barre de pagination ─────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                  <div>
                    عرض{" "}
                    <strong className="text-slate-900 font-bold">
                      {(page - 1) * pageSize + 1}
                    </strong>{" "}
                    إلى{" "}
                    <strong className="text-slate-900 font-bold">
                      {Math.min(page * pageSize, filteredOrders.length)}
                    </strong>{" "}
                    من أصل{" "}
                    <strong className="text-slate-900 font-bold">
                      {filteredOrders.length}
                    </strong>{" "}
                    أمر دفع
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="الصفحة السابقة"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                      if (
                        totalPages > 7 &&
                        pg !== 1 &&
                        pg !== totalPages &&
                        Math.abs(pg - page) > 1
                      ) {
                        if (pg === 2 || pg === totalPages - 1) {
                          return <span key={pg} className="px-1 text-slate-400">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setPage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            page === pg
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="الصفحة التالية"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
