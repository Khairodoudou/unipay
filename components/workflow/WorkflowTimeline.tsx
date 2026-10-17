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
  const relevantActions = actions.filter((a) =>
    step.doneStatuses.includes(a.toStatus as never) ||
    step.activeStatuses.includes(a.toStatus as never)
  );
  return relevantActions[relevantActions.length - 1] ?? null;
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
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 border-2 border-teal-400">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  </span>
                )}
                {state === "active" && !isReturn && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-400 animate-pulse">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </span>
                )}
                {isReturn && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 border-2 border-red-400">
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
                      state === "done"   ? "text-teal-700"  :
                      state === "active" ? "text-amber-700" :
                      "text-slate-400"
                    }`}
                  >
                    {step.labelAr}
                  </span>
                  <span className="text-xs text-slate-400">{step.labelFr}</span>
                  {state === "done" && (
                    <span className="text-xs bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded">
                      مكتمل
                    </span>
                  )}
                  {state === "active" && !isReturn && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                      جاري
                    </span>
                  )}
                  {isReturn && (
                    <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                      مُعاد
                    </span>
                  )}
                </div>

                {!compact && lastAct && (
                  <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                    {lastAct.actor && (
                      <p>
                        {lastAct.actor.firstName} {lastAct.actor.lastName} •{" "}
                        {formatDate(lastAct.createdAt)}
                      </p>
                    )}
                    {lastAct.reason && (
                      <p className="text-red-600 font-medium">
                        السبب: {lastAct.reason}
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
