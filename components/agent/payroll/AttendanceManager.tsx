"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Check,
  Search,
  Filter,
  X,
  FileSpreadsheet,
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

interface RowItemProps {
  row: EmployeeAttendanceRow;
  canEdit: boolean;
  isSaving: boolean;
  onSave: (
    employeeId: string,
    values: {
      workingDays: number;
      presentDays: number;
      absentDays: number;
      sickDays: number;
      vacationDays: number;
      lateMinutes: number;
    }
  ) => Promise<void>;
}

function AttendanceRowItem({ row, canEdit, isSaving, onSave }: RowItemProps) {
  const att = row.attendance;

  const [workingDays, setWorkingDays] = useState<number>(att ? att.workingDays : 30);
  const [presentDays, setPresentDays] = useState<number>(att ? att.presentDays : 30);
  const [absentDays, setAbsentDays] = useState<number>(att ? att.absentDays : 0);
  const [sickDays, setSickDays] = useState<number>(att ? att.sickDays : 0);
  const [vacationDays, setVacationDays] = useState<number>(att ? att.vacationDays : 0);
  const [lateMinutes, setLateMinutes] = useState<number>(att ? att.lateMinutes : 0);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Auto-balance present and absent days when absentDays changes
  const handleAbsentChange = (newAbsent: number) => {
    setAbsentDays(newAbsent);
    const calculatedPresent = Math.max(0, workingDays - newAbsent);
    setPresentDays(calculatedPresent);
  };

  const handleWorkingDaysChange = (newWorking: number) => {
    setWorkingDays(newWorking);
    const calculatedPresent = Math.max(0, newWorking - absentDays);
    setPresentDays(calculatedPresent);
  };

  const handleSave = async () => {
    if (!canEdit || isSaving) return;
    await onSave(row.employeeId, {
      workingDays,
      presentDays,
      absentDays,
      sickDays,
      vacationDays,
      lateMinutes,
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      {/* 1. Matricule */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 text-xs">
          {row.matricule}
        </span>
      </td>

      {/* 2. Employee Name & Grade */}
      <td className="px-4 py-3.5 text-right">
        <div className="font-bold text-slate-900 text-xs whitespace-nowrap">
          {row.fullName}
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {row.grade || "—"}
        </div>
      </td>

      {/* 3. Working Days */}
      <td className="px-2 py-3 text-center">
        <input
          type="number"
          min={1}
          max={31}
          disabled={!canEdit}
          value={workingDays}
          onChange={(e) => handleWorkingDaysChange(parseFloat(e.target.value) || 0)}
          className="w-16 h-8 text-center font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 bg-white disabled:bg-slate-50 text-xs transition-all mx-auto"
        />
      </td>

      {/* 4. Present Days */}
      <td className="px-2 py-3 text-center">
        <input
          type="number"
          step="0.5"
          min={0}
          max={31}
          disabled={!canEdit}
          value={presentDays}
          onChange={(e) => setPresentDays(parseFloat(e.target.value) || 0)}
          className="w-16 h-8 text-center font-mono font-bold rounded-lg border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-emerald-800 bg-emerald-50/40 disabled:bg-slate-50 text-xs transition-all mx-auto"
        />
      </td>

      {/* 5. Absent Days */}
      <td className="px-2 py-3 text-center">
        <input
          type="number"
          step="0.5"
          min={0}
          max={31}
          disabled={!canEdit}
          value={absentDays}
          onChange={(e) => handleAbsentChange(parseFloat(e.target.value) || 0)}
          className="w-16 h-8 text-center font-mono font-bold rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-rose-800 bg-rose-50/40 disabled:bg-slate-50 text-xs transition-all mx-auto"
        />
      </td>

      {/* 6. Sick Days */}
      <td className="px-2 py-3 text-center">
        <input
          type="number"
          step="0.5"
          min={0}
          max={31}
          disabled={!canEdit}
          value={sickDays}
          onChange={(e) => setSickDays(parseFloat(e.target.value) || 0)}
          className="w-16 h-8 text-center font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 bg-white disabled:bg-slate-50 text-xs transition-all mx-auto"
        />
      </td>

      {/* 7. Vacation Days */}
      <td className="px-2 py-3 text-center">
        <input
          type="number"
          step="0.5"
          min={0}
          max={31}
          disabled={!canEdit}
          value={vacationDays}
          onChange={(e) => setVacationDays(parseFloat(e.target.value) || 0)}
          className="w-16 h-8 text-center font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 bg-white disabled:bg-slate-50 text-xs transition-all mx-auto"
        />
      </td>

      {/* 8. Late Minutes */}
      <td className="px-2 py-3 text-center">
        <input
          type="number"
          min={0}
          disabled={!canEdit}
          value={lateMinutes}
          onChange={(e) => setLateMinutes(parseInt(e.target.value, 10) || 0)}
          className="w-16 h-8 text-center font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 bg-white disabled:bg-slate-50 text-xs transition-all mx-auto"
        />
      </td>

      {/* 9. Save Action Button */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        {canEdit ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              justSaved
                ? "bg-emerald-600 text-white"
                : "bg-teal-600 hover:bg-teal-500 text-white"
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : justSaved ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{justSaved ? "تم الحفظ" : "حفظ"}</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium">
            للقراءة فقط
          </span>
        )}
      </td>
    </tr>
  );
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const canEdit = ["DRAFT", "RETURNED_FOR_CORRECTION"].includes(batchStatus);

  // Filtered rows
  const filteredRows = rows.filter((row) => {
    // Text search (matricule, full name, grade)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchMatricule = row.matricule.toLowerCase().includes(q);
      const matchName = row.fullName.toLowerCase().includes(q);
      const matchGrade = (row.grade || "").toLowerCase().includes(q);
      if (!matchMatricule && !matchName && !matchGrade) return false;
    }

    // Status filter
    if (filterStatus === "RECORDED") {
      return row.attendance !== null;
    }
    if (filterStatus === "UNRECORDED") {
      return row.attendance === null;
    }
    if (filterStatus === "ABSENT") {
      return row.attendance !== null && row.attendance.absentDays > 0;
    }
    if (filterStatus === "LATE") {
      return row.attendance !== null && row.attendance.lateMinutes > 0;
    }

    return true;
  });

  const hasActiveFilters = Boolean(searchQuery.trim() || filterStatus !== "ALL");

  const handleSaveRow = async (
    employeeId: string,
    values: {
      workingDays: number;
      presentDays: number;
      absentDays: number;
      sickDays: number;
      vacationDays: number;
      lateMinutes: number;
    }
  ) => {
    if (!canEdit) return;

    setSavingId(employeeId);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("batchId", batchId);
      formData.set("employeeId", employeeId);
      formData.set("workingDays", String(values.workingDays));
      formData.set("presentDays", String(values.presentDays));
      formData.set("absentDays", String(values.absentDays));
      formData.set("sickDays", String(values.sickDays));
      formData.set("vacationDays", String(values.vacationDays));
      formData.set("lateMinutes", String(values.lateMinutes));

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
    if (
      !confirm(
        "هل تريد تعيين الحضور الكامل (30 يوم حضور / 0 غياب) لجميع الموظفين الذين ليس لديهم سجل حضور بعد؟"
      )
    ) {
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
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "فشلت العملية",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // Export to Excel format (.xls with UTF-8 BOM and RTL sheet configuration)
  const handleExportExcel = () => {
    const dataToExport = filteredRows.length > 0 ? filteredRows : rows;
    const exportDate = new Date().toLocaleDateString("fr-FR");
    const fileName = `presences_lot_${batchId.slice(-8)}_${new Date().toISOString().slice(0, 10)}.xls`;

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>الحضور والغيابات</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; direction: rtl; font-family: Arial, sans-serif; }
          th { background-color: #0f766e; color: #ffffff; border: 1px solid #cbd5e1; padding: 10px 8px; font-weight: bold; font-size: 12px; }
          td { border: 1px solid #e2e8f0; padding: 8px 6px; font-size: 11px; text-align: center; }
          td.text-right { text-align: right; }
          .bg-green { background-color: #ecfdf5; color: #065f46; font-weight: bold; }
          .bg-red { background-color: #fff1f2; color: #9f1239; font-weight: bold; }
          .header-title { font-size: 15px; font-weight: bold; text-align: center; color: #0f766e; padding: 12px; background-color: #f0fdfa; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="9" class="header-title">
              سجل الحضور والغيابات — مساحة الموارد البشرية أكاديميا شفاف — تاريخ التصدير: ${exportDate} (العدد: ${dataToExport.length} موظف)
            </td>
          </tr>
          <thead>
            <tr>
              <th>الرقم الوظيفي</th>
              <th>اسم الموظف</th>
              <th>الرتبة / المنصب</th>
              <th>أيام العمل</th>
              <th>أيام الحضور</th>
              <th>أيام الغياب</th>
              <th>عطلة مرضية</th>
              <th>عطلة سنوية</th>
              <th>تأخير (دقيقة)</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport
              .map((r) => {
                const att = r.attendance;
                const working = att ? att.workingDays : 30;
                const present = att ? att.presentDays : 30;
                const absent = att ? att.absentDays : 0;
                const sick = att ? att.sickDays : 0;
                const vacation = att ? att.vacationDays : 0;
                const late = att ? att.lateMinutes : 0;

                return `
                  <tr>
                    <td class="text-right" style="mso-number-format:'\\@';">${r.matricule}</td>
                    <td class="text-right">${r.fullName}</td>
                    <td class="text-right">${r.grade || "—"}</td>
                    <td>${working}</td>
                    <td class="bg-green">${present}</td>
                    <td class="${absent > 0 ? "bg-red" : ""}">${absent}</td>
                    <td>${sick}</td>
                    <td>${vacation}</td>
                    <td>${late}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage({
      type: "success",
      text: `تم تحميل ملف Excel بنجاح (${dataToExport.length} موظف).`,
    });
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-xs text-slate-600 font-bold">
            الموظفون المسجلون:{" "}
            <span className="font-mono text-teal-800">
              {rows.filter((r) => r.attendance).length}
            </span>{" "}
            / {rows.length}
          </span>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={handleBulkInitialize}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer self-start sm:self-auto"
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

      {/* Search, Filter & Excel Export Toolbar */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Right: Search Input + Status Dropdown Filter */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search by Matricule or Name */}
              <div className="relative min-w-[220px] sm:min-w-[270px] flex-1 sm:flex-none">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم، اللقب أو الرقم الوظيفي..."
                  className="w-full pr-9 pl-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 transition-all placeholder:text-slate-400 bg-slate-50/60 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all"
                >
                  <option value="ALL">جميع الموظفين ({rows.length})</option>
                  <option value="RECORDED">
                    المسجلون فقط ({rows.filter((r) => r.attendance).length})
                  </option>
                  <option value="UNRECORDED">
                    غير المسجلين ({rows.filter((r) => !r.attendance).length})
                  </option>
                  <option value="ABSENT">
                    الذين لديهم غياب ({rows.filter((r) => r.attendance && r.attendance.absentDays > 0).length})
                  </option>
                  <option value="LATE">
                    الذين لديهم تأخير ({rows.filter((r) => r.attendance && r.attendance.lateMinutes > 0).length})
                  </option>
                </select>
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("ALL");
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء التصفية</span>
                </button>
              )}
            </div>

            {/* Left: Row Counter + Export to Excel Button */}
            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 whitespace-nowrap">
                عرض {filteredRows.length} من {rows.length}
              </span>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تحميل Excel (.xls)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            لا يوجد موظفون في هذه الدفعة لتسجيل الحضور.
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">
              لم يتم العثور على أي موظف يطابق معايير البحث أو التصفية
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("ALL");
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors cursor-pointer"
            >
              <span>إعادة تعيين البحث والتصفية</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[140px]">
                    الرقم الوظيفي
                  </th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[160px]">
                    الموظف
                  </th>
                  <th className="px-2 py-3.5 text-center whitespace-nowrap min-w-[80px]">
                    أيام العمل
                  </th>
                  <th className="px-2 py-3.5 text-center whitespace-nowrap min-w-[80px]">
                    أيام الحضور
                  </th>
                  <th className="px-2 py-3.5 text-center whitespace-nowrap min-w-[80px]">
                    أيام الغياب
                  </th>
                  <th className="px-2 py-3.5 text-center whitespace-nowrap min-w-[80px]">
                    عطلة مرضية
                  </th>
                  <th className="px-2 py-3.5 text-center whitespace-nowrap min-w-[80px]">
                    عطلة سنوية
                  </th>
                  <th className="px-2 py-3.5 text-center whitespace-nowrap min-w-[90px]">
                    تأخير (دقيقة)
                  </th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap min-w-[90px]">
                    الإجراء
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <AttendanceRowItem
                    key={row.employeeId}
                    row={row}
                    canEdit={canEdit}
                    isSaving={savingId === row.employeeId}
                    onSave={handleSaveRow}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
