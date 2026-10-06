import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { EmployeeDetailClient } from "@/components/agent/employees/EmployeeDetailClient";
import {
  User,
  Briefcase,
  DollarSign,
  History,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ملف الموظف — مساحة الموارد البشرية — UNI-PAY",
  description: "عرض الملف الإداري والمالي وتاريخ التعديلات للموظف",
};

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const user = await requireRole(["AGENT_RH", "ADMIN"]);
  const { id } = await params;

  const [employee, units] = await Promise.all([
    prisma.employee.findUnique({
      where: { id },
      include: {
        organizationUnit: true,
        organization: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.organizationUnit.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!employee) {
    notFound();
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            نشط (ACTIVE)
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            معلق (SUSPENDED)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            غير نشط (INACTIVE)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/agent/employees"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى سجل الموظفين</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {employee.firstName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {employee.firstName} {employee.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {employee.matricule}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500">
                  {employee.grade || "الرتبة غير محددة"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {statusBadge(employee.status)}
          <EmployeeDetailClient employee={employee} units={units} />
        </div>
      </div>

      {/* Main Grid Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Informations Personnelles */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">المعلومات الشخصية والاتصال</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">رقم بطاقة التعريف (CIN):</span>
              <span className="font-mono font-bold text-slate-800">
                {employee.nationalId || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">تاريخ الميلاد:</span>
              <span className="font-mono text-slate-800">
                {employee.dateOfBirth
                  ? new Date(employee.dateOfBirth).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">الجنس:</span>
              <span className="text-slate-800">
                {employee.gender === "M" ? "ذكر" : employee.gender === "F" ? "أنثى" : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                الهاتف:
              </span>
              <span className="font-mono text-slate-800">{employee.phone || "—"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                البريد الإلكتروني:
              </span>
              <span className="font-mono text-slate-800">{employee.email || "—"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                العنوان:
              </span>
              <span className="text-slate-800">{employee.address || "—"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Informations Administratives */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Briefcase className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">المعلومات الإدارية والوظيفية</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">المؤسسة:</span>
              <span className="font-bold text-slate-800">
                {employee.organization.name}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">المصلحة / الكلية:</span>
              <span className="font-semibold text-slate-800">
                {employee.organizationUnit?.name || "الإدارة المركزية"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">الرتبة (Grade):</span>
              <span className="font-bold text-teal-800">{employee.grade || "—"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">المنصب (Poste):</span>
              <span className="text-slate-800">{employee.position || "—"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">طبيعة العقد:</span>
              <span className="text-slate-800">
                {employee.category === "PERMANENT"
                  ? "دائم (Titulaire)"
                  : employee.category === "CONTRACTUEL"
                  ? "تعاقدي (Contractuel)"
                  : employee.category === "VACATAIRE"
                  ? "ساعاتي (Vacataire)"
                  : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">تاريخ التوظيف:</span>
              <span className="font-mono text-slate-800">
                {employee.recruitmentDate
                  ? new Date(employee.recruitmentDate).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Informations Salariales & Bancaires */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">البيانات المالية والحساب البنكي</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-100">
              <span className="text-teal-700 font-semibold block text-[11px]">الراتب الأساسي الحالي</span>
              <span className="text-xl font-black font-mono text-teal-900 mt-1 block">
                {Number(employee.baseSalary).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} دج
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 font-semibold block text-[11px]">الرقم الاستدلالي (Indice)</span>
              <span className="text-xl font-bold font-mono text-slate-800 mt-1 block">
                {employee.index ?? "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 font-semibold block text-[11px]">البنك / البريد المعتمد</span>
              <span className="text-base font-bold text-slate-800 mt-1 block">
                {employee.bankName || "بريد الجزائر / البنك"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 font-semibold block text-[11px]">رقم الحساب (RIB - 20 رقماً)</span>
              <span className="text-xs font-mono font-bold tracking-wider text-slate-900 mt-2 block break-all">
                {employee.rib || "غير مسجل"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Historical Timeline (EmployeeHistory) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">
              سجل التعديلات وتاريخ البيانات الحساسة (Audit & Historique)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {employee.history.length} تعديل مسجل
          </span>
        </div>

        {employee.history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            لا توجد تعديلات مسجلة بعد. سيتم أرشفة أي تغيير في الراتب أو الرتبة أو الحالة هنا تلقائياً.
          </div>
        ) : (
          <div className="space-y-3">
            {employee.history.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 font-mono text-[11px] bg-slate-200/60 px-2 py-0.5 rounded">
                      الحقل: {h.field}
                    </span>
                    <span className="text-slate-500">
                      القيمة السابقة:{" "}
                      <strong className="text-red-700 font-mono">{h.oldValue || "لا شيء"}</strong>{" "}
                      ← الجديدة:{" "}
                      <strong className="text-emerald-700 font-mono">{h.newValue}</strong>
                    </span>
                  </div>
                  {h.reason && (
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      مبرر التعديل: <span className="font-semibold">{h.reason}</span>
                    </p>
                  )}
                </div>

                <div className="text-left font-mono text-[11px] text-slate-400 shrink-0">
                  <Clock className="w-3 h-3 inline-block ml-1" />
                  {new Date(h.createdAt).toLocaleDateString("fr-FR")}{" "}
                  {new Date(h.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
