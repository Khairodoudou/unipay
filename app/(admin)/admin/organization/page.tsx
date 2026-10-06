import type { Metadata } from "next";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { OrganizationProfileForm } from "@/components/admin/organization/OrganizationProfileForm";
import { OrganizationUnitsList } from "@/components/admin/organization/OrganizationUnitsList";
import { Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "الهيكل التنظيمي والمؤسسة — UNI-PAY",
  description: "بيانات المؤسسة الجامعية المركزية والوحدات الإدارية التابعة لها",
};

export default async function AdminOrganizationPage() {
  await requireRole("ADMIN");

  // Récupérer l'organisation principale
  let organization = await prisma.organization.findFirst({
    include: {
      units: {
        include: {
          parent: { select: { name: true } },
          children: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Si inexistante par sécurité
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: "جامعة الجزائر 1 — بن يوسف بن خدة",
        code: "UNIPAY-DZ",
        isActive: true,
      },
      include: {
        units: {
          include: {
            parent: { select: { name: true } },
            children: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-teal-600" />
            <span>المؤسسة والهيكل التنظيمي</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إعداد الهوية المؤسسية للجامعة وتنظيم الوحدات والكليات والمصالح الإدارية
          </p>
        </div>
      </div>

      {/* Main University Form */}
      <OrganizationProfileForm organization={organization} />

      {/* Internal Units / Faculties / Services */}
      <OrganizationUnitsList
        organizationId={organization.id}
        units={organization.units}
      />
    </div>
  );
}
