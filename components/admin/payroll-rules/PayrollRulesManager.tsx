"use client";

import { useState, useTransition } from "react";
import {
  createPayrollRuleAction,
  addPayrollRuleVersionAction,
  togglePayrollRuleStatusAction,
} from "@/lib/admin/payroll-rules/actions";
import {
  Scale,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Hash,
} from "lucide-react";

const CATEGORIES: { value: string; labelAr: string }[] = [
  { value: "TAX", labelAr: "ضريبة" },
  { value: "SOCIAL_CONTRIBUTION", labelAr: "اشتراك اجتماعي" },
  { value: "ALLOWANCE", labelAr: "منحة" },
  { value: "BONUS", labelAr: "مكافأة" },
  { value: "BASE_INDEX", labelAr: "رقم استدلالي قاعدي" },
  { value: "OTHER", labelAr: "أخرى" },
];

const UNITS: { value: string; labelAr: string }[] = [
  { value: "PERCENTAGE", labelAr: "نسبة مئوية (%)" },
  { value: "FIXED_AMOUNT", labelAr: "مبلغ ثابت (دج)" },
  { value: "INDEX_POINTS", labelAr: "نقاط استدلالية" },
  { value: "COEFFICIENT", labelAr: "معامل" },
  { value: "FORMULA", labelAr: "صيغة حسابية" },
];

const CATEGORY_COLORS: Record<string, string> = {
  TAX: "bg-red-100 text-red-700 border-red-200",
  SOCIAL_CONTRIBUTION: "bg-blue-100 text-blue-700 border-blue-200",
  ALLOWANCE: "bg-green-100 text-green-700 border-green-200",
  BONUS: "bg-amber-100 text-amber-700 border-amber-200",
  BASE_INDEX: "bg-purple-100 text-purple-700 border-purple-200",
  OTHER: "bg-slate-100 text-slate-700 border-slate-200",
};

interface VersionItem {
  id: string;
  versionNumber: number;
  value: string;
  unit: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
}

interface RuleItem {
  id: string;
  code: string;
  nameAr: string;
  descriptionAr: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  versions: VersionItem[];
}

interface PayrollRulesTableProps {
  rules: RuleItem[];
}

function PayrollRulesTable({ rules }: PayrollRulesTableProps) {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [addVersionRuleId, setAddVersionRuleId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const handleToggleStatus = (ruleId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await togglePayrollRuleStatusAction(ruleId, !currentStatus);
      setFeedback((prev) => ({
        ...prev,
        [ruleId]: {
          ok: res.success,
          msg: res.success
            ? currentStatus
              ? "تم تعطيل القاعدة"
              : "تم تفعيل القاعدة"
            : res.error || "خطأ",
        },
      }));
    });
  };

  const handleAddVersion = async (ruleId: string, form: HTMLFormElement) => {
    const fd = new FormData(form);
    fd.set("ruleId", ruleId);
    const res = await addPayrollRuleVersionAction(fd);
    setFeedback((prev) => ({
      ...prev,
      [`v_${ruleId}`]: {
        ok: res.success,
        msg: res.success ? "تمت إضافة الإصدار الجديد بنجاح" : res.error || "خطأ",
      },
    }));
    if (res.success) {
      form.reset();
      setAddVersionRuleId(null);
    }
  };

  if (rules.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Scale className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">لا توجد قواعد أجور مضافة بعد</p>
        <p className="text-xs mt-1">استخدم نموذج الإضافة أعلاه لإنشاء أولى القواعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => {
        const isExpanded = expandedRuleId === rule.id;
        const isAddingVersion = addVersionRuleId === rule.id;
        const fb = feedback[rule.id];
        const vfb = feedback[`v_${rule.id}`];
        const latestVersion = rule.versions[0];
        const catLabel = CATEGORIES.find((c) => c.value === rule.category)?.labelAr || rule.category;
        const catColor = CATEGORY_COLORS[rule.category] || CATEGORY_COLORS.OTHER;

        return (
          <div
            key={rule.id}
            className={`rounded-2xl border transition-all ${
              rule.isActive ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200 opacity-75"
            }`}
          >
            {/* Rule Header */}
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    rule.isActive ? "bg-teal-100" : "bg-slate-200"
                  }`}
                >
                  <Scale
                    className={`w-4 h-4 ${rule.isActive ? "text-teal-600" : "text-slate-400"}`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm">{rule.nameAr}</span>
                    <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                      {rule.code}
                    </code>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}
                    >
                      {catLabel}
                    </span>
                    {!rule.isActive && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 border border-slate-300">
                        معطّل
                      </span>
                    )}
                  </div>
                  {latestVersion && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      الإصدار {latestVersion.versionNumber} ·{" "}
                      <span className="font-semibold text-slate-700">
                        {latestVersion.value}{" "}
                        {UNITS.find((u) => u.value === latestVersion.unit)?.labelAr}
                      </span>{" "}
                      · منذ{" "}
                      {new Date(latestVersion.effectiveFrom).toLocaleDateString("ar-DZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle status */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(rule.id, rule.isActive)}
                  disabled={isPending}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    rule.isActive
                      ? "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100"
                      : "text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100"
                  } disabled:opacity-50`}
                >
                  {rule.isActive ? "تعطيل" : "تفعيل"}
                </button>
                {/* Expand versions */}
                <button
                  type="button"
                  onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3" />
                  {rule.versions.length} إصدار
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Feedback */}
            {fb && (
              <div
                className={`mx-4 mb-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                  fb.ok
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {fb.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {fb.msg}
              </div>
            )}

            {/* Expanded Version History */}
            {isExpanded && (
              <div className="border-t border-slate-100 px-4 pb-4">
                {rule.descriptionAr && (
                  <p className="text-xs text-slate-500 mt-3 mb-3">{rule.descriptionAr}</p>
                )}

                {/* Versions Timeline */}
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    تاريخ الإصدارات
                  </div>
                  {rule.versions.length === 0 ? (
                    <p className="text-xs text-slate-400">لا توجد إصدارات مسجّلة</p>
                  ) : (
                    rule.versions.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Hash className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-700">
                              الإصدار {v.versionNumber}
                            </span>
                            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {v.value} {UNITS.find((u) => u.value === v.unit)?.labelAr}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            من:{" "}
                            {new Date(v.effectiveFrom).toLocaleDateString("ar-DZ", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {v.effectiveTo && (
                              <>
                                {" "}
                                · إلى:{" "}
                                {new Date(v.effectiveTo).toLocaleDateString("ar-DZ", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </>
                            )}
                          </p>
                          {v.notes && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{v.notes}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Version Button / Form */}
                {!isAddingVersion ? (
                  <button
                    type="button"
                    onClick={() => setAddVersionRuleId(rule.id)}
                    className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة إصدار جديد
                  </button>
                ) : (
                  <form
                    className="mt-4 space-y-3 p-4 bg-blue-50/60 border border-blue-200/60 rounded-2xl"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await handleAddVersion(rule.id, e.currentTarget);
                    }}
                  >
                    <p className="text-xs font-bold text-blue-800">إضافة إصدار جديد</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          القيمة الجديدة *
                        </label>
                        <input
                          name="value"
                          required
                          placeholder="مثال: 0.09 أو 15000"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          الوحدة *
                        </label>
                        <select
                          name="unit"
                          required
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.labelAr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          تاريخ بداية السريان *
                        </label>
                        <input
                          name="effectiveFrom"
                          type="date"
                          required
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          تاريخ نهاية السريان (اختياري)
                        </label>
                        <input
                          name="effectiveTo"
                          type="date"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        ملاحظات (اختياري)
                      </label>
                      <input
                        name="notes"
                        placeholder="مرجع رسمي أو ملاحظة توضيحية"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {vfb && (
                      <div
                        className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                          vfb.ok
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {vfb.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {vfb.msg}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        حفظ الإصدار
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddVersionRuleId(null)}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface CreatePayrollRuleFormProps {
  onCreated?: () => void;
}

function CreatePayrollRuleForm({ onCreated }: CreatePayrollRuleFormProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const res = await createPayrollRuleAction(formData);
      if (res.success) {
        setFeedback({ ok: true, msg: "تمت إضافة القاعدة بنجاح" });
        setIsOpen(false);
        onCreated?.();
      } else {
        setFeedback({ ok: false, msg: res.error || "حدث خطأ" });
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setFeedback(null);
        }}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-600" />
          <span>إضافة قاعدة أجور جديدة</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <form
          action={handleSubmit}
          className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4"
        >
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              هذه الأداة لإنشاء بنية قواعد الأجور القابلة للتهيئة والإصدار. القيم المُدخلة هي
              قيم مرجعية داخلية وليست تصريحاً بمطابقة قانونية.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                رمز القاعدة (Code) *
              </label>
              <input
                name="code"
                required
                placeholder="CNAS_SALARIAL"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
                style={{ textTransform: "uppercase" }}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                أحرف كبيرة وأرقام وشرطة سفلية فقط
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                التصنيف *
              </label>
              <select
                name="category"
                required
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- اختر التصنيف --</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                الاسم بالعربية *
              </label>
              <input
                name="nameAr"
                required
                placeholder="مثال: اشتراك الضمان الاجتماعي – حصة المستخدم"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                الوصف (اختياري)
              </label>
              <input
                name="descriptionAr"
                placeholder="توضيح إضافي للقاعدة وطريقة تطبيقها"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                القيمة المرجعية الأولى *
              </label>
              <input
                name="initialValue"
                required
                placeholder="مثال: 0.09 أو 15000 أو 45"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                الوحدة *
              </label>
              <select
                name="unit"
                required
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- اختر الوحدة --</option>
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                تاريخ سريان المفعول *
              </label>
              <input
                name="effectiveFrom"
                type="date"
                required
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                ملاحظة على الإصدار الأول (اختياري)
              </label>
              <input
                name="notes"
                placeholder="مثال: قرار وزاري رقم ..."
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 ${
                feedback.ok
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {feedback.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {feedback.msg}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              حفظ القاعدة
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFeedback(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export { PayrollRulesTable, CreatePayrollRuleForm };
export type { RuleItem };
