import { ReactNode } from "react";
import { requireRole } from "@/lib/rbac/guards";
import { ChefSidebar } from "@/components/chef/layout/ChefSidebar";
import { ChefHeader } from "@/components/chef/layout/ChefHeader";

export default async function ChefLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protection serveur : uniquement CHEF_SERVICE ou ADMIN
  const user = await requireRole(["CHEF_SERVICE", "ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans" dir="rtl">
      {/* Sidebar navigation */}
      <ChefSidebar user={user} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChefHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
