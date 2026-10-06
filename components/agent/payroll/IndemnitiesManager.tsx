"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  X,
  Save,
} from "lucide-react";
import { addLineItemAction, deleteLineItemAction } from "@/lib/agent/payroll-actions";

interface EmployeeOption {
  id: string;
  matricule: string;
  fullName: string;
}

interface LineItemData {
  id: string;
  employeeId: string;
  employeeMatricule: string;
  employeeName: string;
  type: string;
  code: string | null;
  labelAr: string;
  amount: number | string;
  notes: string | null;
}

interface IndemnitiesManagerProps {
  batchId: string;
  batchStatus: string;
  employees: EmployeeOption[];
  lineItems: LineItemData[];
}

export function IndemnitiesManager({
  batchId,
  batchStatus,
  employees,
  lineItems,
}: IndemnitiesManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canEdit = ["DRAFT", "RETURNED_FOR_CORRECTION"].includes(batchStatus);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("batchId", batchId);

      const res = await addLineItemAction(formData);
      if (!res.success) {
        setError(res.error || "فشل إضافة البند");
        setLoading(false);
        return;
      }

      setSuccess("تمت إضافة البند بنجاح.");
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(null);
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا البند؟")) return;
    setDeletingId(itemId);

    try {
      const res = await deleteLineItemAction(itemId);
      if (!res.success) {
        alert(res.error || "فشل الحذف");
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setDeletingId(null);
    }
  };

  // Compute totals
  const totalAllowances = lineItems
    .filter((i) => i.type === "ALLOWANCE" || i.type === "BONUS")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalDeductions = lineItems
    .filter((i) => i.type === "DEDUCTION")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">إجمالي المنح والمكافآت الإضافية</span>
          <span className="text-xl font-black font-mono text-emerald-700 mt-2 block">
            +{totalAllowances.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} دج
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">إجمالي الاقتطاعات والخصومات الخاصة</span>
          <span className="text-xl font-black font-mono text-red-700 mt-2 block">
            -{totalDeductions.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} دج
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">عدد البنود المسجلة</span>
            <span className="text-xl font-bold font-mono text-slate-800 mt-2 block">
              {lineItems.length} بند
            </span>
          </div>

          {canEdit && (
            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بند</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">بنود المنح والخصومات المسجلة بالدفعة</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              كل بند يرتبط بموظف محدد ويؤثر في تصفية الأجر الإجمالي أو الصافي
            </p>
          </div>
        </div>

        {lineItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            لا توجد بنود منح أو اقتطاعات مسجلة في هذه الدفعة حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">الموظف</th>
                  <th className="px-5 py-3.5">النوع</th>
                  <th className="px-5 py-3.5">الرمز / التسمية</th>
                  <th className="px-5 py-3.5">المبلغ</th>
                  <th className="px-5 py-3.5">الملاحظات</th>
                  <th className="px-5 py-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{item.employeeName}</div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {item.employeeMatricule}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.type === "DEDUCTION" ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          اقتطاع / خصم
                        </span>
                      ) : item.type === "BONUS" ? (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          مكافأة خاصة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          منحة إضافية
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{item.labelAr}</div>
                      {item.code && (
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded">
                          {item.code}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-xs">
                      {item.type === "DEDUCTION" ? (
                        <span className="text-red-700">
                          -{Number(item.amount).toLocaleString("fr-FR")} دج
                        </span>
                      ) : (
                        <span className="text-emerald-700">
                          +{Number(item.amount).toLocaleString("fr-FR")} دج
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{item.notes || "—"}</td>
                    <td className="px-5 py-3.5 text-center">
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                          title="حذف البند"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Line Item */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">إضافة منحة أو اقتطاع</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الموظف المعني <span className="text-red-500">*</span>
                </label>
                <select
                  name="employeeId"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 text-slate-900 bg-white"
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.matricule} — {e.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">النوع</label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 text-slate-900 bg-white"
                  >
                    <option value="ALLOWANCE">منحة (Allowance)</option>
                    <option value="BONUS">مكافأة (Bonus)</option>
                    <option value="DEDUCTION">اقتطاع / خصم (Deduction)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المبلغ (دج) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    required
                    placeholder="0.00"
                    min="1"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:border-teal-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  التسمية (الوصف) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="labelAr"
                  required
                  placeholder="مثال: منحة المردودية / اقتطاع تسبيق / سلفة"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرمز الكودي (اختياري)
                </label>
                <input
                  type="text"
                  name="code"
                  placeholder="مثال: IND-PERF-01"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:border-teal-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="توضيحات إضافية..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>تسجيل البند</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
