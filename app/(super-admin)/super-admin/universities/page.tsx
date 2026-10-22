import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireSuperAdmin } from "@/lib/tenant/context";
import { UniversityFilterBar } from "@/components/super-admin/universities/UniversityFilterBar";
import {
  Building2,
  PlusCircle,
  Users,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface UniversitiesPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    wilaya?: string;
  }>;
}

export default async function UniversitiesPage(props: UniversitiesPageProps) {
  await requireSuperAdmin();
  const searchParams = await props.searchParams;

  const q = searchParams.q?.trim() || "";
  const statusFilter = searchParams.status?.trim() || "";
  const wilayaFilter = searchParams.wilaya?.trim() || "";

  // Construction de la clause WHERE sécurisée
  const whereClause: Record<string, unknown> = {};

  if (q) {
    whereClause.OR = [
      { name: { contains: q } },
      { code: { contains: q } },
      { wilaya: { contains: q } },
    ];
  }

  if (statusFilter && ["ACTIVE", "SUSPENDED", "ARCHIVED"].includes(statusFilter)) {
    whereClause.status = statusFilter;
  }

  if (wilayaFilter && wilayaFilter !== "ALL") {
    whereClause.wilaya = wilayaFilter;
  }

  const [universities, totalCount] = await Promise.all([
    prisma.organization.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            employees: true,
            batches: true,
            units: true,
            users: true,
          },
        },
      },
    }),
    prisma.organization.count({ where: whereClause }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              دليل الجامعات والمؤسسات الجامعية
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة النطاقات المعزولة (Multi-Tenant)، اعتماد المؤسسات، ومتابعة النشاط المالي المؤسسي
          </p>
        </div>

        <Link
          href="/super-admin/universities/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all focus-ring shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>تسجيل جامعة جديدة</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <UniversityFilterBar />

      {/* Total matching badge */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          عرض <strong className="text-slate-900 font-bold">{universities.length}</strong> من إجمالي{" "}
          <strong className="text-slate-900 font-bold">{totalCount}</strong> مؤسسة
        </span>
      </div>

      {/* Grid of University Cards */}
      {universities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">لا توجد مؤسسات مطابقة لخيارات البحث</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            تأكد من كتابة اسم الجامعة أو الرمز المؤسسي بشكل صحيح أو قم بإعادة ضبط معايير التصفية.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {universities.map((uni) => (
            <div
              key={uni.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Card Header */}
                <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {uni.code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1.5 truncate group-hover:text-indigo-600 transition-colors">
                      {uni.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ولاية {uni.wilaya}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                      uni.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : uni.status === "SUSPENDED"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {uni.status === "ACTIVE"
                      ? "نشطة"
                      : uni.status === "SUSPENDED"
                      ? "معلقة"
                      : "مؤرشفة"}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="p-4 grid grid-cols-3 gap-2 bg-slate-50/60 border-b border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-semibold mb-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span>موظفون</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {uni._count.employees}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-semibold mb-1">
                      <Layers className="w-3 h-3 text-indigo-500" />
                      <span>كليات / وحدات</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {uni._count.units}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-semibold mb-1">
                      <FileSpreadsheet className="w-3 h-3 text-teal-500" />
                      <span>دفعات رواتب</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {uni._count.batches}
                    </p>
                  </div>
                </div>

                {/* Contact details */}
                <div className="p-4 space-y-1.5 text-xs text-slate-500">
                  {uni.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">{uni.email}</span>
                    </div>
                  )}
                  {uni.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]" dir="ltr">{uni.phone}</span>
                    </div>
                  )}
                  {uni.suspendedReason && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{uni.suspendedReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0">
                <Link
                  href={`/super-admin/universities/${uni.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-indigo-600 transition-colors focus-ring"
                >
                  <span>عرض التفاصيل والإدارة</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
