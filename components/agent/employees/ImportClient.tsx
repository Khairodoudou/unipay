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
  FileSpreadsheet,
  Search,
  Filter,
  X,
  FileText,
  Trash2,
  RefreshCw,
  Users,
  DollarSign,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { readSheet } from "read-excel-file/browser";
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
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ row: number; matricule: string; error: string }[]>([]);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Search & Filter State for Preview Table
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValidity, setFilterValidity] = useState<"ALL" | "VALID" | "INVALID">("ALL");

  // ── Download Template in Official Excel (.xls) Format ──────────────────────
  const handleDownloadExcelTemplate = () => {
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>نموذج استيراد الموظفين</x:Name>
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
          td { border: 1px solid #e2e8f0; padding: 8px 6px; font-size: 11px; text-align: right; }
          .center { text-align: center; }
          .num { text-align: center; mso-number-format:'\\@'; }
          .header-banner { background-color: #f0fdfa; color: #0f766e; font-size: 14px; font-weight: bold; padding: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="15" class="header-banner">
              نموذج استيراد الموظفين الرسمي — مساحة الموارد البشرية UNI-PAY (الحقول الإلزامية: الرقم الوظيفي، الاسم، اللقب، الراتب الأساسي)
            </td>
          </tr>
          <thead>
            <tr>
              <th>الرقم الوظيفي (matricule)*</th>
              <th>الاسم (firstName)*</th>
              <th>اللقب (lastName)*</th>
              <th>رقم التعريف الوطني (nationalId)</th>
              <th>تاريخ الميلاد (dateOfBirth)</th>
              <th>الجنس (gender M/F)</th>
              <th>الرتبة (grade)</th>
              <th>المنصب (position)</th>
              <th>طبيعة العقد (category)</th>
              <th>الراتب الأساسي (baseSalary)*</th>
              <th>الرقم الاستدلالي (index)</th>
              <th>رقم الحساب البنكي (rib)</th>
              <th>اسم البنك (bankName)</th>
              <th>البريد الإلكتروني (email)</th>
              <th>رقم الهاتف (phone)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="num">EMP-UBMA-001</td>
              <td>ياسين</td>
              <td>بن علي</td>
              <td class="num">101978000123456789</td>
              <td class="center">1978-04-15</td>
              <td class="center">M</td>
              <td>أستاذ التعليم العالي (PES)</td>
              <td>أستاذ باحث</td>
              <td class="center">PERMANENT</td>
              <td class="center">125000</td>
              <td class="center">920</td>
              <td class="num">00799999000123456789</td>
              <td>بريد الجزائر</td>
              <td>yassine.benali@univ-annaba.dz</td>
              <td class="num">0661123456</td>
            </tr>
            <tr>
              <td class="num">EMP-UBMA-002</td>
              <td>فاطمة الزهراء</td>
              <td>براهيمي</td>
              <td class="num">201984000987654321</td>
              <td class="center">1984-11-20</td>
              <td class="center">F</td>
              <td>أستاذ محاضر أ (MC-A)</td>
              <td>رئيسة قسم</td>
              <td class="center">PERMANENT</td>
              <td class="center">98000</td>
              <td class="center">840</td>
              <td class="num">00100123456789012345</td>
              <td>BNA - البنك الوطني الجزائري</td>
              <td>fz.brahimi@univ-annaba.dz</td>
              <td class="num">0550987654</td>
            </tr>
            <tr>
              <td class="num">EMP-UBMA-003</td>
              <td>أمين</td>
              <td>بلمهيدي</td>
              <td class="num">101991000555666777</td>
              <td class="center">1991-03-08</td>
              <td class="center">M</td>
              <td>مهندس رئيسي في الإعلام الآلي</td>
              <td>مسؤول الشبكات والأنظمة</td>
              <td class="center">PERMANENT</td>
              <td class="center">72000</td>
              <td class="center">640</td>
              <td class="num">00200555666777888999</td>
              <td>BEA - بنك الجزائر الخارجي</td>
              <td>amine.belmehidi@univ-annaba.dz</td>
              <td class="num">0770554433</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + tableHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele_import_employes_unipay.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("تم تحميل نموذج Excel بنجاح", {
      description: "يمكنك فتح النموذج مباشرة في Microsoft Excel وتعديل البيانات وحفظه كـ Excel (.xlsx / .xls) أو CSV.",
      duration: 4500,
    });
  };

  // ── Download Template in CSV Format ───────────────────────────────────────
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      "matricule,firstName,lastName,nationalId,dateOfBirth,gender,grade,position,category,baseSalary,index,rib,bankName,email,phone\n" +
      "EMP-UBMA-001,ياسين,بن علي,101978000123456789,1978-04-15,M,أستاذ التعليم العالي (PES),أستاذ باحث,PERMANENT,125000,920,00799999000123456789,بريد الجزائر,yassine.benali@univ-annaba.dz,0661123456\n" +
      "EMP-UBMA-002,فاطمة الزهراء,براهيمي,201984000987654321,1984-11-20,F,أستاذ محاضر أ (MC-A),رئيسة قسم,PERMANENT,98000,840,00100123456789012345,BNA - البنك الوطني الجزائري,fz.brahimi@univ-annaba.dz,0550987654\n" +
      "EMP-UBMA-003,أمين,بلمهيدي,101991000555666777,1991-03-08,M,مهندس رئيسي في الإعلام الآلي,مسؤول الشبكات والأنظمة,PERMANENT,72000,640,00200555666777888999,BEA - بنك الجزائر الخارجي,amine.belmehidi@univ-annaba.dz,0770554433";

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele_import_employes_unipay.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("تم تحميل نموذج CSV بنجاح");
  };

  // ── Normalize Values (Currency, Category, Gender, etc.) ───────────────────
  const cleanCurrency = (raw: string): number => {
    if (!raw) return 0;
    // Remove spaces, non-breaking spaces, DZD, DA, and replace comma with dot
    const clean = raw
      .replace(/[\s\u00A0\u202F]/g, "")
      .replace(/dzd|da|دج/gi, "")
      .replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const normalizeCategory = (cat?: string): ImportEmployeeRow["category"] => {
    if (!cat) return "PERMANENT";
    const c = cat.trim().toLowerCase();
    if (c.includes("contract") || c.includes("عقد") || c.includes("تعاقد")) return "CONTRACTUEL";
    if (c.includes("vacat") || c.includes("مؤقت") || c.includes("ساعات")) return "VACATAIRE";
    return "PERMANENT";
  };

  const normalizeGender = (g?: string): string | undefined => {
    if (!g) return undefined;
    const v = g.trim().toLowerCase();
    if (v.startsWith("m") || v.includes("ذكر") || v.includes("homme")) return "M";
    if (v.startsWith("f") || v.includes("أنثى") || v.includes("انثى") || v.includes("femme")) return "F";
    return undefined;
  };

  // ── Universal Matrix Processor (handles raw 2D array of rows) ───────────────
  const processRawRows = (matrix: string[][]) => {
    if (matrix.length < 2) {
      toast.error("الملف لا يحتوي على أسطر بيانات كافية.");
      return;
    }

    // Locate header row: row containing at least 2 common keywords
    let headerRowIndex = 0;
    const keywords = [
      "matricule",
      "prenom",
      "nom",
      "firstname",
      "lastname",
      "الاسم",
      "اللقب",
      "الرقم",
      "salaire",
      "basesalary",
      "الراتب",
      "grade",
      "rib",
    ];

    for (let i = 0; i < Math.min(matrix.length, 5); i++) {
      const rowText = matrix[i].map((c) => (c || "").toLowerCase()).join(" ");
      let matchCount = 0;
      for (const kw of keywords) {
        if (rowText.includes(kw)) matchCount++;
      }
      if (matchCount >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = matrix[headerRowIndex].map((h) => (h || "").trim().toLowerCase());

    const parsed: ParsedRowWithStatus[] = [];
    const seenMatricules = new Set<string>();

    for (let i = headerRowIndex + 1; i < matrix.length; i++) {
      const cells = matrix[i].map((c) => (c || "").trim());
      // Skip completely empty rows
      if (cells.length === 0 || cells.every((c) => c === "")) continue;

      const getVal = (...names: string[]) => {
        for (const n of names) {
          const idx = headers.findIndex((h) => h.includes(n.toLowerCase()));
          if (idx !== -1 && cells[idx] !== undefined) return cells[idx];
        }
        return "";
      };

      const matricule = (
        getVal("matricule", "رقم_التوظيف", "الرقم الوظيفي", "رقم_الوظيفة", "رقم_المستخدم", "code") ||
        cells[0] ||
        ""
      ).toUpperCase();

      const firstName = getVal("firstname", "prenom", "الاسم", "الاسم_الأول", "الاسم_الاول") || cells[1] || "";
      const lastName = getVal("lastname", "nom", "اللقب", "اسم_العائلة") || cells[2] || "";
      const nationalId = getVal("nationalid", "nin", "cin", "التعريف الوطني", "رقم_الهوية", "الهوية") || cells[3] || "";
      const dateOfBirth = getVal("dateofbirth", "naissance", "الميلاد", "تاريخ_الميلاد") || cells[4] || "";
      const rawGender = getVal("gender", "sexe", "الجنس") || cells[5] || "";
      const grade = getVal("grade", "الرتبة", "الدرجة") || cells[6] || "";
      const position = getVal("position", "poste", "المنصب", "الوظيفة") || cells[7] || "";
      const rawCategory = getVal("category", "categorie", "طبيعة_العقد", "العقد", "الصنف") || cells[8] || "";
      const rawBaseSalary = getVal("basesalary", "salaire", "الراتب_الاساسي", "الراتب_الأساسي", "الراتب", "الأجر") || cells[9] || "0";
      const index = getVal("index", "indice", "الاستدلالي", "الرقم_الاستدلالي") || cells[10] || "";
      const rib = getVal("rib", "compte", "ccp", "الحساب", "رقم_الحساب") || cells[11] || "";
      const bankName = getVal("bankname", "banque", "البنك", "المؤسسة_المالية") || cells[12] || "";
      const email = getVal("email", "mail", "البريد", "البريد_الالكتروني") || cells[13] || "";
      const phone = getVal("phone", "tel", "الهاتف", "رقم_الهاتف") || cells[14] || "";

      const errors: string[] = [];
      if (!matricule) {
        errors.push("الرقم الوظيفي مفقود");
      } else if (seenMatricules.has(matricule)) {
        errors.push(`الرقم الوظيفي مكرر في الملف: ${matricule}`);
      } else {
        seenMatricules.add(matricule);
      }

      if (!firstName || !lastName) {
        errors.push("الاسم واللقب إلزاميان");
      }

      const salaryNum = cleanCurrency(rawBaseSalary);
      if (salaryNum <= 0) {
        errors.push("الراتب الأساسي غير صحيح أو صفر");
      }

      parsed.push({
        rowNumber: parsed.length + 1,
        matricule,
        firstName,
        lastName,
        nationalId: nationalId || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: normalizeGender(rawGender),
        grade,
        position,
        category: normalizeCategory(rawCategory),
        baseSalary: salaryNum > 0 ? String(salaryNum) : rawBaseSalary,
        index: index || undefined,
        rib,
        bankName,
        email: email || undefined,
        phone: phone || undefined,
        isValid: errors.length === 0,
        errors,
      });
    }

    setRows(parsed);
    const validTotal = parsed.filter((r) => r.isValid).length;
    const invalidTotal = parsed.length - validTotal;

    if (invalidTotal === 0) {
      toast.success(`تم قراءة ${parsed.length} سجلاً بنجاح! جميعها صالحة للإدراج.`, {
        description: "اضغط على تأكيد الإدراج لحفظ الموظفين في قاعدة البيانات.",
      });
    } else {
      toast.warning(`تم قراءة ${parsed.length} سجلاً: ${validTotal} صالح و ${invalidTotal} يحتوي على أخطاء.`, {
        description: "يمكنك تصفية الأخطاء، حذف الأسطر الخاطئة بنقرة واحدة، أو استيراد السجلات الصالحة فقط.",
        duration: 6000,
      });
    }
  };

  // ── Parse HTML Table (for .xls files or Excel HTML) ────────────────────────
  const parseHtmlTable = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const trs = Array.from(doc.querySelectorAll("table tr"));
    if (trs.length < 2) {
      toast.error("ملف Excel فارغ أو لا يحتوي على أسطر كافية.");
      return;
    }

    const matrix: string[][] = [];
    for (const tr of trs) {
      const cells = Array.from(tr.querySelectorAll("th, td")).map((c) => (c.textContent || "").trim());
      if (cells.length > 0) {
        matrix.push(cells);
      }
    }

    processRawRows(matrix);
  };

  // ── Parse CSV / TSV with Quote Support ─────────────────────────────────────
  const parseCsvText = (csvContent: string) => {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      toast.error("ملف CSV فارغ أو لا يحتوي على أسطر كافية.");
      return;
    }

    let delimiter = ",";
    const firstLine = lines[0];
    if (firstLine.includes(";")) delimiter = ";";
    else if (firstLine.includes("\t")) delimiter = "\t";

    const matrix: string[][] = [];
    for (const line of lines) {
      // Split with quotes handling
      const row: string[] = [];
      let inQuotes = false;
      let current = "";
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          row.push(current.trim().replace(/^['"]|['"]$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      row.push(current.trim().replace(/^['"]|['"]$/g, ""));
      matrix.push(row);
    }

    processRawRows(matrix);
  };

  // ── Master File Processor (.xlsx, .xls, .csv, .tsv) ────────────────────────
  const processFile = async (file: File) => {
    setFileName(file.name);
    setFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`
    );
    setLoading(true);
    setServerErrors([]);
    setImportSuccess(null);
    setSearchQuery("");
    setFilterValidity("ALL");

    try {
      // 1. If it's a modern Excel file (.xlsx)
      if (
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        const rawRows = await readSheet(file);
        const matrix: string[][] = (rawRows as unknown[][]).map((row) =>
          row.map((cell) => {
            if (cell === null || cell === undefined) return "";
            if (cell instanceof Date) return cell.toISOString().slice(0, 10);
            return String(cell).trim();
          })
        );
        processRawRows(matrix);
        setLoading(false);
        return;
      }

      // 2. If it's .xls or text/csv, read as text
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (content.includes("<table") && content.includes("<tr")) {
            parseHtmlTable(content);
          } else {
            parseCsvText(content);
          }
        } catch (err: unknown) {
          toast.error("تعذر تحليل محتوى الملف: " + (err instanceof Error ? err.message : "خطأ تنسيق"));
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        toast.error("حدث خطأ أثناء قراءة الملف من الجهاز");
        setLoading(false);
      };
      reader.readAsText(file);
    } catch (err: unknown) {
      toast.error("فشل معالجة ملف Excel: " + (err instanceof Error ? err.message : "خطأ غير متوقع"));
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Discard Single Row ────────────────────────────────────────────────────
  const handleRemoveRow = (rowNumber: number) => {
    setRows((prev) => {
      const updated = prev.filter((r) => r.rowNumber !== rowNumber);
      // Re-index remaining rows
      return updated.map((r, idx) => ({ ...r, rowNumber: idx + 1 }));
    });
    toast.info("تم استبعاد السطر من قائمة الاستيراد");
  };

  // ── Purge All Invalid Rows ────────────────────────────────────────────────
  const handlePurgeInvalidRows = () => {
    const invalidCount = rows.filter((r) => !r.isValid).length;
    if (invalidCount === 0) return;

    setRows((prev) => {
      const valids = prev.filter((r) => r.isValid);
      return valids.map((r, idx) => ({ ...r, rowNumber: idx + 1 }));
    });
    setFilterValidity("ALL");
    toast.success(`تم حذف ${invalidCount} سطراً يحتوي على أخطاء بنجاح. أصبحت القائمة جاهزة للإدراج.`);
  };

  // ── Reset Entire State ────────────────────────────────────────────────────
  const handleReset = () => {
    setRows([]);
    setFileName(null);
    setFileSize(null);
    setServerErrors([]);
    setImportSuccess(null);
    setSearchQuery("");
    setFilterValidity("ALL");
    const input = document.getElementById("fileInput") as HTMLInputElement;
    if (input) input.value = "";
  };

  // ── Execute Server-side DB Import ─────────────────────────────────────────
  const executeImport = async (targetRows: ParsedRowWithStatus[]) => {
    if (targetRows.length === 0) return;

    setImporting(true);
    setServerErrors([]);

    try {
      const cleanRows: ImportEmployeeRow[] = targetRows.map((r) => ({
        matricule: r.matricule,
        firstName: r.firstName,
        lastName: r.lastName,
        nationalId: r.nationalId,
        dateOfBirth: r.dateOfBirth,
        gender: r.gender,
        grade: r.grade,
        position: r.position,
        category: r.category,
        baseSalary: r.baseSalary,
        index: r.index,
        rib: r.rib,
        bankName: r.bankName,
        email: r.email,
        phone: r.phone,
      }));

      const res = await importEmployeesAction(cleanRows, organizationId);

      if (!res.success) {
        setServerErrors(res.errors || [{ row: 0, matricule: "-", error: "فشل استيراد الموظفين" }]);
        toast.error("فشل إتمام عملية الاستيراد", {
          description: "يرجى مراجعة تقرير الأخطاء وتصحيح الحقول المرفوضة في قاعدة البيانات.",
        });
      } else {
        setImportSuccess(res.imported);
        toast.success(`تم استيراد ${res.imported} موظفاً بنجاح في قاعدة البيانات!`, {
          description: "تم حفظ السجلات مع أرقام التعريف الوطنية NIN بنجاح عبر معاملة ذرية موحدة.",
          duration: 6000,
        });
      }
    } catch (err: unknown) {
      setServerErrors([{ row: 0, matricule: "-", error: err instanceof Error ? err.message : "حدث خطأ غير متوقع" }]);
      toast.error("حدث خطأ غير متوقع أثناء إدراج البيانات");
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImportAll = () => {
    executeImport(rows);
  };

  const handleConfirmImportValidsOnly = () => {
    const valids = rows.filter((r) => r.isValid);
    executeImport(valids);
  };

  // ── Export Preview Rows to Excel ──────────────────────────────────────────
  const handleExportPreviewToExcel = () => {
    const dataToExport = filteredRows.length > 0 ? filteredRows : rows;
    const exportDate = new Date().toLocaleDateString("fr-FR");

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>تقرير المعاينة</x:Name>
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
          td { border: 1px solid #e2e8f0; padding: 8px 6px; font-size: 11px; text-align: right; }
          .center { text-align: center; }
          .valid { background-color: #ecfdf5; color: #065f46; font-weight: bold; }
          .invalid { background-color: #fff1f2; color: #9f1239; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="10" style="font-size: 14px; font-weight: bold; text-align: center; padding: 12px; background-color: #f0fdfa; color: #0f766e;">
              تقرير معاينة استيراد الموظفين — UNI-PAY (${exportDate}) — إجمالي السجلات: ${dataToExport.length}
            </td>
          </tr>
          <thead>
            <tr>
              <th>السطر</th>
              <th>الرقم الوظيفي</th>
              <th>الاسم واللقب</th>
              <th>رقم التعريف الوطني (NIN)</th>
              <th>الرتبة والمنصب</th>
              <th>طبيعة العقد</th>
              <th>الراتب الأساسي (دج)</th>
              <th>الحساب البنكي (RIB)</th>
              <th>حالة السجل</th>
              <th>تفاصيل الأخطاء والملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport
              .map(
                (r) => `
              <tr>
                <td class="center">${r.rowNumber}</td>
                <td style="mso-number-format:'\\@'; font-weight: bold;">${r.matricule}</td>
                <td>${r.firstName} ${r.lastName}</td>
                <td style="mso-number-format:'\\@';">${r.nationalId || "—"}</td>
                <td>${r.grade || "—"} ${r.position ? `(${r.position})` : ""}</td>
                <td class="center">${r.category || "PERMANENT"}</td>
                <td class="center" style="font-weight: bold;">${cleanCurrency(r.baseSalary).toLocaleString("fr-FR")}</td>
                <td style="mso-number-format:'\\@';">${r.rib || "—"} ${r.bankName ? `(${r.bankName})` : ""}</td>
                <td class="center ${r.isValid ? "valid" : "invalid"}">${r.isValid ? "صالح للإدراج" : "يحتاج تصحيح"}</td>
                <td>${r.errors.join(" | ") || "سليم 100%"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + tableHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `apercu_import_employes_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("تم تصدير تقرير المعاينة إلى Excel بنجاح.");
  };

  // ── Filtered Rows ─────────────────────────────────────────────────────────
  const filteredRows = rows.filter((r) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
      const matchName = fullName.includes(q);
      const matchMatricule = r.matricule.toLowerCase().includes(q);
      const matchNin = (r.nationalId || "").toLowerCase().includes(q);
      const matchGrade = (r.grade || "").toLowerCase().includes(q);
      const matchRib = (r.rib || "").toLowerCase().includes(q);
      const matchBank = (r.bankName || "").toLowerCase().includes(q);
      if (!matchName && !matchMatricule && !matchNin && !matchGrade && !matchRib && !matchBank) {
        return false;
      }
    }

    // Validity filter
    if (filterValidity === "VALID") return r.isValid;
    if (filterValidity === "INVALID") return !r.isValid;

    return true;
  });

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.filter((r) => !r.isValid).length;
  const totalBaseSalary = rows.reduce((sum, r) => sum + cleanCurrency(r.baseSalary), 0);
  const hasActiveFilters = Boolean(searchQuery.trim() || filterValidity !== "ALL");

  return (
    <div className="space-y-6">
      {/* ── Step 1: File selector card ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>1. تحديد الملف للرفع والمعاينة المسبقة</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              يدعم ملفات Excel الحديثة (<strong className="font-mono text-slate-700">.xlsx</strong>)، Excel التوافقية (<strong className="font-mono text-slate-700">.xls</strong>) وملفات <strong className="font-mono text-slate-700">CSV/TSV</strong> بترميز UTF-8.
            </p>
          </div>

          {/* Template Download Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadExcelTemplate}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-2xs cursor-pointer focus-ring"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تحميل نموذج Excel (.xls)</span>
            </button>

            <button
              onClick={handleDownloadCsvTemplate}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all shadow-2xs cursor-pointer focus-ring"
              title="تحميل كملف CSV"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>نموذج CSV</span>
            </button>
          </div>
        </div>

        {/* Dropzone with Drag & Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            isDragging
              ? "border-teal-500 bg-teal-50/50 shadow-sm scale-[1.005]"
              : "border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/20"
          }`}
        >
          <input
            type="file"
            id="fileInput"
            accept=".xlsx,.xls,.csv,.txt,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer block space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-2xs border border-teal-100">
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 hover:text-teal-700 block">
                {loading
                  ? "جارٍ قراءة الملف وتحليل الجداول والأعمدة..."
                  : fileName
                  ? `${fileName} (${fileSize || ""})`
                  : "انقر لاختيار ملف الموظفين أو اسحبه وأفلته هنا"}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                الصيغ المقبولة: <strong className="font-mono text-slate-600">.XLSX, .XLS, .CSV</strong> (الحد الأقصى الموصى به: 2500 موظف في الدفعة الواحدة)
              </p>
            </div>
          </label>
        </div>

        {/* Active file action bar if file loaded */}
        {fileName && !loading && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600" />
              <span>الملف الحالي: <strong className="font-mono text-slate-800">{fileName}</strong></span>
              {fileSize && <span className="text-slate-400 font-mono">({fileSize})</span>}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تغيير الملف</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Success banner if imported ───────────────────────────────────── */}
      {importSuccess !== null && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">تم إتمام عملية الاستيراد بنجاح!</h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                تم تسجيل وإدراج <strong className="font-mono font-bold text-emerald-950 text-sm">{importSuccess}</strong> موظفاً في قاعدة البيانات عبر معاملة ذرية موحدة (<span className="font-mono">DB Transaction</span>) مع توثيق العملية كاملاً في سجل التدقيق.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/agent/employees"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 shadow-sm transition-all"
            >
              <Users className="w-4 h-4" />
              <span>الانتقال لسجل الموظفين</span>
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>استيراد ملف جديد</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Server Errors Report ─────────────────────────────────────────── */}
      {serverErrors.length > 0 && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-3 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-sm text-red-800">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>تعذر إتمام الاستيراد — تقرير قيود قاعدة البيانات وقواعد التحقق المرفوضة:</span>
          </div>
          <ul className="divide-y divide-red-200/60 text-xs">
            {serverErrors.map((err, idx) => (
              <li key={idx} className="py-2.5 flex items-center justify-between">
                <span>
                  السطر <strong className="font-mono font-bold">{err.row}</strong>: {err.error}
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

      {/* ── Step 2: Preview, Validation & Search/Filter Table ─────────────── */}
      {rows.length > 0 && importSuccess === null && (
        <div className="space-y-4">
          {/* ── Metric Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">إجمالي السجلات المقروءة</p>
                <p className="text-lg font-extrabold text-slate-900 font-mono">{rows.length}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-800 font-medium">جاهزة ومؤكدة للإدراج</p>
                <p className="text-lg font-extrabold text-emerald-700 font-mono">{validCount}</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-2xs flex items-center gap-3 ${
              invalidCount > 0
                ? "bg-rose-50/50 border-rose-200 text-rose-900"
                : "bg-white border-slate-200/80 text-slate-400"
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                invalidCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium">تحتوي على أخطاء</p>
                <p className="text-lg font-extrabold font-mono">{invalidCount}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">مجموع الرواتب المقدرة</p>
                <p className="text-sm font-extrabold text-slate-900 font-mono">
                  {totalBaseSalary.toLocaleString("fr-FR")} <span className="text-[10px] text-slate-400">دج</span>
                </p>
              </div>
            </div>
          </div>

          {/* ── Table Container Card ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4">
            {/* Header & Confirm Button Bar */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>2. المعاينة والتحقق المسبق (Prévisualisation)</span>
                </h2>
                <div className="flex items-center gap-2 text-xs mt-1 text-slate-500">
                  <span>الملف: <strong className="font-mono text-slate-800">{fileName}</strong></span>
                  <span>•</span>
                  <span>مطابقة الأعمدة والبيانات جاهزة للمراجعة</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {invalidCount > 0 ? (
                  <>
                    <button
                      onClick={handlePurgeInvalidRows}
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                      title="حذف جميع الأسطر غير الصالحة دفعة واحدة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الخاطئة ({invalidCount})</span>
                    </button>

                    <button
                      onClick={handleConfirmImportValidsOnly}
                      disabled={validCount === 0 || importing}
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري الحفظ الذري...</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4" />
                          <span>استيراد الصالحة فقط ({validCount})</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConfirmImportAll}
                    disabled={importing}
                    type="button"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري الإدراج في قاعدة البيانات...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>تأكيد إدراج جميع الموظفين ({validCount}) في قاعدة البيانات</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Alert if there are errors */}
            {invalidCount > 0 && (
              <div className="mx-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>تنبيه التحقق:</strong> يحتوي الملف على <strong className="font-mono font-bold text-amber-950">{invalidCount}</strong> سجلاً غير صالح (أرقام وظيفية مكررة أو حقول إلزامية ناقصة). يمكنك استخدام خيار <strong>"حذف الخاطئة"</strong> لتصفية القائمة فوراً، أو النقر على <strong>"استيراد الصالحة فقط"</strong> لإدخال السجلات السليمة وتجاوز الباقي.
                </div>
              </div>
            )}

            {/* ── Search, Filter & Export Toolbar for Preview Table ────────── */}
            <div className="px-5">
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search & Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  {/* Search Input */}
                  <div className="relative min-w-[220px] sm:min-w-[280px] flex-1 sm:flex-none">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث بالاسم، الرقم الوظيفي، NIN أو البنك..."
                      className="w-full pr-9 pl-8 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 transition-all placeholder:text-slate-400 bg-white"
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

                  {/* Validity Filter Dropdown */}
                  <div>
                    <select
                      value={filterValidity}
                      onChange={(e) => setFilterValidity(e.target.value as "ALL" | "VALID" | "INVALID")}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all"
                    >
                      <option value="ALL">جميع الأسطر ({rows.length})</option>
                      <option value="VALID">الصالحة فقط ({validCount})</option>
                      <option value="INVALID">التي تحتوي على أخطاء ({invalidCount})</option>
                    </select>
                  </div>

                  {/* Reset Filters Button */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterValidity("ALL");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/60 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إلغاء التصفية</span>
                    </button>
                  )}
                </div>

                {/* Counter Badge & Export Preview Button */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 whitespace-nowrap">
                    عرض {filteredRows.length} من {rows.length}
                  </span>

                  <button
                    type="button"
                    onClick={handleExportPreviewToExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                    title="تصدير جدول المعاينة بالكامل إلى Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                    <span>تصدير المعاينة (Excel)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Preview Table with 100% Column Alignment ─────────────────── */}
            {filteredRows.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Filter className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  لم يتم العثور على أي سطر يطابق معايير البحث أو التصفية الحالية.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterValidity("ALL");
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors cursor-pointer"
                >
                  <span>إعادة ضبط التصفية</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="px-3 py-3 text-center w-12">#</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap min-w-[130px]">الرقم الوظيفي</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap min-w-[160px]">الموظف (الاسم و NIN)</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap min-w-[150px]">الرتبة والمنصب</th>
                      <th className="px-3 py-3 text-center whitespace-nowrap min-w-[110px]">طبيعة العقد</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap min-w-[120px]">الراتب الأساسي</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap min-w-[170px]">الحساب المالي (RIB)</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap min-w-[140px]">حالة السجل</th>
                      <th className="px-3 py-3 text-center w-14">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((r) => (
                      <tr
                        key={r.rowNumber}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          !r.isValid ? "bg-rose-50/30" : ""
                        }`}
                      >
                        {/* 1. Row Number */}
                        <td className="px-3 py-3 font-mono text-center text-slate-400">
                          {r.rowNumber}
                        </td>

                        {/* 2. Matricule */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg text-slate-800 text-[11px]">
                            {r.matricule || "—"}
                          </span>
                        </td>

                        {/* 3. Name & National ID */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {r.firstName} {r.lastName}
                          </div>
                          {r.nationalId && (
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              NIN: {r.nationalId}
                            </div>
                          )}
                        </td>

                        {/* 4. Grade & Position */}
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-medium text-slate-800">{r.grade || "—"}</div>
                          {r.position && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{r.position}</div>
                          )}
                        </td>

                        {/* 5. Category */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.category === "CONTRACTUEL"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : r.category === "VACATAIRE"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {r.category === "CONTRACTUEL"
                              ? "تعاقدي"
                              : r.category === "VACATAIRE"
                              ? "مؤقت"
                              : "دائم"}
                          </span>
                        </td>

                        {/* 6. Base Salary & Index */}
                        <td className="px-4 py-3 font-mono text-center whitespace-nowrap">
                          <div className="text-teal-800 font-bold">
                            {cleanCurrency(r.baseSalary).toLocaleString("fr-FR")} دج
                          </div>
                          {r.index && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              الرقم: {r.index}
                            </div>
                          )}
                        </td>

                        {/* 7. Bank & RIB */}
                        <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                          <div>{r.rib || "—"}</div>
                          {r.bankName && (
                            <div className="text-[10px] font-sans text-slate-400 mt-0.5">{r.bankName}</div>
                          )}
                        </td>

                        {/* 8. Validation Status */}
                        <td className="px-4 py-3 text-center">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>سليم وجاهز</span>
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              {r.errors.map((err, eIdx) => (
                                <span
                                  key={eIdx}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200/60"
                                >
                                  <XCircle className="w-2.5 h-2.5 shrink-0" />
                                  <span>{err}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 9. Discard Action */}
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(r.rowNumber)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="استبعاد هذا السطر من قائمة الاستيراد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
