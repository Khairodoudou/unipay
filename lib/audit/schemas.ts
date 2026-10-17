import { z } from "zod";

export const batchAuditRunSchema = z.object({
  batchId: z.string().min(1, "معرف الدفعة مطلوب"),
});

export const reviewFindingSchema = z.object({
  findingId: z.string().min(1, "معرف الملاحظة مطلوب"),
  note: z.string().max(500, "الملاحظة طويلة جداً").optional(),
});

export const confirmFindingSchema = z.object({
  findingId: z.string().min(1, "معرف الملاحظة مطلوب"),
  note: z.string().max(500, "الملاحظة طويلة جداً").optional(),
});

export const falsePositiveSchema = z.object({
  findingId: z.string().min(1, "معرف الملاحظة مطلوب"),
  note: z
    .string()
    .min(3, "يجب تقديم تبرير إداري صريح لاعتبار التنبيه إنذاراً خاطئاً")
    .max(500, "التبرير طويل جداً"),
});

export const resolveFindingSchema = z.object({
  findingId: z.string().min(1, "معرف الملاحظة مطلوب"),
  resolutionNote: z
    .string()
    .min(3, "يجب تحديد إجراء التسوية المتخذ")
    .max(500, "ملاحظة التسوية طويلة جداً"),
});

export const aiAnalysisRequestSchema = z.object({
  findingId: z.string().min(1, "معرف الملاحظة مطلوب"),
});
