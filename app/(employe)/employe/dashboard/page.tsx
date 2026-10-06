import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import { WorkspacePlaceholder } from "@/components/workspace/WorkspacePlaceholder";

export const metadata: Metadata = {
  title: "فضاء الموظف الشخصي — UNI-PAY",
  description: "الاطلاع على كشوف الراتب والشهادات لمنصة UNI-PAY",
};

export default async function EmployeDashboardPage() {
  const user = await requireRole("EMPLOYE");

  return (
    <WorkspacePlaceholder
      user={user}
      workspaceTitleAr="فضاء الموظف (Espace Employé)"
      roleIcon="employe"
    />
  );
}
