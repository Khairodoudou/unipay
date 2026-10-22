import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireSuperAdmin } from "@/lib/tenant/context";
import { UniversityEditForm } from "@/components/super-admin/universities/UniversityEditForm";
import { UniversityStatusControls } from "@/components/super-admin/universities/UniversityStatusControls";
import { UniversityAdminManager } from "@/components/super-admin/universities/UniversityAdminManager";
import { UniversityDeleteControls } from "@/components/super-admin/universities/UniversityDeleteControls";
import {
  Building2,
  ArrowRight,
  Users,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface UniversityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UniversityDetailPage(props: UniversityDetailPageProps) {
  await requireSuperAdmin();
  const { id } = await props.params;

  const university = await prisma.organization.findUnique({
    where: { id },
    include: {
      units: {
        orderBy: { createdAt: "asc" },
      },
      users: {
        where: {
          role: { code: "ADMIN" },
        },
        include: {
          role: true,
        },
        orderBy: { createdAt: "asc" },
      },
      batches: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          employees: true,
          units: true,
          batches: true,
          users: true,
        },
      },
    },
  });

  if (!university) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              href="/super-admin/universities"
              className="hover:text-indigo-600 transition-colors"
            >
              دليل الجامعات
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-800">{university.code}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {university.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <UniversityDeleteControls
            university={{
              id: university.id,
              code: university.code,
              name: university.name,
              wilaya: university.wilaya,
              counts: university._count,
            }}
            variant="button"
          />

          <Link
            href="/super-admin/universities"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للدليل</span>
          </Link>
        </div>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Users className="w-4 h-4 text-blue-500" />
            <span>الموظفون والأساتذة</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {university._count.employees}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>الكليات والوحدات</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {university._count.units}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-teal-500" />
            <span>مسيرات الرواتب</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {university._count.batches}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>المستخدمون الإجماليون</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {university._count.users}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Edit Metadata + Units List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                البيانات التعريفية للمؤسسة الجامعية
              </h2>
            </div>

            <UniversityEditForm
              university={{
                id: university.id,
                code: university.code,
                name: university.name,
                wilaya: university.wilaya || "الجزائر",
                address: university.address,
                phone: university.phone,
                email: university.email,
                website: university.website,
                description: university.description,
              }}
            />
          </div>

          {/* Organization Units & Faculties */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  الكليات، المعاهد، والوحدات الإدارية ({university.units.length})
                </h2>
              </div>
            </div>

            {university.units.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/70 rounded-xl">
                لا توجد كليات مسجلة بعد لهذه الجامعة.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {university.units.map((unit) => (
                  <div
                    key={unit.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {unit.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {unit.code} • {unit.type}
                      </p>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        unit.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {unit.isActive ? "نشط" : "معطل"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Status Controls + Assigned Admins */}
        <div className="space-y-6">
          {/* Status Controls */}
          <UniversityStatusControls
            university={{
              id: university.id,
              code: university.code,
              name: university.name,
              status: (university.status as "ACTIVE" | "SUSPENDED" | "ARCHIVED") || "ACTIVE",
              suspendedAt: university.suspendedAt,
              suspendedReason: university.suspendedReason,
              archivedAt: university.archivedAt,
              counts: university._count,
            }}
          />

          {/* Assigned Administrators */}
          <UniversityAdminManager
            universityId={university.id}
            universityName={university.name}
            admins={university.users.map((u) => ({
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              isActive: u.isActive,
              createdAt: u.createdAt,
              lastLoginAt: u.lastLoginAt,
            }))}
          />

          {/* Danger Zone: Permanent Deletion */}
          <UniversityDeleteControls
            university={{
              id: university.id,
              code: university.code,
              name: university.name,
              wilaya: university.wilaya,
              counts: university._count,
            }}
            variant="card"
          />
        </div>
      </div>
    </div>
  );
}
