"use server";

import { z } from "zod";

// ── Employee Schemas ────────────────────────────────────────────────────────────

export const employeeCreateSchema = z.object({
  matricule: z
    .string()
    .min(3, "الرقم الوظيفي يجب أن يكون 3 أحرف على الأقل")
    .max(20, "الرقم الوظيفي لا يتجاوز 20 حرفاً")
    .regex(/^[A-Za-z0-9\-_]+$/, "الرقم الوظيفي: أحرف وأرقام وشرطة فقط"),
  firstName: z.string().min(2, "الاسم الأول مطلوب (2 أحرف على الأقل)").max(100),
  lastName: z.string().min(2, "اللقب مطلوب (2 أحرف على الأقل)").max(100),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(["M", "F"]).optional().nullable(),
  nationalId: z.string().max(20).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  grade: z.string().max(100).optional().nullable(),
  position: z.string().max(200).optional().nullable(),
  category: z.enum(["PERMANENT", "CONTRACTUEL", "VACATAIRE"]).optional().nullable(),
  recruitmentDate: z.string().optional().nullable(),
  baseSalary: z
    .string()
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0,
      "يرجى إدخال راتب صحيح (0 أو أكثر)"
    ),
  index: z.string().optional().nullable(),
  rib: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || /^[0-9]{20}$/.test(v.replace(/\s/g, "")),
      "RIB غير صالح (20 رقماً مطلوبة)"
    ),
  bankName: z.string().max(200).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().nullable().or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
  organizationId: z.string().min(1, "المؤسسة مطلوبة"),
  organizationUnitId: z.string().optional().nullable(),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;

export const employeeUpdateSchema = employeeCreateSchema
  .partial()
  .omit({ organizationId: true })
  .extend({
    reason: z.string().min(3, "سبب التعديل مطلوب (3 أحرف على الأقل)").max(500),
  });

export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

export const employeeStatusSchema = z.object({
  employeeId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  reason: z.string().min(3, "سبب تغيير الحالة مطلوب").max(500),
});

// ── Payroll Period Schemas ──────────────────────────────────────────────────────

export const payrollPeriodCreateSchema = z.object({
  year: z
    .string()
    .refine((v) => /^\d{4}$/.test(v) && parseInt(v) >= 2020 && parseInt(v) <= 2099, {
      message: "السنة يجب أن تكون بين 2020 و 2099",
    }),
  month: z
    .string()
    .refine((v) => /^\d{1,2}$/.test(v) && parseInt(v) >= 1 && parseInt(v) <= 12, {
      message: "الشهر يجب أن يكون بين 1 و 12",
    }),
  label: z.string().min(3, "التسمية مطلوبة").max(100),
});

export const payrollPeriodStatusSchema = z.object({
  periodId: z.string().min(1),
  status: z.enum(["DRAFT", "OPEN", "PROCESSING", "CLOSED"]),
});

// ── Payroll Batch Schemas ───────────────────────────────────────────────────────

export const payrollBatchCreateSchema = z.object({
  periodId: z.string().min(1, "فترة الأجر مطلوبة"),
  label: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const batchEmployeeAddSchema = z.object({
  batchId: z.string().min(1),
  employeeIds: z
    .string()
    .min(1)
    .transform((s) => s.split(",").map((id) => id.trim()).filter(Boolean)),
});

// ── Attendance Schemas ──────────────────────────────────────────────────────────

export const attendanceRecordSchema = z.object({
  batchId: z.string().min(1),
  employeeId: z.string().min(1),
  workingDays: z.string().refine((v) => !isNaN(parseInt(v)) && parseInt(v) > 0 && parseInt(v) <= 31, {
    message: "أيام العمل يجب أن تكون بين 1 و 31",
  }),
  presentDays: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "أيام الحضور يجب أن تكون 0 أو أكثر",
  }),
  absentDays: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "أيام الغياب يجب أن تكون 0 أو أكثر",
  }),
  sickDays: z.string().default("0").refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0),
  vacationDays: z.string().default("0").refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0),
  lateMinutes: z.string().default("0").refine((v) => !isNaN(parseInt(v)) && parseInt(v) >= 0),
  notes: z.string().max(500).optional().nullable(),
});

// ── PayrollLineItem Schemas ─────────────────────────────────────────────────────

export const lineItemSchema = z.object({
  batchId: z.string().min(1),
  employeeId: z.string().min(1),
  type: z.enum(["ALLOWANCE", "BONUS", "DEDUCTION", "CONTRIBUTION", "TAX"]),
  code: z.string().max(100).optional().nullable(),
  labelAr: z.string().min(2, "التسمية مطلوبة").max(200),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "المبلغ يجب أن يكون أكبر من 0",
  }),
  notes: z.string().max(500).optional().nullable(),
});
