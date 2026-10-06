import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { UserCreateForm } from "@/components/admin/users/UserCreateForm";
import { UserPlus, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "إضافة مستخدم جديد — UNI-PAY",
  description: "إنشاء حساب مستخدم جديد وتحديد دوره الوظيفي في منصة UNI-PAY",
};

export default async function NewUserPage() {
  await requireRole("ADMIN");

  const [roles, organizations] = await Promise.all([
    prisma.role.findMany({
      select: { id: true, code: true, nameAr: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      where: { isActive: true },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header with back navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/users"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لدليل المستخدمين</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserPlus className="w-6 h-6 text-teal-600" />
            <span>تسجيل مستخدم مؤسسي جديد</span>
          </h1>
        </div>
      </div>

      <UserCreateForm roles={roles} organizations={organizations} />
    </div>
  );
}
