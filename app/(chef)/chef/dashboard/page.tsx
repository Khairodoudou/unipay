import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import { WorkspacePlaceholder } from "@/components/workspace/WorkspacePlaceholder";

export const metadata: Metadata = {
  title: "مساحة رئيس المصلحة — UNI-PAY",
  description: "فضاء تدقيق ومراجعة جداول الرواتب لمنصة UNI-PAY",
};

export default async function ChefDashboardPage() {
  const user = await requireRole("CHEF_SERVICE");

  return (
    <WorkspacePlaceholder
      user={user}
      workspaceTitleAr="مساحة رئيس المصلحة (Chef de Service)"
      roleIcon="chef"
    />
  );
}
