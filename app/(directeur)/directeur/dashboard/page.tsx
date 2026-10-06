import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import { WorkspacePlaceholder } from "@/components/workspace/WorkspacePlaceholder";

export const metadata: Metadata = {
  title: "مساحة مدير الجامعة — UNI-PAY",
  description: "فضاء الاعتماد النهائي لمسيرات الرواتب لمنصة UNI-PAY",
};

export default async function DirecteurDashboardPage() {
  const user = await requireRole("DIRECTEUR");

  return (
    <WorkspacePlaceholder
      user={user}
      workspaceTitleAr="مساحة مدير الجامعة (Direction Générale)"
      roleIcon="directeur"
    />
  );
}
