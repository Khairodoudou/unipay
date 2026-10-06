import { ReactNode } from "react";
import { requireRole } from "@/lib/rbac/guards";
import { AgentSidebar } from "@/components/agent/layout/AgentSidebar";
import { AgentHeader } from "@/components/agent/layout/AgentHeader";

export default async function AgentLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protection serveur : uniquement les rôles AGENT_RH ou ADMIN
  const user = await requireRole(["AGENT_RH", "ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans" dir="rtl">
      {/* Sidebar navigation */}
      <AgentSidebar user={user} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <AgentHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
