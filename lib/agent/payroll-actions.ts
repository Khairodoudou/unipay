"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";
import {
  payrollPeriodCreateSchema,
  payrollPeriodStatusSchema,
  payrollBatchCreateSchema,
  attendanceRecordSchema,
  lineItemSchema,
} from "./schemas";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

const ARABIC_MONTHS = [
  "", "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// ── RBAC Helper ─────────────────────────────────────────────────────────────────

async function verifyAgentCaller() {
  const caller = await getCurrentUser();
  if (!caller || !caller.isActive) throw new Error("غير مصرح.");
  if (!["ADMIN", "AGENT_RH"].includes(caller.roleCode)) {
    throw new Error("هذه العملية مخصصة لعون الموارد البشرية.");
  }
  return caller;
}

// ── Payroll Period ──────────────────────────────────────────────────────────────

export async function createPayrollPeriodAction(
  formData: FormData
): Promise<ActionResult<{ periodId: string }>> {
  try {
    const caller = await verifyAgentCaller();

    const parsed = payrollPeriodCreateSchema.safeParse({
      year: formData.get("year"),
      month: formData.get("month"),
      label: formData.get("label"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "خطأ في البيانات" };
    }

    const { year, month, label } = parsed.data;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    const existing = await prisma.payrollPeriod.findUnique({
      where: { year_month: { year: yearNum, month: monthNum } },
    });
    if (existing) {
      return {
        success: false,
        error: `فترة الأجر ${ARABIC_MONTHS[monthNum]} ${yearNum} موجودة بالفعل.`,
      };
    }

    const period = await prisma.payrollPeriod.create({
      data: {
        year: yearNum,
        month: monthNum,
        label,
        status: "DRAFT",
        createdBy: caller.id,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "PAYROLL_PERIOD_CREATED",
      resourceType: "PAYROLL_PERIOD",
      resourceId: period.id,
      details: { year: yearNum, month: monthNum, label },
    });

    revalidatePath("/agent/payroll-periods");
    return { success: true, data: { periodId: period.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}

export async function changePayrollPeriodStatusAction(
  input: FormData | { periodId: string; status: string }
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const raw = input instanceof FormData
      ? { periodId: input.get("periodId"), status: input.get("status") }
      : input;

    const parsed = payrollPeriodStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "خطأ" };
    }

    const { periodId, status } = parsed.data;
    const period = await prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { success: false, error: "فترة الأجر غير موجودة." };

    await prisma.payrollPeriod.update({ where: { id: periodId }, data: { status } });

    await recordAuditLog({
      userId: caller.id,
      action: "PAYROLL_PERIOD_STATUS_CHANGED",
      resourceType: "PAYROLL_PERIOD",
      resourceId: periodId,
      details: { oldStatus: period.status, newStatus: status, label: period.label },
    });

    revalidatePath("/agent/payroll-periods");
    revalidatePath(`/agent/payroll-periods/${periodId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}

// ── Payroll Batch ───────────────────────────────────────────────────────────────

export async function createPayrollBatchAction(
  formData: FormData
): Promise<ActionResult<{ batchId: string }>> {
  try {
    const caller = await verifyAgentCaller();

    const parsed = payrollBatchCreateSchema.safeParse({
      periodId: formData.get("periodId"),
      label: formData.get("label"),
      notes: formData.get("notes"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "خطأ" };
    }

    const { periodId, label, notes } = parsed.data;

    const period = await prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { success: false, error: "فترة الأجر غير موجودة." };
    if (period.status === "CLOSED") {
      return { success: false, error: "لا يمكن إنشاء دفعة لفترة مغلقة." };
    }

    // Get next version number
    const lastBatch = await prisma.payrollBatch.findFirst({
      where: { periodId },
      orderBy: { versionNumber: "desc" },
    });
    const nextVersion = (lastBatch?.versionNumber ?? 0) + 1;

    const batch = await prisma.payrollBatch.create({
      data: {
        periodId,
        versionNumber: nextVersion,
        label: label || `دفعة v${nextVersion} — ${period.label}`,
        notes: notes || null,
        status: "DRAFT",
        createdBy: caller.id,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "PAYROLL_BATCH_CREATED",
      resourceType: "PAYROLL_BATCH",
      resourceId: batch.id,
      details: { periodId, versionNumber: nextVersion, label: batch.label },
    });

    revalidatePath(`/agent/payroll-periods/${periodId}`);
    return { success: true, data: { batchId: batch.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}

// ── Batch Employee Management ───────────────────────────────────────────────────

export async function addEmployeesToBatchAction(
  batchId: string,
  employeeIds: string[]
): Promise<ActionResult<{ added: number }>> {
  try {
    const caller = await verifyAgentCaller();

    const batch = await prisma.payrollBatch.findUnique({ where: { id: batchId } });
    if (!batch) return { success: false, error: "الدفعة غير موجودة." };
    if (!["DRAFT", "RETURNED_FOR_CORRECTION"].includes(batch.status)) {
      return { success: false, error: "لا يمكن تعديل الدفعة في حالتها الحالية." };
    }

    let added = 0;
    await prisma.$transaction(async (tx) => {
      for (const eid of employeeIds) {
        const existing = await tx.batchEmployee.findUnique({
          where: { batchId_employeeId: { batchId, employeeId: eid } },
        });
        if (!existing) {
          await tx.batchEmployee.create({
            data: { batchId, employeeId: eid, addedBy: caller.id },
          });
          added++;
        }
      }
    });

    await recordAuditLog({
      userId: caller.id,
      action: "PAYROLL_BATCH_EMPLOYEES_UPDATED",
      resourceType: "PAYROLL_BATCH",
      resourceId: batchId,
      details: { added, total: employeeIds.length },
    });

    revalidatePath(`/agent/batches/${batchId}`);
    return { success: true, data: { added } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}

export async function removeEmployeeFromBatchAction(
  batchId: string,
  employeeId: string
): Promise<ActionResult> {
  try {
    await verifyAgentCaller();

    const batch = await prisma.payrollBatch.findUnique({ where: { id: batchId } });
    if (!batch) return { success: false, error: "الدفعة غير موجودة." };
    if (!["DRAFT", "RETURNED_FOR_CORRECTION"].includes(batch.status)) {
      return { success: false, error: "لا يمكن تعديل الدفعة في حالتها الحالية." };
    }

    await prisma.batchEmployee.delete({
      where: { batchId_employeeId: { batchId, employeeId } },
    });

    revalidatePath(`/agent/batches/${batchId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}

// ── Attendance ──────────────────────────────────────────────────────────────────

export async function saveAttendanceAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const parsed = attendanceRecordSchema.safeParse({
      batchId: formData.get("batchId"),
      employeeId: formData.get("employeeId"),
      workingDays: formData.get("workingDays"),
      presentDays: formData.get("presentDays"),
      absentDays: formData.get("absentDays"),
      sickDays: formData.get("sickDays") || "0",
      vacationDays: formData.get("vacationDays") || "0",
      lateMinutes: formData.get("lateMinutes") || "0",
      notes: formData.get("notes"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "خطأ" };
    }

    const d = parsed.data;

    await prisma.attendanceRecord.upsert({
      where: { batchId_employeeId: { batchId: d.batchId, employeeId: d.employeeId } },
      update: {
        workingDays: parseInt(d.workingDays),
        presentDays: parseFloat(d.presentDays),
        absentDays: parseFloat(d.absentDays),
        sickDays: parseFloat(d.sickDays),
        vacationDays: parseFloat(d.vacationDays),
        lateMinutes: parseInt(d.lateMinutes),
        notes: d.notes || null,
        createdBy: caller.id,
      },
      create: {
        batchId: d.batchId,
        employeeId: d.employeeId,
        workingDays: parseInt(d.workingDays),
        presentDays: parseFloat(d.presentDays),
        absentDays: parseFloat(d.absentDays),
        sickDays: parseFloat(d.sickDays),
        vacationDays: parseFloat(d.vacationDays),
        lateMinutes: parseInt(d.lateMinutes),
        notes: d.notes || null,
        createdBy: caller.id,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "ATTENDANCE_UPDATED",
      resourceType: "PAYROLL_BATCH",
      resourceId: d.batchId,
      details: { employeeId: d.employeeId, presentDays: d.presentDays, absentDays: d.absentDays },
    });

    revalidatePath(`/agent/batches/${d.batchId}/attendance`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}

// ── Line Items (Indemnités / Retenues) ──────────────────────────────────────────

export async function addLineItemAction(
  formData: FormData
): Promise<ActionResult<{ itemId: string }>> {
  try {
    const caller = await verifyAgentCaller();

    const parsed = lineItemSchema.safeParse({
      batchId: formData.get("batchId"),
      employeeId: formData.get("employeeId"),
      type: formData.get("type"),
      code: formData.get("code"),
      labelAr: formData.get("labelAr"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "خطأ" };
    }

    const d = parsed.data;
    const item = await prisma.payrollLineItem.create({
      data: {
        batchId: d.batchId,
        employeeId: d.employeeId,
        type: d.type,
        code: d.code || null,
        labelAr: d.labelAr,
        amount: parseFloat(d.amount),
        isManual: true,
        notes: d.notes || null,
        createdBy: caller.id,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "LINE_ITEMS_UPDATED",
      resourceType: "PAYROLL_BATCH",
      resourceId: d.batchId,
      details: { employeeId: d.employeeId, type: d.type, amount: d.amount, labelAr: d.labelAr },
    });

    revalidatePath(`/agent/batches/${d.batchId}/indemnities`);
    return { success: true, data: { itemId: item.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}

export async function deleteLineItemAction(itemId: string): Promise<ActionResult> {
  try {
    await verifyAgentCaller();
    const item = await prisma.payrollLineItem.findUnique({ where: { id: itemId } });
    if (!item) return { success: false, error: "البند غير موجود." };

    await prisma.payrollLineItem.delete({ where: { id: itemId } });

    revalidatePath(`/agent/batches/${item.batchId}/indemnities`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}
