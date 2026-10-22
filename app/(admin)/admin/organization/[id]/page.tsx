import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { UnitDetailForm } from "@/components/admin/organization/UnitDetailForm";
import { ArrowRight, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "تعديل الوحدة الإدارية — UNI-PAY",
  description: "تحيين وتعديل بيانات الوحدة التنظيمية",
};

interface UnitDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UnitDetailPage({ params }: UnitDetailPageProps) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;

  const unit = await prisma.organizationUnit.findUnique({
    where: { id },
  });

  if (!unit) {
    notFound();
  }

  // Isolation multi-tenant stricte : un administrateur ne peut consulter ou modifier qu'une unité de son université
  if (user.roleCode !== "SUPER_ADMIN" && user.organizationId && unit.organizationId !== user.organizationId) {
    notFound();
  }

  const otherUnitsWhere: Record<string, unknown> = { id: { not: id } };
  if (user.roleCode !== "SUPER_ADMIN" && user.organizationId) {
    otherUnitsWhere.organizationId = user.organizationId;
  } else if (unit.organizationId) {
    otherUnitsWhere.organizationId = unit.organizationId;
  }

  const otherUnits = await prisma.organizationUnit.findMany({
    where: otherUnitsWhere,
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <Link
            href="/admin/organization"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للهيكل التنظيمي</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-teal-600" />
            <span>{unit.name}</span>
          </h1>
        </div>
      </div>

      <UnitDetailForm unit={unit} otherUnits={otherUnits} />
    </div>
  );
}
