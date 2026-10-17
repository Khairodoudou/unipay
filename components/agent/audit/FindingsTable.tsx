"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Eye,
  Sparkles,
  Cpu,
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  FindingType,
  FindingSeverity,
  FindingStatus,
  FINDING_TYPES,
  SEVERITY_CONFIG,
  STATUS_CONFIG,
} from "@/lib/audit/types";

export interface FindingTableRow {
  id: string;
  batchId: string;
  employeeId?: string | null;
  employeeName?: string | null;
  employeeMatricule?: string | null;
  departmentName?: string | null;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  detectedValue?: string | null;
  expectedValue?: string | null;
  source: string;
  confidence?: number | null;
  status: FindingStatus;
  createdAt: string | Date;
  aiAnalysesCount: number;
}

interface FindingsTableProps {
  batchId: string;
  findings: FindingTableRow[];
  initialSeverityFilter?: string;
}

export function FindingsTable({
  batchId,
  findings,
  initialSeverityFilter = "",
}: FindingsTableProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState(initialSeverityFilter);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Filtre sévérité
      if (severityFilter && f.severity !== severityFilter) return false;
      // Filtre statut
      if (statusFilter && f.status !== statusFilter) return false;
      // Filtre type
      if (typeFilter && f.type !== typeFilter) return false;

      // Recherche textuelle
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = f.employeeName?.toLowerCase().includes(query) ?? false;
        const matchesMatricule = f.employeeMatricule?.toLowerCase().includes(query) ?? false;
        const matchesTitle = f.title.toLowerCase().includes(query);
        const matchesDesc = f.description.toLowerCase().includes(query);
        return matchesName || matchesMatricule || matchesTitle || matchesDesc;
      }

      return true;
    });
  }, [findings, severityFilter, statusFilter, typeFilter, search]);

  const severityIcon = (severity: FindingSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertOctagon className="w-3.5 h-3.5" />;
      case "HIGH":
        return <ShieldAlert className="w-3.5 h-3.5" />;
      case "WARNING":
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case "INFO":
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Controls & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالموظف، الرقم الوظيفي، أو الملاحظة..."
            className="w-full pl-3 pr-10 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:border-teal-500"
          >
            <option value="">جميع درجات الخطورة</option>
            <option value="CRITICAL">حرجة (CRITICAL)</option>
            <option value="HIGH">مرتفعة (HIGH)</option>
            <option value="WARNING">تنبيه (WARNING)</option>
            <option value="INFO">إعلامية (INFO)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:border-teal-500"
          >
            <option value="">جميع الحالات</option>
            <option value="OPEN">مفتوحة (OPEN)</option>
            <option value="REVIEWED">تمت المعاينة (REVIEWED)</option>
            <option value="CONFIRMED">مؤكدة (CONFIRMED)</option>
            <option value="FALSE_POSITIVE">إنذار خاطئ (FALSE_POSITIVE)</option>
            <option value="RESOLVED">تمت التسوية (RESOLVED)</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:border-teal-500 max-w-[180px] truncate"
          >
            <option value="">جميع أصناف الخلل</option>
            {Object.values(FINDING_TYPES).map((t) => (
              <option key={t.code} value={t.code}>
                {t.labelAr}
              </option>
            ))}
          </select>

          {(severityFilter || statusFilter || typeFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setSeverityFilter("");
                setStatusFilter("");
                setTypeFilter("");
                setSearch("");
              }}
              className="text-xs text-teal-700 hover:text-teal-900 font-bold px-2 py-1 rounded"
            >
              إلغاء الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      {filteredFindings.length === 0 ? (
        <div className="p-12 text-center">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">لا توجد ملاحظات تدقيق تطابق المعايير</h3>
          <p className="text-xs text-slate-500 mt-1">
            {findings.length === 0
              ? "لم يتم تسجيل أي ملاحظة في هذه الدفعة بعد، أو أن الدفعة لم تخضع للتدقيق الذكي."
              : "جرب تغيير كلمات البحث أو إعادة ضبط خيارات التصفية."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-3.5">الموظف المعني</th>
                <th className="px-5 py-3.5">الصنف</th>
                <th className="px-5 py-3.5">الخطورة</th>
                <th className="px-5 py-3.5 max-w-[280px]">بيان الملاحظة</th>
                <th className="px-5 py-3.5">المصدر</th>
                <th className="px-5 py-3.5">الثقة</th>
                <th className="px-5 py-3.5">الحالة</th>
                <th className="px-5 py-3.5">التاريخ</th>
                <th className="px-5 py-3.5 text-center">معاينة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFindings.map((finding) => {
                const sevConfig = SEVERITY_CONFIG[finding.severity];
                const statusMeta = STATUS_CONFIG[finding.status];
                const typeMeta = FINDING_TYPES[finding.type];
                const isAI = finding.source === "AI_ASSISTANT" || finding.aiAnalysesCount > 0;

                return (
                  <tr key={finding.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employé */}
                    <td className="px-5 py-3.5">
                      {finding.employeeName ? (
                        <div>
                          <div className="font-bold text-slate-900">
                            {finding.employeeName}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                              {finding.employeeMatricule}
                            </span>
                            {finding.departmentName && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {finding.departmentName}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
                          عام على الدفعة
                        </span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800 block">
                        {typeMeta?.labelAr || finding.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {finding.type}
                      </span>
                    </td>

                    {/* Sévérité */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sevConfig.badgeClass}`}
                      >
                        {severityIcon(finding.severity)}
                        <span>{sevConfig.labelAr}</span>
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5 max-w-[280px]">
                      <div className="font-bold text-slate-900 line-clamp-1">
                        {finding.title}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {finding.description}
                      </p>
                    </td>

                    {/* Source */}
                    <td className="px-5 py-3.5">
                      {isAI ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>Gemini AI</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <Cpu className="w-3 h-3 text-slate-500" />
                          <span>قواعد آلية</span>
                        </span>
                      )}
                    </td>

                    {/* Confidence */}
                    <td className="px-5 py-3.5 font-mono">
                      {finding.confidence != null ? (
                        <span className="font-bold text-slate-700">
                          {Math.round(finding.confidence * 100)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.labelAr}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {new Date(finding.createdAt).toLocaleDateString("fr-FR")}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/agent/batches/${batchId}/audit/${finding.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors"
                        title="معاينة تفاصيل الخلل واتخاذ القرار"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>فحص</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
