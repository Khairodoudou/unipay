"use client";

/**
 * components/workflow/StatusBadge.tsx
 * Badge coloré affichant le statut d'un batch workflow.
 */

import { BATCH_STATUS_LABELS } from "@/lib/workflow/states";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

const COLOR_CLASSES: Record<string, string> = {
  gray:   "bg-gray-100 text-gray-700 border-gray-200",
  blue:   "bg-blue-100 text-blue-700 border-blue-200",
  cyan:   "bg-cyan-100 text-cyan-700 border-cyan-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  amber:  "bg-amber-100 text-amber-700 border-amber-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  teal:   "bg-teal-100 text-teal-700 border-teal-200",
  green:  "bg-green-100 text-green-700 border-green-200",
  red:    "bg-red-100 text-red-700 border-red-200",
};

const DOT_COLORS: Record<string, string> = {
  gray: "bg-gray-400", blue: "bg-blue-500", cyan: "bg-cyan-500",
  purple: "bg-purple-500", amber: "bg-amber-500", orange: "bg-orange-500",
  teal: "bg-teal-500", green: "bg-green-500", red: "bg-red-500",
};

const SIZE_CLASSES = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const info = BATCH_STATUS_LABELS[status] ?? { ar: status, fr: status, color: "gray" };
  const colorClass = COLOR_CLASSES[info.color] ?? COLOR_CLASSES.gray;
  const dotColor   = DOT_COLORS[info.color]   ?? DOT_COLORS.gray;
  const sizeClass  = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorClass} ${sizeClass}`}
      title={info.fr}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {info.ar}
    </span>
  );
}
