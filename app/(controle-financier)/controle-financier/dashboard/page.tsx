import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import { WorkspacePlaceholder } from "@/components/workspace/WorkspacePlaceholder";

export const metadata: Metadata = {
  title: "مساحة المراقب المالي — UNI-PAY",
  description: "فضاء التأشيرة المالية المسبقة والرقابة على النفقات لمنصة UNI-PAY",
};

export default async function ControleFinancierDashboardPage() {
  const user = await requireRole("CONTROLEUR_FINANCIER");

  return (
    <WorkspacePlaceholder
      user={user}
      workspaceTitleAr="مساحة المراقب المالي (Contrôle Financier)"
      roleIcon="controleur"
    />
  );
}
