import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import {
  BatchEmployeeManager,
  RemoveEmployeeButton,
} from "@/components/agent/payroll/BatchEmployeeManager";
import {
  FileSpreadsheet,
  ArrowRight,
  Users,
  Clock,
  Calculator,
  CheckCircle2,
  DollarSign,
  RotateCw,
  Eye,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "تفاصيل دفعة الأجر — مساحة الموارد البشرية — UNI-PAY",
  description: "إدارة الموظفين والبيانات التشغيلية لدفعة الأجر",
};

interface BatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  await requireRole(["AGENT_RH", "ADMIN"]);
  const { id } = await params;

  const batch = await prisma.payrollBatch.findUnique({
    where: { id },
    include: {
      period: true,
      employees: {
        include: {
          employee: {
            include: {
              organizationUnit: true,
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
      attendanceRecords: {
        select: { employeeId: true },
      },
      lineItems: {
        select: { employeeId: true },
      },
      records: {
        select: { employeeId: true, netAmount: true, status: true },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  // Find all active employees not in this batch
  const existingEmployeeIds = batch.employees.map((e) => e.employeeId);
  const availableEmployees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: existingEmployeeIds },
    },
    select: {
      id: true,
      matricule: true,
      firstName: true,
      lastName: true,
      grade: true,
      baseSalary: true,
    },
    orderBy: { matricule: "asc" },
  });

  const attendanceSet = new Set(batch.attendanceRecords.map((a) => a.employeeId));
  const lineItemsMap = new Map<string, number>();
  for (const item of batch.lineItems) {
    lineItemsMap.set(item.employeeId, (lineItemsMap.get(item.employeeId) || 0) + 1);
  }
  const recordsMap = new Map<string, { netAmount: number | string; status: string }>();
  for (const rec of batch.records) {
    recordsMap.set(rec.employeeId, {
      netAmount: Number(rec.netAmount),
      status: rec.status,
    });
  }

  const batchStatusBadge = (status: string) => {
    switch (status) {
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            جاهز للمراجعة (READY_FOR_REVIEW)
          </span>
        );
      case "CALCULATED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Calculator className="w-3.5 h-3.5" />
            مُحتسب (CALCULATED)
          </span>
        );
      case "RETURNED_FOR_CORRECTION":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCw className="w-3.5 h-3.5" />
            معاد للتصحيح
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            مسودة (DRAFT)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/agent/payroll-periods/${batch.periodId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للفترة: {batch.period.label}</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  دفعة {batch.period.label}
                </h1>
                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                  v{batch.versionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {batch.label ? `${batch.label} • ` : ""}
                تاريخ الإنشاء: {new Date(batch.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {batchStatusBadge(batch.status)}
          <BatchEmployeeManager
            batchId={batch.id}
            batchStatus={batch.status}
            availableEmployees={availableEmployees.map((emp) => ({
              id: emp.id,
              matricule: emp.matricule,
              firstName: emp.firstName,
              lastName: emp.lastName,
              grade: emp.grade,
              baseSalary: Number(emp.baseSalary),
            }))}
          />
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        <Link
          href={`/agent/batches/${batch.id}`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white shadow-xs shrink-0"
        >
          <Users className="w-4 h-4" />
          <span>الموظفون في الدفعة ({batch.employees.length})</span>
        </Link>
        <Link
          href={`/agent/batches/${batch.id}/attendance`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 transition-colors"
        >
          <Clock className="w-4 h-4 text-slate-400" />
          <span>سجلات الحضور والغيابات</span>
        </Link>
        <Link
          href={`/agent/batches/${batch.id}/indemnities`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 transition-colors"
        >
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span>المنح والخصومات</span>
        </Link>
        <Link
          href={`/agent/batches/${batch.id}/calculate`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 shrink-0 transition-colors"
        >
          <Calculator className="w-4 h-4 text-teal-600" />
          <span>محرك الاحتساب والتحقق</span>
        </Link>
      </div>

      {/* Employees Table in Batch */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              قائمة الموظفين المدرجين في هذه الدفعة
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة حالة الحضور، بنود المنح، والراتب الصافي المحسوب
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            {batch.employees.length} موظف مدرج
          </span>
        </div>

        {batch.employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">لا يوجد موظفون مضافون لهذه الدفعة</h3>
            <p className="text-xs text-slate-500 mt-1">
              استخدم زر &quot;إضافة موظفين للدفعة&quot; بالأعلى لإدراج الموظفين النشطين.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">الرقم الوظيفي</th>
                  <th className="px-5 py-3.5">الاسم واللقب</th>
                  <th className="px-5 py-3.5">الرتبة والمصلحة</th>
                  <th className="px-5 py-3.5">الراتب الأساسي</th>
                  <th className="px-5 py-3.5">الحضور</th>
                  <th className="px-5 py-3.5">المنح / الخصومات</th>
                  <th className="px-5 py-3.5">الصافي المحسوب</th>
                  <th className="px-5 py-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batch.employees.map(({ employee: emp }) => {
                  const hasAttendance = attendanceSet.has(emp.id);
                  const lineItemsCount = lineItemsMap.get(emp.id) || 0;
                  const calcRecord = recordsMap.get(emp.id);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {emp.matricule}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-800">{emp.grade || "غير محدد"}</div>
                        <div className="text-[11px] text-slate-400">
                          {emp.organizationUnit?.name || "الإدارة"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {Number(emp.baseSalary).toLocaleString("fr-FR")} دج
                      </td>
                      <td className="px-5 py-3.5">
                        {hasAttendance ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            مُسجل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            مفقود
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700">
                        {lineItemsCount > 0 ? (
                          <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            {lineItemsCount} بنود
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold">
                        {calcRecord ? (
                          <span className="text-emerald-700">
                            {Number(calcRecord.netAmount).toLocaleString("fr-FR")} دج
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/agent/employees/${emp.id}`}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="عرض ملف الموظف"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {["DRAFT", "RETURNED_FOR_CORRECTION"].includes(batch.status) && (
                            <RemoveEmployeeButton
                              batchId={batch.id}
                              employeeId={emp.id}
                              name={`${emp.firstName} ${emp.lastName}`}
                            />
                          )}
                        </div>
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
