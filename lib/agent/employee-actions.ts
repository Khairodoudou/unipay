"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  employeeStatusSchema,
} from "./schemas";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

// ── RBAC Helper ─────────────────────────────────────────────────────────────────

async function verifyAgentCaller() {
  const caller = await getCurrentUser();
  if (!caller || !caller.isActive) {
    throw new Error("غير مصرح لك بتنفيذ هذه العملية.");
  }
  const allowed = ["ADMIN", "AGENT_RH"];
  if (!allowed.includes(caller.roleCode)) {
    throw new Error("هذه العملية مخصصة لعون الموارد البشرية فقط.");
  }
  return caller;
}

// ── Create Employee ─────────────────────────────────────────────────────────────

export async function createEmployeeAction(
  formData: FormData
): Promise<ActionResult<{ employeeId: string }>> {
  try {
    const caller = await verifyAgentCaller();

    const rawData = {
      matricule: formData.get("matricule")?.toString().trim().toUpperCase() || "",
      firstName: formData.get("firstName")?.toString().trim() || "",
      lastName: formData.get("lastName")?.toString().trim() || "",
      dateOfBirth: formData.get("dateOfBirth")?.toString().trim() || undefined,
      gender: formData.get("gender")?.toString().trim() || undefined,
      nationalId: formData.get("nationalId")?.toString().trim() || undefined,
      status: formData.get("status")?.toString().trim() || "ACTIVE",
      grade: formData.get("grade")?.toString().trim() || undefined,
      position: formData.get("position")?.toString().trim() || undefined,
      category: formData.get("category")?.toString().trim() || undefined,
      recruitmentDate: formData.get("recruitmentDate")?.toString().trim() || undefined,
      baseSalary: formData.get("baseSalary")?.toString().trim() || "0",
      index: formData.get("index")?.toString().trim() || undefined,
      rib: formData.get("rib")?.toString().trim() || undefined,
      bankName: formData.get("bankName")?.toString().trim() || undefined,
      phone: formData.get("phone")?.toString().trim() || undefined,
      email: formData.get("email")?.toString().trim() || undefined,
      address: formData.get("address")?.toString().trim() || undefined,
      organizationId: formData.get("organizationId")?.toString().trim() || "",
      organizationUnitId: formData.get("organizationUnitId")?.toString().trim() || undefined,
    };

    const parsed = employeeCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "خطأ في بيانات الإدخال" };
    }

    const data = parsed.data;

    // Check duplicate matricule
    const existing = await prisma.employee.findUnique({
      where: { matricule: data.matricule },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: `الرقم الوظيفي "${data.matricule}" مستخدم بالفعل.` };
    }

    const employee = await prisma.employee.create({
      data: {
        matricule: data.matricule,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        nationalId: data.nationalId || null,
        status: data.status,
        grade: data.grade || null,
        position: data.position || null,
        category: data.category || null,
        recruitmentDate: data.recruitmentDate ? new Date(data.recruitmentDate) : null,
        baseSalary: parseFloat(data.baseSalary),
        index: data.index ? parseInt(data.index) : null,
        rib: data.rib || null,
        bankName: data.bankName || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        organizationId: data.organizationId,
        organizationUnitId: data.organizationUnitId || null,
        createdBy: caller.id,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "EMPLOYEE_CREATED",
      resourceType: "EMPLOYEE",
      resourceId: employee.id,
      details: {
        matricule: employee.matricule,
        firstName: employee.firstName,
        lastName: employee.lastName,
        grade: employee.grade,
        baseSalary: employee.baseSalary.toString(),
      },
    });

    revalidatePath("/agent/employees");
    return { success: true, data: { employeeId: employee.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
    };
  }
}

// ── Update Employee ─────────────────────────────────────────────────────────────

export async function updateEmployeeAction(
  employeeId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const rawData = {
      firstName: formData.get("firstName")?.toString().trim(),
      lastName: formData.get("lastName")?.toString().trim(),
      dateOfBirth: formData.get("dateOfBirth")?.toString().trim() || undefined,
      gender: formData.get("gender")?.toString().trim() || undefined,
      nationalId: formData.get("nationalId")?.toString().trim() || undefined,
      grade: formData.get("grade")?.toString().trim() || undefined,
      position: formData.get("position")?.toString().trim() || undefined,
      category: formData.get("category")?.toString().trim() || undefined,
      recruitmentDate: formData.get("recruitmentDate")?.toString().trim() || undefined,
      baseSalary: formData.get("baseSalary")?.toString().trim(),
      index: formData.get("index")?.toString().trim() || undefined,
      rib: formData.get("rib")?.toString().trim() || undefined,
      bankName: formData.get("bankName")?.toString().trim() || undefined,
      phone: formData.get("phone")?.toString().trim() || undefined,
      email: formData.get("email")?.toString().trim() || undefined,
      address: formData.get("address")?.toString().trim() || undefined,
      organizationUnitId: formData.get("organizationUnitId")?.toString().trim() || undefined,
      reason: formData.get("reason")?.toString().trim() || "",
    };

    const parsed = employeeUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "خطأ في البيانات" };
    }

    const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!existing) return { success: false, error: "الموظف غير موجود." };

    const data = parsed.data;
    const reason = data.reason || "تعديل بواسطة عون الموارد البشرية";

    // Track salary / grade changes in history
    const historyItems: { field: string; oldValue: string | null; newValue: string }[] = [];

    if (data.baseSalary !== undefined && data.baseSalary !== existing.baseSalary.toString()) {
      historyItems.push({
        field: "baseSalary",
        oldValue: existing.baseSalary.toString(),
        newValue: data.baseSalary,
      });
    }
    if (data.grade !== undefined && data.grade !== existing.grade) {
      historyItems.push({
        field: "grade",
        oldValue: existing.grade,
        newValue: data.grade || "",
      });
    }
    if (data.position !== undefined && data.position !== existing.position) {
      historyItems.push({
        field: "position",
        oldValue: existing.position,
        newValue: data.position || "",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: {
          firstName: data.firstName ?? existing.firstName,
          lastName: data.lastName ?? existing.lastName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : existing.dateOfBirth,
          gender: data.gender ?? existing.gender,
          nationalId: data.nationalId ?? existing.nationalId,
          grade: data.grade ?? existing.grade,
          position: data.position ?? existing.position,
          category: data.category ?? existing.category,
          recruitmentDate: data.recruitmentDate
            ? new Date(data.recruitmentDate)
            : existing.recruitmentDate,
          baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : existing.baseSalary,
          index: data.index ? parseInt(data.index) : existing.index,
          rib: data.rib ?? existing.rib,
          bankName: data.bankName ?? existing.bankName,
          phone: data.phone ?? existing.phone,
          email: data.email ?? existing.email,
          address: data.address ?? existing.address,
          organizationUnitId: data.organizationUnitId ?? existing.organizationUnitId,
        },
      });

      for (const item of historyItems) {
        await tx.employeeHistory.create({
          data: {
            employeeId,
            field: item.field,
            oldValue: item.oldValue,
            newValue: item.newValue,
            changedBy: caller.id,
            reason,
          },
        });
      }
    });

    await recordAuditLog({
      userId: caller.id,
      action: "EMPLOYEE_UPDATED",
      resourceType: "EMPLOYEE",
      resourceId: employeeId,
      details: { changes: historyItems.length, reason },
    });

    revalidatePath(`/agent/employees/${employeeId}`);
    revalidatePath("/agent/employees");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
    };
  }
}

// ── Change Employee Status ──────────────────────────────────────────────────────

export async function changeEmployeeStatusAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const parsed = employeeStatusSchema.safeParse({
      employeeId: formData.get("employeeId"),
      status: formData.get("status"),
      reason: formData.get("reason"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "خطأ" };
    }

    const { employeeId, status, reason } = parsed.data;
    const existing = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true, matricule: true },
    });
    if (!existing) return { success: false, error: "الموظف غير موجود." };

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({ where: { id: employeeId }, data: { status } });
      await tx.employeeHistory.create({
        data: {
          employeeId,
          field: "status",
          oldValue: existing.status,
          newValue: status,
          changedBy: caller.id,
          reason,
        },
      });
    });

    await recordAuditLog({
      userId: caller.id,
      action: "EMPLOYEE_STATUS_CHANGED",
      resourceType: "EMPLOYEE",
      resourceId: employeeId,
      details: {
        matricule: existing.matricule,
        oldStatus: existing.status,
        newStatus: status,
        reason,
      },
    });

    revalidatePath(`/agent/employees/${employeeId}`);
    revalidatePath("/agent/employees");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
    };
  }
}

// ── Import Employees (Excel parsed client-side, validated & inserted server-side) ─

export interface ImportEmployeeRow {
  matricule: string;
  firstName: string;
  lastName: string;
  grade?: string;
  position?: string;
  category?: string;
  baseSalary: string;
  rib?: string;
  bankName?: string;
  recruitmentDate?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: { row: number; matricule: string; error: string }[];
}

export async function importEmployeesAction(
  rows: ImportEmployeeRow[],
  organizationId: string
): Promise<ImportResult> {
  try {
    const caller = await verifyAgentCaller();

    if (!rows || rows.length === 0) {
      return { success: false, imported: 0, errors: [{ row: 0, matricule: "", error: "لا توجد بيانات للاستيراد" }] };
    }

    const errors: { row: number; matricule: string; error: string }[] = [];
    let imported = 0;

    // Pre-validate all rows before any insert
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      if (!row.matricule) {
        errors.push({ row: rowNum, matricule: "-", error: "الرقم الوظيفي مطلوب" });
        continue;
      }
      if (!row.firstName || !row.lastName) {
        errors.push({ row: rowNum, matricule: row.matricule, error: "الاسم واللقب مطلوبان" });
        continue;
      }
      const salary = parseFloat(row.baseSalary);
      if (isNaN(salary) || salary < 0) {
        errors.push({ row: rowNum, matricule: row.matricule, error: "الراتب الأساسي غير صالح" });
        continue;
      }
    }

    if (errors.length > 0) {
      return { success: false, imported: 0, errors };
    }

    // Check duplicate matricules within the file
    const matricules = rows.map((r) => r.matricule.toUpperCase());
    const duplicatesInFile = matricules.filter((m, i) => matricules.indexOf(m) !== i);
    if (duplicatesInFile.length > 0) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, matricule: duplicatesInFile[0], error: `الرقم الوظيفي مكرر في الملف: ${duplicatesInFile[0]}` }],
      };
    }

    // Check existing in DB
    const existingEmployees = await prisma.employee.findMany({
      where: { matricule: { in: matricules } },
      select: { matricule: true },
    });
    if (existingEmployees.length > 0) {
      const existing = existingEmployees.map((e) => e.matricule);
      return {
        success: false,
        imported: 0,
        errors: existing.map((m) => ({
          row: rows.findIndex((r) => r.matricule.toUpperCase() === m) + 1,
          matricule: m,
          error: "الرقم الوظيفي موجود بالفعل في قاعدة البيانات",
        })),
      };
    }

    // Atomic transaction insert
    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.employee.create({
          data: {
            matricule: row.matricule.toUpperCase(),
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            grade: row.grade?.trim() || null,
            position: row.position?.trim() || null,
            category: (row.category?.toUpperCase() as "PERMANENT" | "CONTRACTUEL" | "VACATAIRE") || null,
            baseSalary: parseFloat(row.baseSalary),
            rib: row.rib?.trim() || null,
            bankName: row.bankName?.trim() || null,
            recruitmentDate: row.recruitmentDate ? new Date(row.recruitmentDate) : null,
            status: "ACTIVE",
            organizationId,
            createdBy: caller.id,
          },
        });
        imported++;
      }
    });

    await recordAuditLog({
      userId: caller.id,
      action: "EMPLOYEE_IMPORTED",
      resourceType: "EMPLOYEE",
      details: { importedCount: imported, organizationId },
    });

    revalidatePath("/agent/employees");
    return { success: true, imported, errors: [] };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [{ row: 0, matricule: "", error: error instanceof Error ? error.message : "خطأ غير متوقع" }],
    };
  }
}
