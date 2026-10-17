import type { Metadata } from "next";
import { Bell } from "lucide-react";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { NotificationsList } from "@/components/employe/notifications/NotificationsList";

export const metadata: Metadata = {
  title: "الإشعارات والتنبيهات — فضاء الموظف — UNI-PAY",
  description: "سجل الإشعارات والتنبيهات الخاصة بالموظف لمنصة UNI-PAY",
};

export default async function EmployeNotificationsPage() {
  const user = await requireRole("EMPLOYE");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── EN-TÊTE DE LA PAGE ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>مركز الإشعارات والتنبيهات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            متابعة إشعارات إتاحة كشوف الراتب الشهرية والتحديثات الإدارية الموجهة إليك
          </p>
        </div>
      </div>

      {/* ── LISTE INTERACTIVE DES NOTIFICATIONS ────────────────────────────── */}
      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
