import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import { WorkspacePlaceholder } from "@/components/workspace/WorkspacePlaceholder";

export const metadata: Metadata = {
  title: "مساحة عون الموارد البشرية والأجور — UNI-PAY",
  description: "فضاء إعداد عناصر الأجور ومسيرات الرواتب لمنصة UNI-PAY",
};

export default async function AgentDashboardPage() {
  const user = await requireRole("AGENT_RH");

  return (
    <WorkspacePlaceholder
      user={user}
      workspaceTitleAr="مساحة عمل عون الموارد البشرية والأجور (RH / Paie)"
      roleIcon="agent"
    />
  );
}
