import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import {
  Users,
  UserCheck,
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
  Calculator,
  ArrowUpRight,
  PlusCircle,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "لوحة القيادة — مساحة الموارد البشرية والرواتب — UNI-PAY",
  description: "مؤشرات إدارة الموظفين ومسيرات الرواتب لمنصة UNI-PAY",
};

export default async function AgentDashboardPage() {
  await requireRole(["AGENT_RH", "ADMIN"]);

  // Récupération des métriques réelles depuis Prisma
  const [
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    incompleteEmployeesCount,
    currentPeriod,
    draftBatchesCount,
    calculatedBatchesCount,
    returnedBatchesCount,
    recentBatches,
    recentAgentLogs,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: { in: ["INACTIVE", "SUSPENDED"] } } }),
    prisma.employee.count({
      where: {
        OR: [
          { baseSalary: 0 },
          { rib: null },
          { rib: "" },
        ],
      },
    }),
    prisma.payrollPeriod.findFirst({
      where: { status: { in: ["OPEN", "PROCESSING", "DRAFT"] } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    prisma.payrollBatch.count({ where: { status: "DRAFT" } }),
    prisma.payrollBatch.count({ where: { status: { in: ["CALCULATED", "READY_FOR_REVIEW"] } } }),
    prisma.payrollBatch.count({ where: { status: "RETURNED_FOR_CORRECTION" } }),
    prisma.payrollBatch.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        period: true,
        _count: {
          select: { employees: true, records: true },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { resourceType: { in: ["Employee", "PayrollPeriod", "PayrollBatch", "PayrollRecord", "AttendanceRecord"] } },
          { action: { startsWith: "EMPLOYEE_" } },
          { action: { startsWith: "PAYROLL_" } },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    }),
  ]);

  const batchStatusBadge = (status: string) => {
    switch (status) {
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            جاهز للمراجعة
          </span>
        );
      case "CALCULATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Calculator className="w-3 h-3" />
            مُحتسب
          </span>
        );
      case "RETURNED_FOR_CORRECTION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3" />
            مُعاد للتصحيح
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" />
            مسودة (تحت الإعداد)
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-teal-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مساحة العمل التشغيلية — المرحلة 4 (إدارة الموظفين ومحرك الأجور)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              لوحة قيادة الموارد البشرية وتصفية الأجور
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              إدارة شاملة لقاعدة بيانات الموظفين، إعداد كشوف الحضور، تسجيل المنح والخصومات، وتشغيل محرك احتساب الأجور المؤسساتي بدقة وفق القواعد المعتمدة.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/agent/employees/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all focus-ring"
            >
              <PlusCircle className="w-4 h-4" />
              <span>موظف جديد</span>
            </Link>
            <Link
              href="/agent/employees/import"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-sm shadow-sm transition-all focus-ring"
            >
              <Upload className="w-4 h-4" />
              <span>استيراد Excel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Employees */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الموظفين</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalEmployees}
            </span>
            <span className="text-xs font-semibold text-teal-600 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              {activeEmployees} نشط
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>غير نشطين / معلقين</span>
            <span className="font-mono font-bold text-slate-700">{inactiveEmployees}</span>
          </div>
        </div>

        {/* KPI 2: Current Payroll Period */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">فترة الأجر الحالية</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-lg font-bold text-slate-900 block truncate">
              {currentPeriod ? currentPeriod.label : "لا توجد فترة مفتوحة"}
            </span>
            <span className="text-xs font-semibold text-blue-600 block mt-1">
              {currentPeriod ? `الحالة: ${currentPeriod.status}` : "يرجى إنشاء فترة جديدة"}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/agent/payroll-periods" className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1">
              <span>عرض الفترات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* KPI 3: Payroll Batches Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">دفعات الأجور النشطة</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {draftBatchesCount + calculatedBatchesCount}
            </span>
            <span className="text-xs font-semibold text-purple-600">
              {calculatedBatchesCount} مكتملة الحساب
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>مسودات قيد التحضير:</span>
            <span className="font-mono font-bold text-slate-700">{draftBatchesCount}</span>
          </div>
        </div>

        {/* KPI 4: Incomplete Profiles / Blocker Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ملفات تحتاج تدقيق</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${incompleteEmployeesCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className={`text-3xl font-black font-mono tracking-tight ${incompleteEmployeesCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {incompleteEmployeesCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              راتب أو حساب بنكي ناقص
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>دفعات معادة للتصحيح:</span>
            <span className="font-mono font-bold text-amber-700">{returnedBatchesCount}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols in RTL: Right side): Recent Payroll Batches */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  آخر دفعات الأجور (Payroll Batches)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  حالة الدفعات، عدد الموظفين، وإمكانية المتابعة والاحتساب
                </p>
              </div>
              <Link
                href="/agent/batches"
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700"
              >
                <span>عرض الكل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentBatches.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold">لا توجد دفعات أجور منشأة حتى الآن.</p>
                <Link
                  href="/agent/payroll-periods"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إنشاء أول دفعة من خلال فترات الأجر</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-xs text-slate-500 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">الدفعة / الفترة</th>
                      <th className="px-5 py-3.5">النسخة</th>
                      <th className="px-5 py-3.5">الموظفين</th>
                      <th className="px-5 py-3.5">الحالة</th>
                      <th className="px-5 py-3.5 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {batch.period.label}
                          </div>
                          {batch.label && (
                            <div className="text-xs text-slate-400 mt-0.5">{batch.label}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-700 text-xs">
                          v{batch.versionNumber}
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-700 text-xs">
                          {batch._count.employees} موظف
                        </td>
                        <td className="px-5 py-4">
                          {batchStatusBadge(batch.status)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Link
                            href={`/agent/batches/${batch.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                          >
                            <span>تفاصيل</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/agent/employees"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">سجل الموظفين</h3>
              <p className="text-xs text-slate-500 mt-1">
                تصفح، بحث، وفلترة جميع الموظفين وتحديث بياناتهم
              </p>
            </Link>

            <Link
              href="/agent/payroll-periods"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">فترات الأجور</h3>
              <p className="text-xs text-slate-500 mt-1">
                فتح وإغلاق الفترات الشهرية وإنشاء دفعات الأجر
              </p>
            </Link>

            <Link
              href="/agent/calculate"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">محرك الحساب</h3>
              <p className="text-xs text-slate-500 mt-1">
                التدقيق التلقائي قبل الحساب وتنفيذ عمليات المعالجة
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column (1 Col in RTL: Left side): Audit Log */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">سجل عمليات المرحلة 4</h2>
              </div>
            </div>

            {recentAgentLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                لا توجد سجلات تتبع مسجلة بعد.
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                {recentAgentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 font-mono text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{log.resourceType || "نظام الأجور"}</span>
                      <span className="truncate max-w-[130px]">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : "النظام"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
