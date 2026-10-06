import { ReactNode } from "react";
import { requireRole } from "@/lib/rbac/guards";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protection serveur stricte de toutes les sous-routes d'administration
  const user = await requireRole("ADMIN");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans" dir="rtl">
      {/* Sidebar institutionnelle RTL */}
      <AdminSidebar user={user} />

      {/* Zone de contenu principale */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
