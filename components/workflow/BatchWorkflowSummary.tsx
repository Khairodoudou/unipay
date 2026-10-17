"use client";

/**
 * components/workflow/BatchWorkflowSummary.tsx
 * Historique des actions de validation / rejet sur le lot.
 */

import { CheckCircle2, RotateCcw, Send, User, Calendar, MessageSquare } from "lucide-react";
import { WORKFLOW_ACTION_LABELS, BATCH_STATUS_LABELS } from "@/lib/workflow/states";

export interface WorkflowActionItem {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  reason?: string | null;
  createdAt: Date | string;
  actor: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    role?: {
      code: string;
      nameAr: string;
    } | null;
  };
}

interface BatchWorkflowSummaryProps {
  actions: WorkflowActionItem[];
}

export function BatchWorkflowSummary({ actions }: BatchWorkflowSummaryProps) {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
        لا توجد إجراءات مسجلة في مسار المصادقة لهذا الجدول حتى الآن.
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVE") || action.includes("VALIDATE") || action.includes("VISA")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {WORKFLOW_ACTION_LABELS[action] || action}
        </span>
      );
    }
    if (action.includes("RETURN") || action.includes("REJECT")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <RotateCcw className="w-3.5 h-3.5" />
          {WORKFLOW_ACTION_LABELS[action] || action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Send className="w-3.5 h-3.5" />
        {WORKFLOW_ACTION_LABELS[action] || action}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          سجل قرارات مسار المصادقة (Audit Trail)
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
          {actions.length} إجراء
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {actions.map((act) => {
          const actorName = act.actor.firstName && act.actor.lastName
            ? `${act.actor.firstName} ${act.actor.lastName}`
            : act.actor.email;
          const roleName = act.actor.role?.nameAr || act.actor.role?.code || "مستخدم";
          const dateStr = new Date(act.createdAt).toLocaleString("ar-DZ", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={act.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getActionBadge(act.action)}
                  <span className="text-xs text-slate-400">
                    من: <span className="font-medium text-slate-600">{BATCH_STATUS_LABELS[act.fromStatus]?.ar || act.fromStatus}</span> إلى: <span className="font-medium text-slate-600">{BATCH_STATUS_LABELS[act.toStatus]?.ar || act.toStatus}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dateStr}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-900">{actorName}</span>
                <span className="text-slate-400">|</span>
                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-medium">
                  {roleName}
                </span>
              </div>

              {act.reason && (
                <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">ملاحظات / سبب الإعادة:</span>
                    <p className="whitespace-pre-line leading-relaxed">{act.reason}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
