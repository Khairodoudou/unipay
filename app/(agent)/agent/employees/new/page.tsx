import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { EmployeeForm } from "@/components/agent/employees/EmployeeForm";
import { UserPlus, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "إضافة موظف جديد — مساحة الموارد البشرية — UNI-PAY",
  description: "تسجيل موظف جديد في النظام بقاعدة بيانات UNI-PAY",
};

export default async function NewEmployeePage() {
  const user = await requireRole(["AGENT_RH", "ADMIN"]);

  // Fetch organization units for select dropdown
  const units = await prisma.organizationUnit.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              إضافة موظف جديد
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدخال البيانات الإدارية، الوظيفية، والمالية لتسجيل الموظف في مسيرات الأجور
          </p>
        </div>

        <Link
          href="/agent/employees"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all"
        >
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span>العودة للسجل</span>
        </Link>
      </div>

      {/* Form Card */}
      <EmployeeForm organizationId={user.organizationId} units={units} />
    </div>
  );
}
