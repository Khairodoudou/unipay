"use client";

/**
 * components/workflow/WorkflowTimeline.tsx
 * Timeline institutionnelle du workflow — réutilisable dans les 4 espaces.
 */

import { CheckCircle2, Clock, Circle, AlertTriangle } from "lucide-react";
import { WORKFLOW_STEPS } from "@/lib/workflow/states";

interface WorkflowTimelineProps {
  currentStatus: string;
  workflowActions?: Array<{
    action: string;
    fromStatus: string;
    toStatus: string;
    reason?: string | null;
    createdAt: Date | string;
    actor?: { firstName: string; lastName: string; role?: { code: string } } | null;
  }>;
  compact?: boolean;
}

function getStepState(step: typeof WORKFLOW_STEPS[number], currentStatus: string) {
  if (step.doneStatuses.includes(currentStatus as never)) return "done";
  if (step.activeStatuses.includes(currentStatus as never)) return "active";
  return "pending";
}

function getActorForStep(
  step: typeof WORKFLOW_STEPS[number],
  actions: WorkflowTimelineProps["workflowActions"] = []
) {
  switch (step.key) {
    case "AGENT":
      return actions.find((a) => a.action === "SUBMIT_TO_CHEF" || a.toStatus === "CHEF_REVIEW" || a.actor?.role?.code === "AGENT_RH") ?? null;
    case "SMART_AUDIT":
      return null;
    case "CHEF":
      return actions.slice().reverse().find((a) =>
        ["APPROVE_CHEF", "RETURN_BY_CHEF", "TAKE_CHEF_REVIEW"].includes(a.action) ||
        a.fromStatus === "CHEF_REVIEW" ||
        a.toStatus === "APPROVED_BY_CHEF" ||
        a.actor?.role?.code === "CHEF_SERVICE"
      ) ?? null;
    case "DIRECTEUR":
      return actions.slice().reverse().find((a) =>
        ["APPROVE_DIRECTOR", "RETURN_BY_DIRECTOR", "TAKE_DIRECTOR_REVIEW"].includes(a.action) ||
        a.fromStatus === "DIRECTOR_REVIEW" ||
        a.toStatus === "APPROVED_BY_DIRECTOR" ||
        a.actor?.role?.code === "DIRECTEUR"
      ) ?? null;
    case "COMPTABLE":
      return actions.slice().reverse().find((a) =>
        ["VALIDATE_ACCOUNTING", "RETURN_BY_ACCOUNTING", "TAKE_ACCOUNTING_REVIEW"].includes(a.action) ||
        a.fromStatus === "ACCOUNTING_REVIEW" ||
        a.toStatus === "ACCOUNTING_VALIDATED" ||
        a.actor?.role?.code === "COMPTABLE"
      ) ?? null;
    case "CONTROLEUR":
      return actions.slice().reverse().find((a) =>
        ["GRANT_FINANCIAL_VISA", "RETURN_BY_FINANCIAL", "TAKE_FINANCIAL_CONTROL"].includes(a.action) ||
        a.fromStatus === "FINANCIAL_CONTROL" ||
        a.toStatus === "AUTHORIZED" ||
        a.actor?.role?.code === "CONTROLEUR_FINANCIER"
      ) ?? null;
    case "PAIEMENT":
      return actions.slice().reverse().find((a) =>
        ["START_PAYMENT_PROCESSING", "CONFIRM_PAYMENT", "CLOSE_BATCH"].includes(a.action) ||
        ["PAYMENT_PROCESSING", "PAID", "CLOSED"].includes(a.toStatus)
      ) ?? null;
    default:
      return null;
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WorkflowTimeline({
  currentStatus,
  workflowActions = [],
  compact = false,
}: WorkflowTimelineProps) {
  return (
    <div className="relative">
      <ol className={`space-y-0 ${compact ? "" : ""}`}>
        {WORKFLOW_STEPS.map((step, idx) => {
          const state    = getStepState(step, currentStatus);
          const lastAct  = getActorForStep(step, workflowActions);
          const isLast   = idx === WORKFLOW_STEPS.length - 1;
          const isReturn = currentStatus === "RETURNED_FOR_CORRECTION" && state === "active";

          return (
            <li key={step.key} className="flex gap-3 relative">
              {/* Ligne verticale */}
              {!isLast && (
                <div
                  className={`absolute right-[18px] top-9 bottom-0 w-0.5 ${
                    state === "done" ? "bg-teal-300" : "bg-slate-200"
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Icône état */}
              <div className="relative z-10 flex-shrink-0 mt-1">
                {state === "done" && !isReturn && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 border-2 border-teal-400 shadow-2xs">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  </span>
                )}
                {state === "active" && !isReturn && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-400 animate-pulse shadow-2xs">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </span>
                )}
                {isReturn && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 border-2 border-red-400 shadow-2xs">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </span>
                )}
                {state === "pending" && !isReturn && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border-2 border-slate-300">
                    <Circle className="h-5 w-5 text-slate-400" />
                  </span>
                )}
              </div>

              {/* Contenu */}
              <div className={`pb-6 flex-1 min-w-0 ${isLast ? "" : ""}`}>
                <div className="flex items-center flex-wrap gap-2">
                  <span
                    className={`font-semibold text-sm ${
                      state === "done"   ? "text-teal-700 font-bold" :
                      state === "active" ? "text-amber-700 font-bold" :
                      "text-slate-400"
                    }`}
                  >
                    {step.labelAr}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">({step.labelFr})</span>
                  {state === "done" && (
                    <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                      مكتمل
                    </span>
                  )}
                  {state === "active" && !isReturn && (
                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      قيد التنفيذ
                    </span>
                  )}
                  {isReturn && (
                    <span className="text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                      مُعاد للتصحيح
                    </span>
                  )}
                </div>

                {!compact && (
                  <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                    {step.key === "SMART_AUDIT" && state === "done" && (
                      <p className="text-teal-700 font-medium">
                        فحص آلي للقواعد الحسابية والمالية • نظامي ومطابق
                      </p>
                    )}
                    {lastAct && lastAct.actor && (
                      <p className="font-medium text-slate-600">
                        {lastAct.actor.firstName} {lastAct.actor.lastName} •{" "}
                        {formatDate(lastAct.createdAt)}
                      </p>
                    )}
                    {lastAct && lastAct.reason && (
                      <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded p-1.5 mt-1">
                        <strong>الملاحظات:</strong> {lastAct.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
