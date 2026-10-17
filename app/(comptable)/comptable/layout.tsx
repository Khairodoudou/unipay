import { ReactNode } from "react";
import { requireRole } from "@/lib/rbac/guards";
import { ComptableSidebar } from "@/components/comptable/layout/ComptableSidebar";
import { ComptableHeader } from "@/components/comptable/layout/ComptableHeader";

export default async function ComptableLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protection serveur : uniquement COMPTABLE ou ADMIN
  const user = await requireRole(["COMPTABLE", "ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans" dir="rtl">
      {/* Sidebar navigation */}
      <ComptableSidebar user={user} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <ComptableHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
