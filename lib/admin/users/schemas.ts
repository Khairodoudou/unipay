import { z } from "zod";

export const userCreateSchema = z.object({
  firstName: z
    .string()
    .min(2, "الاسم الأول يجب أن يحتوي على حرفين على الأقل")
    .max(50, "الاسم الأول طويل جداً"),
  lastName: z
    .string()
    .min(2, "اللقب يجب أن يحتوي على حرفين على الأقل")
    .max(50, "اللقب طويل جداً"),
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة")
    .toLowerCase(),
  roleId: z.string().min(1, "يرجى تحديد الدور الوظيفي للمستخدم"),
  organizationId: z.string().min(1, "يرجى تحديد المؤسسة التابع لها"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن لا تقل عن 8 أحرف")
    .regex(/[A-Z]/, "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل")
    .regex(/[a-z]/, "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل"),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  userId: z.string().min(1, "معرف المستخدم مطلوب"),
  firstName: z
    .string()
    .min(2, "الاسم الأول يجب أن يحتوي على حرفين على الأقل")
    .max(50, "الاسم الأول طويل جداً"),
  lastName: z
    .string()
    .min(2, "اللقب يجب أن يحتوي على حرفين على الأقل")
    .max(50, "اللقب طويل جداً"),
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة")
    .toLowerCase(),
  roleId: z.string().min(1, "يرجى تحديد الدور الوظيفي للمستخدم"),
  organizationId: z.string().min(1, "يرجى تحديد المؤسسة"),
  isActive: z.boolean(),
});

export const userResetPasswordSchema = z.object({
  userId: z.string().min(1, "معرف المستخدم مطلوب"),
  newPassword: z
    .string()
    .min(8, "كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف")
    .regex(/[A-Z]/, "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل")
    .regex(/[a-z]/, "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل"),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserResetPasswordInput = z.infer<typeof userResetPasswordSchema>;
