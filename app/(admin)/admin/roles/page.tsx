import type { Metadata } from "next";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { RolesGrid } from "@/components/admin/roles/RolesGrid";
import { ShieldCheck, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "الأدوار والصلاحيات — UNI-PAY",
  description: "الأدوار المؤسسية السبعة المعتمدة في منصة UNI-PAY ومصفوفة الصلاحيات",
};

export default async function AdminRolesPage() {
  await requireRole("ADMIN");

  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: {
          users: true,
          rolePermissions: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <span>الأدوار المؤسسية السبعة (RBAC)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            الأدوار القياسية المحددة في دورة معالجة ومراقبة الأجور بالجامعة
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          تعتمد المنصة على <strong className="font-bold">7 أدوار نظام ثابتة</strong> تمثل الفاعلين المؤسسيين في سلسلة إعداد الأجور، المصادقة والرقابة. يمكن تعديل الصلاحيات الممنوحة لكل دور وفق المتطلبات التنظيمية، مع حماية صلاحيات الإدارة الحيوية تلقائياً.
        </p>
      </div>

      {/* Roles Grid */}
      <RolesGrid roles={roles} />
    </div>
  );
}
