import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac/guards";
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export const metadata: Metadata = {
  title: "سجل الموظفين — مساحة الموارد البشرية — UNI-PAY",
  description: "إدارة الموظفين والبيانات الإدارية والمالية لمنصة UNI-PAY",
};

interface EmployeesPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    unitId?: string;
    page?: string;
  }>;
}

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  await requireRole(["AGENT_RH", "ADMIN"]);

  const params = await searchParams;
  const q = params.q?.trim() || "";
  const statusFilter = params.status || "";
  const unitFilter = params.unitId || "";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = 12;

  // Build where clause
  const where: Prisma.EmployeeWhereInput = {};

  if (statusFilter && ["ACTIVE", "INACTIVE", "SUSPENDED"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  if (unitFilter) {
    where.organizationUnitId = unitFilter;
  }

  if (q) {
    where.OR = [
      { matricule: { contains: q } },
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { nationalId: { contains: q } },
    ];
  }

  const [totalCount, employees, organizationUnits] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        organizationUnit: true,
      },
    }),
    prisma.organizationUnit.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            نشط
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            معلّق
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3" />
            غير نشط
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              سجل الموظفين
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة وتتبع ملفات الموظفين، بيانات الرواتب، والهيكل التنظيمي للمؤسسة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/agent/employees/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all focus-ring"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>استيراد Excel</span>
          </Link>
          <Link
            href="/agent/employees/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-sm hover:shadow transition-all focus-ring"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="البحث بالرقم الوظيفي، الاسم، اللقب، أو رقم الهوية..."
              className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 bg-white"
            >
              <option value="">جميع الحالات</option>
              <option value="ACTIVE">نشط (ACTIVE)</option>
              <option value="SUSPENDED">معلّق (SUSPENDED)</option>
              <option value="INACTIVE">غير نشط (INACTIVE)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              name="unitId"
              defaultValue={unitFilter}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 bg-white"
            >
              <option value="">جميع الأقسام / المصالح</option>
              {organizationUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full h-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="sm:hidden">تصفية</span>
            </button>
          </div>
        </form>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">لم يتم العثور على أي موظف</h3>
            <p className="text-xs text-slate-500 mt-1">
              جرب تغيير معايير البحث أو قم بإضافة موظف جديد.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-xs text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">الرقم الوظيفي</th>
                  <th className="px-5 py-3.5">الاسم واللقب</th>
                  <th className="px-5 py-3.5">الرتبة / المنصب</th>
                  <th className="px-5 py-3.5">المصلحة / الكلية</th>
                  <th className="px-5 py-3.5">الراتب الأساسي</th>
                  <th className="px-5 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
                        {emp.matricule}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {emp.firstName} {emp.lastName}
                      </div>
                      {emp.nationalId && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          رقم الهوية: {emp.nationalId}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-slate-800">
                        {emp.grade || "غير محدد"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {emp.position || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1 text-xs text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{emp.organizationUnit?.name || "الإدارة العامة"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-xs text-teal-800">
                      {Number(emp.baseSalary).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      دج
                    </td>
                    <td className="px-5 py-4">{statusBadge(emp.status)}</td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/agent/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض الملف</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              إجمالي النتائج: <strong className="text-slate-800">{totalCount}</strong> موظف
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/agent/employees?q=${q}&status=${statusFilter}&unitId=${unitFilter}&page=${page - 1}`}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              <span className="text-xs font-mono font-bold text-slate-700 px-2">
                صفحة {page} من {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/agent/employees?q=${q}&status=${statusFilter}&unitId=${unitFilter}&page=${page + 1}`}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
