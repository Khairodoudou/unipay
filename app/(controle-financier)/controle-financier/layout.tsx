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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans print:bg-white print:block" dir="rtl">
      {/* Sidebar navigation */}
      <div className="print:hidden">
        <ControleurSidebar user={user} />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full">
        <div className="print:hidden">
          <ControleurHeader user={user} />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:max-w-none print:p-0 print:m-0">
          {children}
        </main>
      </div>
    </div>
  );
}
