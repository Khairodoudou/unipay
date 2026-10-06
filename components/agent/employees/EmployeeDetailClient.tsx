"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit3,
  ShieldAlert,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { updateEmployeeAction, changeEmployeeStatusAction } from "@/lib/agent/employee-actions";

interface OrgUnit {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  baseSalary: { toString: () => string };
  organizationUnitId: string | null;
  grade: string | null;
  position: string | null;
  rib: string | null;
  bankName: string | null;
  [key: string]: unknown;
}

interface EmployeeDetailClientProps {
  employee: Employee;
  units: OrgUnit[];
}

export function EmployeeDetailClient({ employee, units }: EmployeeDetailClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await updateEmployeeAction(employee.id, formData);

      if (!res.success) {
        setError(res.error || "فشل تحديث البيانات");
        setLoading(false);
        return;
      }

      setSuccess("تم تحديث بيانات الموظف بنجاح وتسجيل التغيير في سجل التاريخ.");
      setTimeout(() => {
        setEditOpen(false);
        setSuccess(null);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await changeEmployeeStatusAction(formData);

      if (!res.success) {
        setError(res.error || "فشل تغيير الحالة");
        setLoading(false);
        return;
      }

      setSuccess("تم تغيير حالة الموظف بنجاح.");
      setTimeout(() => {
        setStatusOpen(false);
        setSuccess(null);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setEditOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>تعديل البيانات</span>
        </button>

        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setStatusOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
          <span>تغيير الحالة</span>
        </button>
      </div>

      {/* Modal: Edit Employee */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                تعديل بيانات الموظف: {employee.firstName} {employee.lastName}
              </h3>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الأول</label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={employee.firstName}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اللقب</label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={employee.lastName}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الراتب الأساسي (دج)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="baseSalary"
                    defaultValue={employee.baseSalary.toString()}
                    required
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرتبة (Grade)</label>
                  <input
                    type="text"
                    name="grade"
                    defaultValue={employee.grade || ""}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المنصب (Poste)</label>
                  <input
                    type="text"
                    name="position"
                    defaultValue={employee.position || ""}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المصلحة / الكلية</label>
                  <select
                    name="organizationUnitId"
                    defaultValue={employee.organizationUnitId || ""}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900 bg-white"
                  >
                    <option value="">غير محدد</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الحساب (RIB)</label>
                  <input
                    type="text"
                    name="rib"
                    maxLength={20}
                    defaultValue={employee.rib || ""}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البنك / البريد</label>
                  <input
                    type="text"
                    name="bankName"
                    defaultValue={employee.bankName || ""}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Justification de la modification (obligatoire) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب التعديل (مبرر التغيير للأرشيف وتتبع الأجور) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  required
                  rows={2}
                  placeholder="مثال: ترقية في الدرجة / تعديل المنحة العائلية / تصحيح رقم الحساب البريدي"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
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
                  <span>حفظ التعديلات والتسجيل في التاريخ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Status */}
      {statusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">تغيير حالة الموظف</h3>
              <button
                onClick={() => setStatusOpen(false)}
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

            <form onSubmit={handleStatusChange} className="mt-4 space-y-4">
              <input type="hidden" name="employeeId" value={employee.id} />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحالة الجديدة</label>
                <select
                  name="status"
                  defaultValue={employee.status}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900 bg-white"
                >
                  <option value="ACTIVE">نشط (ACTIVE)</option>
                  <option value="SUSPENDED">معلق (SUSPENDED)</option>
                  <option value="INACTIVE">غير نشط (INACTIVE)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب تغيير الحالة <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  required
                  rows={2}
                  placeholder="مثال: إحالة على التقاعد / إجازة استيداع / إيقاف تحفظي"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-slate-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>تأكيد تغيير الحالة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
