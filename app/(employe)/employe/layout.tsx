import { ReactNode } from "react";
import { requireRole } from "@/lib/rbac/guards";
import { EmployeSidebar } from "@/components/employe/layout/EmployeSidebar";
import { EmployeHeader } from "@/components/employe/layout/EmployeHeader";

export default async function EmployeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole("EMPLOYE");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      {/* Sidebar (Desktop fixée, Mobile tiroir) */}
      <EmployeSidebar user={user} />

      {/* Main Content Area */}
      <div className="lg:ps-64 flex flex-col flex-1 min-w-0 transition-all">
        <EmployeHeader user={user} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
