import type { Metadata } from "next";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { SettingsTabsForm } from "@/components/admin/settings/SettingsTabsForm";
import { Settings as SettingsIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "إعدادات النظام — UNI-PAY",
  description: "التحكم في الإعدادات العامة، سياسات الأمان وتفضيلات العرض",
};

export default async function AdminSettingsPage() {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const [systemSettings, universitySettings] = await Promise.all([
    prisma.systemSetting.findMany(),
    user.organizationId
      ? prisma.universitySetting.findMany({ where: { organizationId: user.organizationId } })
      : [],
  ]);

  const settingsMap = systemSettings.reduce<
    Record<string, { key: string; value: string; category: string; labelAr: string; descriptionAr: string | null }>
  >((acc, s) => {
    acc[s.key] = s;
    return acc;
  }, {});

  for (const uSetting of universitySettings) {
    if (settingsMap[uSetting.key]) {
      settingsMap[uSetting.key] = {
        ...settingsMap[uSetting.key],
        value: uSetting.value,
      };
    } else {
      settingsMap[uSetting.key] = {
        key: uSetting.key,
        value: uSetting.value,
        category: uSetting.category,
        labelAr: uSetting.key,
        descriptionAr: uSetting.descriptionAr,
      };
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-teal-600" />
            <span>إعدادات النظام والمنصة</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تهيئة الخيارات العامة، الأمان، والواجهة (مع الحفاظ على سرية المتغيرات البيئية)
          </p>
        </div>
      </div>

      <SettingsTabsForm settings={settingsMap} />
    </div>
  );
}
