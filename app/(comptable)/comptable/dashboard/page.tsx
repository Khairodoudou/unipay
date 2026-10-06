import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import { WorkspacePlaceholder } from "@/components/workspace/WorkspacePlaceholder";

export const metadata: Metadata = {
  title: "مساحة المحاسب المالي — UNI-PAY",
  description: "فضاء التدقيق المحاسبي وأوامر الصرف لمنصة UNI-PAY",
};

export default async function ComptableDashboardPage() {
  const user = await requireRole("COMPTABLE");

  return (
    <WorkspacePlaceholder
      user={user}
      workspaceTitleAr="مساحة المحاسب المالي (Comptabilité)"
      roleIcon="comptable"
    />
  );
}
