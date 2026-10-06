import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { UserDetailForm } from "@/components/admin/users/UserDetailForm";
import {
  ArrowRight,
  User,
  History,
} from "lucide-react";

export const metadata: Metadata = {
  title: "تفاصيل المستخدم — UNI-PAY",
  description: "معاينة وتعديل بيانات المستخدم وحالته في النظام",
};

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await requireRole("ADMIN");
  const { id } = await params;

  const [user, roles, organizations, userAuditLogs, activeSessionsCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          roleId: true,
          organizationId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              code: true,
              nameAr: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.role.findMany({
        select: { id: true, code: true, nameAr: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.organization.findMany({
        select: { id: true, name: true },
        where: { isActive: true },
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [{ userId: id }, { resourceId: id }],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.session.count({
        where: {
          userId: id,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <Link
            href="/admin/users"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لدليل المستخدمين</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-teal-600" />
            <span>
              {user.firstName} {user.lastName}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                user.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {user.isActive ? "نشط" : "معطّل"}
            </span>
          </h1>
        </div>
      </div>

      {/* Meta Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
            الدور الحالي
          </span>
          <span className="text-xs font-black text-teal-700">
            {user.role.nameAr}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
            الجلسات النشطة
          </span>
          <span className="text-xs font-black text-slate-800 font-mono">
            {activeSessionsCount} جلسة مفتوحة
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
            آخر تسجيل دخول
          </span>
          <span className="text-xs font-bold text-slate-700 font-mono">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleDateString("ar-DZ")
              : "لم يسجل بعد"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
            تاريخ التسجيل
          </span>
          <span className="text-xs font-bold text-slate-700 font-mono">
            {new Date(user.createdAt).toLocaleDateString("ar-DZ")}
          </span>
        </div>
      </div>

      {/* Form */}
      <UserDetailForm user={user} roles={roles} organizations={organizations} />

      {/* Recent Activity for this User */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-teal-600" />
          <span>سجل العمليات الأخير المرتبط بهذا المستخدم</span>
        </h3>

        {userAuditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            لا توجد سجلات تدقيق مباشرة مسجلة لهذا الحساب.
          </p>
        ) : (
          <div className="space-y-2">
            {userAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 font-mono">
                    {log.action}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({log.resourceType || "AUTH"})
                  </span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleString("ar-DZ", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
