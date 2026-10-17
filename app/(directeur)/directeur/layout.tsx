import { ReactNode } from "react";
import { requireRole } from "@/lib/rbac/guards";
import { DirecteurSidebar } from "@/components/directeur/layout/DirecteurSidebar";
import { DirecteurHeader } from "@/components/directeur/layout/DirecteurHeader";

export default async function DirecteurLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protection serveur : uniquement DIRECTEUR ou ADMIN
  const user = await requireRole(["DIRECTEUR", "ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans" dir="rtl">
      {/* Sidebar navigation */}
      <DirecteurSidebar user={user} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <DirecteurHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
