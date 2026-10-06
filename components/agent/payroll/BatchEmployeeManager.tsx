"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Search,
  Check,
  X,
} from "lucide-react";
import {
  addEmployeesToBatchAction,
  removeEmployeeFromBatchAction,
} from "@/lib/agent/payroll-actions";

interface AvailableEmployee {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  grade: string | null;
  baseSalary: number | string;
}

interface BatchEmployeeManagerProps {
  batchId: string;
  batchStatus: string;
  availableEmployees: AvailableEmployee[];
}

export function BatchEmployeeManager({
  batchId,
  batchStatus,
  availableEmployees,
}: BatchEmployeeManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canEdit = ["DRAFT", "RETURNED_FOR_CORRECTION"].includes(batchStatus);

  const filteredAvailable = availableEmployees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.matricule.toLowerCase().includes(q) ||
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      (e.grade && e.grade.toLowerCase().includes(q))
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredAvailable.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAvailable.map((e) => e.id));
    }
  };

  const handleAddSelected = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await addEmployeesToBatchAction(batchId, selectedIds);
      if (!res.success) {
        setError(res.error || "فشل إضافة الموظفين");
        setLoading(false);
        return;
      }

      setSuccess(`تمت إضافة ${res.data?.added || selectedIds.length} موظفاً بنجاح.`);
      setTimeout(() => {
        setModalOpen(false);
        setSelectedIds([]);
        setSuccess(null);
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };


  if (!canEdit) {
    return (
      <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs">
        هذه الدفعة ليست في حالة مسودة، لا يمكن تعديل قائمة الموظفين المرتبطين.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setSelectedIds([]);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة موظفين للدفعة ({availableEmployees.length} متاح)</span>
        </button>
      </div>

      {/* Modal: Add Employees */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  إضافة موظفين إلى دفعة الأجر
                </h3>
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

            {/* Search and Select All */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="البحث بالرقم الوظيفي، الاسم، أو الرتبة..."
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={selectAll}
                className="px-3 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer shrink-0"
              >
                {selectedIds.length === filteredAvailable.length && filteredAvailable.length > 0
                  ? "إلغاء تحديد الكل"
                  : `تحديد الكل (${filteredAvailable.length})`}
              </button>
            </div>

            {/* List */}
            <div className="mt-4 flex-1 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-96">
              {filteredAvailable.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  لا يوجد موظفون متاحون للإضافة (جميع الموظفين النشطين مضافون بالفعل).
                </div>
              ) : (
                filteredAvailable.map((emp) => {
                  const isSelected = selectedIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleSelect(emp.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? "bg-teal-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-teal-600 border-teal-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {emp.grade || "الرتبة غير محددة"}
                          </div>
                        </div>
                      </div>

                      <div className="text-left font-mono">
                        <span className="text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {emp.matricule}
                        </span>
                        <div className="text-[11px] text-teal-800 font-bold mt-0.5">
                          {Number(emp.baseSalary).toLocaleString("fr-FR")} دج
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <span className="text-xs text-slate-500 font-bold">
                المحدد: <span className="text-teal-700 font-mono">{selectedIds.length}</span> موظف
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0 || loading}
                  onClick={handleAddSelected}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>إضافة المحددين إلى الدفعة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function RemoveEmployeeButton({
  batchId,
  employeeId,
  name,
}: {
  batchId: string;
  employeeId: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`هل أنت متأكد من إزالة الموظف ${name} من هذه الدفعة؟`)) return;
    setLoading(true);

    try {
      const res = await removeEmployeeFromBatchAction(batchId, employeeId);
      if (!res.success) {
        alert(res.error || "فشل إزالة الموظف");
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
      title="إزالة من الدفعة"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
