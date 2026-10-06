import { z } from "zod";

export const createPayrollRuleSchema = z.object({
  code: z
    .string()
    .min(2, "الرمز التقني مطلوب")
    .regex(/^[A-Z0-9_]+$/, "الرمز يجب أن يحتوي على أحرف كبيرة وأرقام وشرطة سفلية فقط")
    .toUpperCase(),
  nameAr: z.string().min(2, "اسم القاعدة بالعربية مطلوب"),
  category: z.enum([
    "TAX",
    "SOCIAL_CONTRIBUTION",
    "ALLOWANCE",
    "BONUS",
    "BASE_INDEX",
    "OTHER",
  ]),
  descriptionAr: z.string().optional(),
  initialValue: z.string().min(1, "القيمة المرجعية مطلوبة"),
  unit: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "INDEX_POINTS", "COEFFICIENT", "FORMULA"]),
  effectiveFrom: z.string().min(1, "تاريخ سريان المفعول مطلوب"),
  notes: z.string().optional(),
});

export const createRuleVersionSchema = z.object({
  ruleId: z.string().min(1, "معرف القاعدة مطلوب"),
  value: z.string().min(1, "القيمة الجديدة مطلوبة"),
  unit: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "INDEX_POINTS", "COEFFICIENT", "FORMULA"]),
  effectiveFrom: z.string().min(1, "تاريخ بداية الأثر مطلوب"),
  effectiveTo: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type CreatePayrollRuleInput = z.infer<typeof createPayrollRuleSchema>;
export type CreateRuleVersionInput = z.infer<typeof createRuleVersionSchema>;
