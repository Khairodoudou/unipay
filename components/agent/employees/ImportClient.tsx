"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Database,
  Loader2,
  Check,
} from "lucide-react";
import { importEmployeesAction, ImportEmployeeRow } from "@/lib/agent/employee-actions";

interface ImportClientProps {
  organizationId: string;
}

interface ParsedRowWithStatus extends ImportEmployeeRow {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

export function ImportClient({ organizationId }: ImportClientProps) {
  const [rows, setRows] = useState<ParsedRowWithStatus[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ row: number; matricule: string; error: string }[]>([]);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  // Template download for user convenience
  const handleDownloadTemplate = () => {
    const csvContent =
      "matricule,firstName,lastName,grade,position,category,baseSalary,rib,bankName\n" +
      "EMP-2026-001,محمد,بلقاسم,أستاذ محاضر أ,رئيس قسم,PERMANENT,85000,00799999000123456789,بريد الجزائر\n" +
      "EMP-2026-002,فاطمة,الزهراء,مهندس دولة,مسؤول شبكات,PERMANENT,62000,00799999000987654321,BADR\n" +
      "EMP-2026-003,كريم,عمران,متصرف إداري,عون إدارة,CONTRACTUEL,48000,00799999000555666777,BNA";

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "unipay_employees_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV / TSV text
  const parseCSV = (content: string) => {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      alert("الملف فارغ أو لا يحتوي على أسطر كافية.");
      return;
    }

    // Detect delimiter: comma, semicolon, or tab
    const firstLine = lines[0];
    let delimiter = ",";
    if (firstLine.includes(";")) delimiter = ";";
    else if (firstLine.includes("\t")) delimiter = "\t";

    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

    const parsed: ParsedRowWithStatus[] = [];
    const seenMatricules = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = line.split(delimiter).map((v) => v.trim().replace(/^['"]|['"]$/g, ""));
      const getVal = (col: string) => {
        const idx = headers.findIndex((h) => h === col.toLowerCase());
        return idx !== -1 ? values[idx] || "" : "";
      };

      const matricule = (getVal("matricule") || values[0] || "").toUpperCase();
      const firstName = getVal("firstname") || getVal("nom") || values[1] || "";
      const lastName = getVal("lastname") || getVal("prenom") || values[2] || "";
      const grade = getVal("grade") || values[3] || "";
      const position = getVal("position") || values[4] || "";
      const category = (getVal("category") || values[5] || "PERMANENT") as ImportEmployeeRow["category"];
      const baseSalary = getVal("basesalary") || getVal("salaire") || values[6] || "0";
      const rib = getVal("rib") || values[7] || "";
      const bankName = getVal("bankname") || getVal("banque") || values[8] || "";

      const errors: string[] = [];
      if (!matricule) errors.push("الرقم الوظيفي مفقود");
      if (seenMatricules.has(matricule)) errors.push(`الرقم الوظيفي مكرر في الملف: ${matricule}`);
      seenMatricules.add(matricule);

      if (!firstName || !lastName) errors.push("الاسم واللقب إلزاميان");

      const salaryNum = parseFloat(baseSalary);
      if (isNaN(salaryNum) || salaryNum <= 0) errors.push("الراتب الأساسي غير صحيح أو صفر");

      parsed.push({
        rowNumber: i,
        matricule,
        firstName,
        lastName,
        grade,
        position,
        category,
        baseSalary,
        rib,
        bankName,
        isValid: errors.length === 0,
        errors,
      });
    }

    setRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setServerErrors([]);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCSV(content);
      setLoading(false);
    };
    reader.onerror = () => {
      alert("تعذر قراءة الملف.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (rows.length === 0 || rows.some((r) => !r.isValid)) return;

    setImporting(true);
    setServerErrors([]);

    try {
      const cleanRows: ImportEmployeeRow[] = rows.map((r) => ({
        matricule: r.matricule,
        firstName: r.firstName,
        lastName: r.lastName,
        grade: r.grade,
        position: r.position,
        category: r.category,
        baseSalary: r.baseSalary,
        rib: r.rib,
        bankName: r.bankName,
      }));

      const res = await importEmployeesAction(cleanRows, organizationId);

      if (!res.success) {
        setServerErrors(res.errors || [{ row: 0, matricule: "-", error: "فشل استيراد الموظفين" }]);
      } else {
        setImportSuccess(res.imported);
      }
    } catch (err: unknown) {
      setServerErrors([{ row: 0, matricule: "-", error: err instanceof Error ? err.message : "حدث خطأ غير متوقع" }]);
    } finally {
      setImporting(false);
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Step 1: File selector card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">1. تحديد الملف للرفع والمعاينة</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              يدعم ملفات CSV و Excel (بترميز UTF-8). لن يتم إدراج أي سجل قبل المراجعة والتحقق الشامل.
            </p>
          </div>

          <button
            onClick={handleDownloadTemplate}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل نموذج الاستيراد (Template)</span>
          </button>
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50">
          <input
            type="file"
            id="fileInput"
            accept=".csv,.txt,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer block space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 hover:text-teal-700">
                {loading ? "جارٍ تحليل الملف..." : fileName ? fileName : "انقر لاختيار الملف من جهازك أو اسحبه هنا"}
              </span>
              <p className="text-xs text-slate-400 mt-1">صيغة الملف المدعومة: CSV (Comma/Semicolon separated)</p>
            </div>
          </label>
        </div>
      </div>

      {/* Success banner if imported */}
      {importSuccess !== null && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">تم إتمام عملية الاستيراد بنجاح!</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                تم إدراج <strong className="font-mono">{importSuccess}</strong> موظفاً في قاعدة البيانات عبر معالمة موحدة مع تسجيل وتتبع العملية في سجل التدقيق.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/agent/employees"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>الانتقال لسجل الموظفين</span>
            </Link>
          </div>
        </div>
      )}

      {/* Server Errors Report */}
      {serverErrors.length > 0 && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-sm text-red-800">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>تعذر إتمام الاستيراد — تقرير الأخطاء وقواعد التحقق المرفوضة:</span>
          </div>
          <ul className="divide-y divide-red-200/60 text-xs">
            {serverErrors.map((err, idx) => (
              <li key={idx} className="py-2 flex items-center justify-between">
                <span>
                  السطر <strong className="font-mono">{err.row}</strong>: {err.error}
                </span>
                {err.matricule && (
                  <span className="font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded text-[11px]">
                    {err.matricule}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 2: Preview & Validation Table */}
      {rows.length > 0 && importSuccess === null && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">2. المعاينة والتحقق قبل الإدراج (Preview)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إجمالي الأسطر: <strong className="font-mono">{rows.length}</strong> | صالح للإدراج:{" "}
                <span className="text-emerald-600 font-bold font-mono">{validCount}</span> | يحتاج تصحيح:{" "}
                <span className="text-red-600 font-bold font-mono">{invalidCount}</span>
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={invalidCount > 0 || importing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإدراج الذري (Transaction)...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>تأكيد الإدراج في قاعدة البيانات ({validCount})</span>
                </>
              )}
            </button>
          </div>

          {invalidCount > 0 && (
            <div className="mx-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                يحتوي الملف على أخطاء في بعض الأسطر. يجب تصحيح الملف وإعادة رفعه لضمان سلامة قاعدة البيانات.
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">السطر</th>
                  <th className="px-4 py-3">الرقم الوظيفي</th>
                  <th className="px-4 py-3">الاسم واللقب</th>
                  <th className="px-4 py-3">الرتبة</th>
                  <th className="px-4 py-3">الراتب الأساسي</th>
                  <th className="px-4 py-3">رقم الحساب (RIB)</th>
                  <th className="px-4 py-3">حالة التحقق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 50).map((r, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/50 ${!r.isValid ? "bg-red-50/40" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">{r.rowNumber}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.matricule || "—"}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.grade || "—"}</td>
                    <td className="px-4 py-3 font-mono text-teal-800 font-bold">
                      {parseFloat(r.baseSalary || "0").toLocaleString("fr-FR")} دج
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{r.rib || "—"}</td>
                    <td className="px-4 py-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          صالح
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          {r.errors.map((err, eIdx) => (
                            <span
                              key={eIdx}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full mr-1"
                            >
                              <XCircle className="w-2.5 h-2.5" />
                              {err}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 && (
            <p className="p-4 text-center text-xs text-slate-400">
              يتم عرض أول 50 سطراً من إجمالي {rows.length} سطراً.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
