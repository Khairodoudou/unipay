"use client";

/**
 * components/workflow/NotificationBell.tsx
 * Cloche interactive des notifications de workflow dans l'en-tête.
 */

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import {
  getUnreadNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/workflow/workflow-actions";

interface NotificationItem {
  id: string;
  type: string;
  titleAr: string;
  messageAr: string;
  link: string | null;
  createdAt: Date | string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        setLoading(true);
        const res = await getUnreadNotificationsAction();
        if (isMounted && res.success && res.data) {
          setNotifications(res.data);
        }
      } catch {
        // Ignorer l'erreur silencieusement en polling/init
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchNotifs();
    const interval = setInterval(() => {
      void fetchNotifs();
    }, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        setNotifications([]);
      }
    });
  };

  const count = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="التنبيهات"
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-right">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">التنبيهات والإشعارات</span>
                {count > 0 && (
                  <span className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full">
                    {count} جديدة
                  </span>
                )}
              </div>
              {count > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isPending}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {loading && notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                  جاري جلب الإشعارات...
                </div>
              ) : count === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                  لا توجد تنبيهات جديدة في الوقت الحالي.
                </div>
              ) : (
                notifications.map((n) => {
                  const dateStr = new Date(n.createdAt).toLocaleTimeString("ar-DZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={n.id}
                      className="p-3 hover:bg-slate-50/80 transition-colors flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {n.titleAr}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {dateStr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {n.messageAr}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => {
                              handleMarkAsRead(n.id);
                              setIsOpen(false);
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                          >
                            <span>الانتقال للمعاينة</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span />
                        )}
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-[11px] text-slate-400 hover:text-slate-700"
                        >
                          تحديد كمقروء
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
