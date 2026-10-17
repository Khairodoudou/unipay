"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Check,
  ExternalLink,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/workflow/workflow-actions";

interface NotificationItem {
  id: string;
  type: string;
  titleAr: string;
  messageAr: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

interface NotificationsListProps {
  initialNotifications: NotificationItem[];
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    });
  };

  const filtered = notifications.filter((n) =>
    filter === "UNREAD" ? !n.isRead : true
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      {/* ── BARRE D'OUTILS & FILTRES ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === "ALL"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            كل التنبيهات ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("UNREAD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === "UNREAD"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            غير المقروءة ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      {/* ── LISTE DES NOTIFICATIONS ────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                !item.isRead ? "bg-blue-50/30" : "hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    item.type === "PAYSLIP_AVAILABLE"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.type === "PAYSLIP_AVAILABLE" ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm ${
                        !item.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"
                      }`}
                    >
                      {item.titleAr}
                    </h3>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {item.messageAr}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString("ar-DZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {item.link && (
                      <Link
                        href={item.link}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>الانتقال إلى الكشف</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!item.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(item.id)}
                  disabled={isPending}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                  title="تحديد كمقروء"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {filter === "UNREAD" ? "لا توجد تنبيهات جديدة غير مقروءة" : "لا توجد تنبيهات حالياً"}
          </h3>
          <p className="text-xs text-slate-500">
            ستصلك هنا إشعارات فور صدور كشوف الراتب الشهرية واعتمادها.
          </p>
        </div>
      )}
    </div>
  );
}
