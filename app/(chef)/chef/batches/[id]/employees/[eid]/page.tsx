import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import {
  User,
  ArrowRight,
  ShieldAlert,
  Clock,
  DollarSign,
} from "lucide-react";
import { StatusBadge } from "@/components/workflow/StatusBadge";

export const metadata: Metadata = {
  title: "تفاصيل أجر الموظف — رئيس المصلحة — أكاديميا شفاف",
  description: "مراجعة كشف تفصيلي لحسابات راتب الموظف والبنود المرتبطة به",
};

interface ChefEmployeeDetailPageProps {
  params: Promise<{ id: string; eid: string }>;
}

export default async function ChefEmployeeDetailPage({
  params,
}: ChefEmployeeDetailPageProps) {
  const user = await requireRole(["CHEF_SERVICE", "ADMIN"]);
  const { id: batchId, eid: employeeId } = await params;

  const [batch, employee, record, attendance, lineItems, findings] = await Promise.all([
    prisma.payrollBatch.findUnique({
      where: { id: batchId },
      include: { period: true },
    }),
    prisma.employee.findUnique({
      where: { id: employeeId },
      include: { organizationUnit: true },
    }),
    prisma.payrollRecord.findUnique({
      where: {
        batchId_employeeId: {
          batchId,
          employeeId,
        },
      },
    }),
    prisma.attendanceRecord.findUnique({
      where: {
        batchId_employeeId: {
          batchId,
          employeeId,
        },
      },
    }),
    prisma.payrollLineItem.findMany({
      where: { batchId, employeeId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditFinding.findMany({
      where: { batchId, employeeId },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!batch || batch.organizationId !== user.organizationId) {
    notFound();
  }

  if (!employee || employee.organizationId !== user.organizationId) {
    notFound();
  }

  const formatCurrency = (val: unknown) => {
    return new Intl.NumberFormat("ar-DZ", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(val != null ? String(val) : 0)) + " د.ج";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          href={`/chef/batches/${batch.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لمراجعة الدفعة: {batch.label || batch.period.label}</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {employee.matricule}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {employee.grade || "الرتبة غير محددة"} • {employee.organizationUnit?.name || "الهيكل الرئيسي"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={batch.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Salary Overview Grid */}
      {record ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 block">الراتب الأساسي</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
              {formatCurrency(record.snapshotBaseSalary)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 block">الراتب الخام (Brut)</span>
            <span className="text-base font-bold font-mono text-blue-700 mt-1 block">
              {formatCurrency(record.grossAmount)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 block">إجمالي الاقتطاعات</span>
            <span className="text-base font-bold font-mono text-rose-700 mt-1 block">
              {formatCurrency(record.totalDeductions)}
            </span>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-xs text-emerald-800 block font-semibold">الصافي للدفع (Net)</span>
            <span className="text-lg font-bold font-mono text-emerald-800 mt-1 block">
              {formatCurrency(record.netAmount)}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
          لم يتم احتساب أجر هذا الموظف في هذه الدفعة بعد.
        </div>
      )}

      {/* Attendance & Line Items Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">سجل الحضور والغيابات</h3>
          </div>
          {attendance ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">أيام العمل القانونية:</span>
                <span className="font-mono font-bold text-slate-800">{attendance.workingDays} يوم</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">أيام الحضور الفعلية:</span>
                <span className="font-mono font-bold text-emerald-700">{attendance.presentDays.toString()} يوم</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">أيام الغياب غير المبرر:</span>
                <span className="font-mono font-bold text-rose-700">{attendance.absentDays.toString()} يوم</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">العطل المرضية والسنوية:</span>
                <span className="font-mono font-bold text-slate-700">
                  {Number(attendance.sickDays) + Number(attendance.vacationDays)} يوم
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">لا توجد بيانات حضور مسجلة لهذا الموظف.</p>
          )}
        </div>

        {/* Line items details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">بنود المنح والعلاوات والاقتطاعات</h3>
          </div>
          {lineItems.length > 0 ? (
            <div className="space-y-2 text-xs">
              {lineItems.map((li) => (
                <div key={li.id} className="flex justify-between py-1 border-b border-slate-50">
                  <div>
                    <span className="font-semibold text-slate-800">{li.labelAr}</span>
                    <span className="text-[10px] text-slate-400 font-mono mx-1">({li.type})</span>
                  </div>
                  <span className={`font-mono font-bold ${li.type.includes("DEDUCT") || li.type.includes("TAX") ? "text-rose-700" : "text-emerald-700"}`}>
                    {formatCurrency(li.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">لا توجد بنود إضافية مسجلة لهذا الموظف.</p>
          )}
        </div>
      </div>

      {/* Employee specific audit findings */}
      {findings.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              الملاحظات والتنبيهات الرقابية المرتبطة بهذا الموظف ({findings.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {findings.map((f) => (
              <div key={f.id} className="py-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{f.title}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    {f.severity}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
