import { z } from "zod";

export const universityCreateSchema = z.object({
  name: z.string().min(3, "اسم الجامعة يجب أن يحتوي على 3 أحرف على الأقل"),
  code: z
    .string()
    .min(2, "الرمز المؤسسي يجب أن يحتوي على حرفين على الأقل")
    .regex(/^[A-Z0-9_\-]+$/, "الرمز المؤسسي يجب أن يتكون من حروف لاتينية كبيرة وأرقام فقط")
    .toUpperCase(),
  wilaya: z.string().min(2, "الولاية مطلوبة"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  website: z.string().url("رابط الموقع الإلكتروني غير صالح").optional().or(z.literal("")),
  description: z.string().optional(),
});

export const universityUpdateSchema = z.object({
  id: z.string().min(1, "معرف الجامعة مطلوب"),
  name: z.string().min(3, "اسم الجامعة يجب أن يحتوي على 3 أحرف على الأقل"),
  wilaya: z.string().min(2, "الولاية مطلوبة"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  website: z.string().url("رابط الموقع الإلكتروني غير صالح").optional().or(z.literal("")),
  description: z.string().optional(),
});

export const universityStatusSchema = z.object({
  id: z.string().min(1, "معرف الجامعة مطلوب"),
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
  reason: z.string().optional(),
});

export type UniversityCreateInput = z.infer<typeof universityCreateSchema>;
export type UniversityUpdateInput = z.infer<typeof universityUpdateSchema>;
export type UniversityStatusInput = z.infer<typeof universityStatusSchema>;
