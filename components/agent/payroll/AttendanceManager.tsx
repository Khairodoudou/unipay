"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { saveAttendanceAction } from "@/lib/agent/payroll-actions";

interface EmployeeAttendanceRow {
  employeeId: string;
  matricule: string;
  fullName: string;
  grade: string | null;
  attendance: {
    workingDays: number;
    presentDays: number;
    absentDays: number;
    sickDays: number;
    vacationDays: number;
    lateMinutes: number;
    notes: string | null;
  } | null;
}

interface AttendanceManagerProps {
  batchId: string;
  batchStatus: string;
  rows: EmployeeAttendanceRow[];
}

export function AttendanceManager({
  batchId,
  batchStatus,
  rows,
}: AttendanceManagerProps) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canEdit = ["DRAFT", "RETURNED_FOR_CORRECTION"].includes(batchStatus);

  const handleSaveRow = async (e: React.FormEvent<HTMLFormElement>, employeeId: string) => {
    e.preventDefault();
    if (!canEdit) return;

    setSavingId(employeeId);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("batchId", batchId);
      formData.set("employeeId", employeeId);

      const res = await saveAttendanceAction(formData);
      if (!res.success) {
        setMessage({ type: "error", text: res.error || "فشل حفظ الحضور" });
      } else {
        setMessage({ type: "success", text: "تم حفظ بيانات الحضور بنجاح." });
        router.refresh();
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "حدث خطأ" });
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkInitialize = async () => {
    if (!confirm("هل تريد تعيين الحضور الكامل (30 يوم حضور / 0 غياب) لجميع الموظفين الذين ليس لديهم سجل حضور بعد؟")) {
      return;
    }

    setBulkLoading(true);
    setMessage(null);

    try {
      const unrecorded = rows.filter((r) => !r.attendance);
      let successCount = 0;

      for (const row of unrecorded) {
        const formData = new FormData();
        formData.set("batchId", batchId);
        formData.set("employeeId", row.employeeId);
        formData.set("workingDays", "30");
        formData.set("presentDays", "30");
        formData.set("absentDays", "0");
        formData.set("sickDays", "0");
        formData.set("vacationDays", "0");
        formData.set("lateMinutes", "0");

        const res = await saveAttendanceAction(formData);
        if (res.success) successCount++;
      }

      setMessage({
        type: "success",
        text: `تمت تهيئة سجلات الحضور بنجاح لـ ${successCount} موظف.`,
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "فشلت العملية" });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Bulk action toolbar */}
      {canEdit && rows.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-xs text-slate-600 font-bold">
            الموظفون المسجلون: <span className="font-mono text-teal-800">{rows.filter((r) => r.attendance).length}</span> / {rows.length}
          </span>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={handleBulkInitialize}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
          >
            {bulkLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            )}
            <span>تهيئة الحضور الكامل تلقائياً (30/30) للمتبقين</span>
          </button>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            لا يوجد موظفون في هذه الدفعة لتسجيل الحضور.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">الرقم الوظيفي</th>
                  <th className="px-4 py-3">الموظف</th>
                  <th className="px-3 py-3 text-center">أيام العمل</th>
                  <th className="px-3 py-3 text-center">أيام الحضور</th>
                  <th className="px-3 py-3 text-center">أيام الغياب</th>
                  <th className="px-3 py-3 text-center">عطلة مرضية</th>
                  <th className="px-3 py-3 text-center">عطلة سنوية</th>
                  <th className="px-3 py-3 text-center">تأخير (دقيقة)</th>
                  <th className="px-4 py-3 text-center">حفظ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const att = row.attendance;
                  const isSaving = savingId === row.employeeId;

                  return (
                    <tr key={row.employeeId} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          {row.matricule}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{row.fullName}</div>
                        <div className="text-[11px] text-slate-400">{row.grade || "—"}</div>
                      </td>

                      <td colSpan={7} className="p-0">
                        <form
                          onSubmit={(e) => handleSaveRow(e, row.employeeId)}
                          className="flex items-center"
                        >
                          <div className="w-20 px-2 py-3 text-center">
                            <input
                              type="number"
                              name="workingDays"
                              defaultValue={att ? att.workingDays : 30}
                              min={1}
                              max={31}
                              disabled={!canEdit}
                              className="w-14 px-2 py-1 text-center font-mono font-bold rounded-lg border border-slate-200 focus:border-teal-500 text-slate-900"
                            />
                          </div>

                          <div className="w-20 px-2 py-3 text-center">
                            <input
                              type="number"
                              step="0.5"
                              name="presentDays"
                              defaultValue={att ? att.presentDays : 30}
                              min={0}
                              max={31}
                              disabled={!canEdit}
                              className="w-14 px-2 py-1 text-center font-mono font-bold rounded-lg border border-slate-200 focus:border-teal-500 text-teal-800 bg-teal-50/30"
                            />
                          </div>

                          <div className="w-20 px-2 py-3 text-center">
                            <input
                              type="number"
                              step="0.5"
                              name="absentDays"
                              defaultValue={att ? att.absentDays : 0}
                              min={0}
                              max={31}
                              disabled={!canEdit}
                              className="w-14 px-2 py-1 text-center font-mono font-bold rounded-lg border border-slate-200 focus:border-teal-500 text-red-700 bg-red-50/30"
                            />
                          </div>

                          <div className="w-20 px-2 py-3 text-center">
                            <input
                              type="number"
                              step="0.5"
                              name="sickDays"
                              defaultValue={att ? att.sickDays : 0}
                              min={0}
                              max={31}
                              disabled={!canEdit}
                              className="w-14 px-2 py-1 text-center font-mono rounded-lg border border-slate-200 focus:border-teal-500 text-slate-800"
                            />
                          </div>

                          <div className="w-20 px-2 py-3 text-center">
                            <input
                              type="number"
                              step="0.5"
                              name="vacationDays"
                              defaultValue={att ? att.vacationDays : 0}
                              min={0}
                              max={31}
                              disabled={!canEdit}
                              className="w-14 px-2 py-1 text-center font-mono rounded-lg border border-slate-200 focus:border-teal-500 text-slate-800"
                            />
                          </div>

                          <div className="w-24 px-2 py-3 text-center">
                            <input
                              type="number"
                              name="lateMinutes"
                              defaultValue={att ? att.lateMinutes : 0}
                              min={0}
                              disabled={!canEdit}
                              className="w-16 px-2 py-1 text-center font-mono rounded-lg border border-slate-200 focus:border-teal-500 text-slate-800"
                            />
                          </div>

                          <div className="flex-1 px-4 py-3 text-center">
                            {canEdit && (
                              <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                <span>حفظ</span>
                              </button>
                            )}
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
