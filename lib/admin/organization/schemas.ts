import { z } from "zod";

export const organizationUpdateSchema = z.object({
  id: z.string().min(1, "معرف المؤسسة مطلوب"),
  name: z.string().min(3, "اسم المؤسسة يجب أن يحتوي على 3 أحرف على الأقل"),
  address: z.string().optional(),
  wilaya: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  website: z.string().optional(),
  description: z.string().optional(),
});

export const organizationUnitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "اسم الوحدة الإدارية مطلوب"),
  code: z.string().min(2, "الرمز التقني للوحدة مطلوب").toUpperCase(),
  type: z.enum([
    "PRESIDENCY",
    "SECRETARIAT_GENERAL",
    "FACULTY",
    "DIRECTION",
    "SERVICE",
    "DEPARTMENT",
    "OTHER",
  ]),
  parentId: z.string().nullable().optional(),
  organizationId: z.string().min(1, "المؤسسة مطلوبة"),
  isActive: z.boolean().default(true),
});

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;
export type OrganizationUnitInput = z.infer<typeof organizationUnitSchema>;
