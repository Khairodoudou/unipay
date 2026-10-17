import { ReactNode } from "react";
import { requireRole } from "@/lib/rbac/guards";
import { ControleurSidebar } from "@/components/controle-financier/layout/ControleurSidebar";
import { ControleurHeader } from "@/components/controle-financier/layout/ControleurHeader";

export default async function ControleurLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protection serveur : uniquement CONTROLEUR_FINANCIER ou ADMIN
  const user = await requireRole(["CONTROLEUR_FINANCIER", "ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans" dir="rtl">
      {/* Sidebar navigation */}
      <ControleurSidebar user={user} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <ControleurHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
