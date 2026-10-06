import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { PermissionMatrixForm } from "@/components/admin/roles/PermissionMatrixForm";
import {
  ArrowRight,
  Users,
  KeyRound,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "تفاصيل الدور والصلاحيات — UNI-PAY",
  description: "معاينة وتخصيص صلاحيات الدور والمستخدمين المنتمين إليه",
};

interface RoleDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  await requireRole("ADMIN");
  const { id } = await params;

  const [role, allPermissions] = await Promise.all([
    prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            organization: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.permission.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        nameAr: true,
        category: true,
      },
    }),
  ]);

  if (!role) {
    notFound();
  }

  const initialCodes = role.rolePermissions.map((rp) => rp.permission.code);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <Link
            href="/admin/roles"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لقائمة الأدوار</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {role.nameAr}
            </h1>
            <code className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
              {role.code}
            </code>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {role.descriptionAr || "دور نظام معتمد في المنصة."}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
              المستخدمون بهذا الدور
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {role.users.length}
            </span>
          </div>
          <Users className="w-6 h-6 text-slate-400" />
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
              الصلاحيات الحالية
            </span>
            <span className="text-xl font-black text-teal-700 font-mono">
              {initialCodes.length} من {allPermissions.length}
            </span>
          </div>
          <KeyRound className="w-6 h-6 text-teal-600" />
        </div>
      </div>

      {/* Permission Matrix Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-teal-600" />
            <span>مصفوفة الصلاحيات الممنوحة</span>
          </h2>
          <span className="text-xs text-slate-400">
            يمكن تفعيل أو إلغاء الصلاحيات حسب الحاجة
          </span>
        </div>

        <PermissionMatrixForm
          roleId={role.id}
          roleCode={role.code}
          allPermissions={allPermissions}
          initialPermissionCodes={initialCodes}
        />
      </div>

      {/* Users Assigned to this Role */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>المستخدمون المسند إليهم هذا الدور ({role.users.length})</span>
          </h3>
        </div>

        {role.users.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            لا يوجد أي مستخدم مسند إليه هذا الدور حالياً.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {role.users.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="font-bold text-xs text-slate-900 hover:text-teal-700 block transition-colors"
                  >
                    {u.firstName} {u.lastName}
                  </Link>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {u.email}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {u.organization.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      u.isActive ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    title={u.isActive ? "نشط" : "معطل"}
                  />
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="p-1 rounded text-slate-400 hover:text-teal-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
