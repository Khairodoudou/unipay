import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { UserFilterBar } from "@/components/admin/users/UserFilterBar";
import { AdminPagination } from "@/components/admin/common/AdminPagination";
import { UserPlus, Users as UsersIcon } from "lucide-react";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "إدارة المستخدمين — UNI-PAY",
  description: "قائمة مستخدمي منصة UNI-PAY، التحكم في الحسابات وتخصيص الأدوار",
};

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 10;

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.search?.trim();
  const roleCode = params.role?.trim();
  const status = params.status?.trim();
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // Construction dynamique du filtre Prisma
  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (roleCode) {
    where.role = { code: roleCode };
  }

  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  // Requêtes parallèles pour l'optimisation
  const [totalCount, users, roles] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
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
      select: { code: true, nameAr: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Sérialisation des dates pour le Client Component
  const formattedUsers = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UsersIcon className="w-6 h-6 text-teal-600" />
            <span>إدارة حسابات المستخدمين</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            دليل المستخدمين المؤسسيين، التفعيل والتعطيل، وتوزيع الأدوار الوظيفية
          </p>
        </div>

        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm focus-ring cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <UserFilterBar roles={roles} />

      {/* Table */}
      <UsersTable users={formattedUsers} />

      {/* Pagination */}
      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={PAGE_SIZE}
        basePath="/admin/users"
        searchParams={{
          search,
          role: roleCode,
          status,
        }}
      />
    </div>
  );
}
