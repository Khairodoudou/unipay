"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";
import { Decimal } from "@prisma/client/runtime/library";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface CalculationBlocker {
  employeeId: string;
  matricule: string;
  fullName: string;
  reason: string;
}

export interface CalculationSummary {
  totalEmployees: number;
  calculated: number;
  errors: number;
  totalGross: number;
  totalNet: number;
  blockers: CalculationBlocker[];
}

// ── RBAC Helper ─────────────────────────────────────────────────────────────────

async function verifyAgentCaller() {
  const caller = await getCurrentUser();
  if (!caller || !caller.isActive) throw new Error("غير مصرح.");
  if (!["ADMIN", "AGENT_RH"].includes(caller.roleCode)) {
    throw new Error("هذه العملية مخصصة لعون الموارد البشرية.");
  }
  return caller;
}

// ── Pre-flight validation ───────────────────────────────────────────────────────

async function validateBatchForCalculation(
  batchId: string
): Promise<{ valid: boolean; blockers: CalculationBlocker[] }> {
  const blockers: CalculationBlocker[] = [];

  // Get all batch employees with their profiles and attendance
  const batchEmployees = await prisma.batchEmployee.findMany({
    where: { batchId },
    include: {
      employee: true,
    },
  });

  if (batchEmployees.length === 0) {
    return {
      valid: false,
      blockers: [{ employeeId: "", matricule: "-", fullName: "-", reason: "لا يوجد موظفون في الدفعة" }],
    };
  }

  for (const be of batchEmployees) {
    const emp = be.employee;
    const fullName = `${emp.firstName} ${emp.lastName}`;

    // Check employee is active
    if (emp.status !== "ACTIVE") {
      blockers.push({
        employeeId: emp.id,
        matricule: emp.matricule,
        fullName,
        reason: "الموظف غير نشط أو موقوف",
      });
      continue;
    }

    // Check salary is positive
    if (!emp.baseSalary || new Decimal(emp.baseSalary).lessThanOrEqualTo(0)) {
      blockers.push({
        employeeId: emp.id,
        matricule: emp.matricule,
        fullName,
        reason: "الراتب الأساسي صفر أو غير محدد",
      });
      continue;
    }

    // Check attendance data exists
    const attendance = await prisma.attendanceRecord.findUnique({
      where: { batchId_employeeId: { batchId, employeeId: emp.id } },
    });
    if (!attendance) {
      blockers.push({
        employeeId: emp.id,
        matricule: emp.matricule,
        fullName,
        reason: "بيانات الحضور غير مُدخلة بعد",
      });
      continue;
    }

    // Validate attendance consistency
    const totalAbsences = new Decimal(attendance.absentDays)
      .plus(attendance.sickDays)
      .plus(attendance.vacationDays);
    if (totalAbsences.greaterThan(attendance.workingDays)) {
      blockers.push({
        employeeId: emp.id,
        matricule: emp.matricule,
        fullName,
        reason: "إجمالي أيام الغياب يتجاوز عدد أيام العمل",
      });
    }
  }

  return { valid: blockers.length === 0, blockers };
}

// ── Calculate one employee ──────────────────────────────────────────────────────

async function calculateEmployeePayroll(
  batchId: string,
  employeeId: string,
  payrollRules: Array<{ code: string; value: string; unit: string; category: string }>
): Promise<{
  grossAmount: Decimal;
  totalAllowances: Decimal;
  totalDeductions: Decimal;
  totalContributions: Decimal;
  totalTaxes: Decimal;
  netAmount: Decimal;
  calculationMeta: string;
}> {
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });
  const attendance = await prisma.attendanceRecord.findUniqueOrThrow({
    where: { batchId_employeeId: { batchId, employeeId } },
  });
  const lineItems = await prisma.payrollLineItem.findMany({
    where: { batchId, employeeId },
  });

  const baseSalary = new Decimal(employee.baseSalary);
  const workingDays = attendance.workingDays;
  const presentDays = new Decimal(attendance.presentDays);

  // Prorated base salary based on actual presence
  const proratedSalary = baseSalary.mul(presentDays).div(workingDays);

  // Manual allowances from line items
  const manualAllowances = lineItems
    .filter((li) => li.type === "ALLOWANCE" || li.type === "BONUS")
    .reduce((sum, li) => sum.plus(li.amount), new Decimal(0));

  const grossAmount = proratedSalary.plus(manualAllowances);

  // Manual deductions from line items
  const manualDeductions = lineItems
    .filter((li) => li.type === "DEDUCTION")
    .reduce((sum, li) => sum.plus(li.amount), new Decimal(0));

  // Contributions from configured rules (CNAS-type rules)
  let totalContributions = new Decimal(0);
  let totalTaxes = new Decimal(0);
  const rulesUsed: string[] = [];

  for (const rule of payrollRules) {
    if (!rule.value || rule.unit === "FORMULA") continue;

    const ruleValue = new Decimal(rule.value);
    let ruleAmount = new Decimal(0);

    if (rule.unit === "PERCENTAGE") {
      ruleAmount = grossAmount.mul(ruleValue).div(100);
    } else if (rule.unit === "FIXED_AMOUNT") {
      ruleAmount = ruleValue;
    } else if (rule.unit === "COEFFICIENT") {
      ruleAmount = grossAmount.mul(ruleValue);
    }

    if (ruleAmount.greaterThan(0)) {
      rulesUsed.push(rule.code);
      if (rule.category === "SOCIAL_CONTRIBUTION") {
        totalContributions = totalContributions.plus(ruleAmount);
        // Also create line item for traceability if not already exists
      } else if (rule.category === "TAX") {
        totalTaxes = totalTaxes.plus(ruleAmount);
      }
    }
  }

  // Total deductions = manual + contributions + taxes
  const totalDeductions = manualDeductions.plus(totalContributions).plus(totalTaxes);

  const netAmount = grossAmount.minus(totalDeductions).toDecimalPlaces(2);
  const finalNet = netAmount.lessThan(0) ? new Decimal(0) : netAmount;

  const calculationMeta = JSON.stringify({
    baseSalary: baseSalary.toString(),
    workingDays,
    presentDays: presentDays.toString(),
    proratedSalary: proratedSalary.toFixed(2),
    manualAllowances: manualAllowances.toFixed(2),
    manualDeductions: manualDeductions.toFixed(2),
    rulesApplied: rulesUsed,
    calculatedAt: new Date().toISOString(),
  });

  return {
    grossAmount: grossAmount.toDecimalPlaces(2),
    totalAllowances: manualAllowances.toDecimalPlaces(2),
    totalDeductions: totalDeductions.toDecimalPlaces(2),
    totalContributions: totalContributions.toDecimalPlaces(2),
    totalTaxes: totalTaxes.toDecimalPlaces(2),
    netAmount: finalNet,
    calculationMeta,
  };
}

// ── Main Calculate Action ───────────────────────────────────────────────────────

export async function calculateBatchAction(
  batchId: string
): Promise<ActionResult<CalculationSummary>> {
  try {
    const caller = await verifyAgentCaller();

    const batch = await prisma.payrollBatch.findUnique({
      where: { id: batchId },
      include: { period: true },
    });
    if (!batch) return { success: false, error: "الدفعة غير موجودة." };
    if (!["DRAFT", "CALCULATED", "RETURNED_FOR_CORRECTION"].includes(batch.status)) {
      return { success: false, error: `لا يمكن احتساب دفعة بحالة "${batch.status}".` };
    }

    // Pre-flight validation
    const { valid, blockers } = await validateBatchForCalculation(batchId);
    if (!valid) {
      return {
        success: false,
        error: "يوجد موانع تحول دون الاحتساب. راجع التفاصيل.",
        data: {
          totalEmployees: 0,
          calculated: 0,
          errors: blockers.length,
          totalGross: 0,
          totalNet: 0,
          blockers,
        },
      };
    }

    // Load active payroll rules with their latest versions
    const activeRules = await prisma.payrollRule.findMany({
      where: { isActive: true },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    const ruleConfigs = activeRules
      .filter((r) => r.versions.length > 0)
      .map((r) => ({
        code: r.code,
        value: r.versions[0].value,
        unit: r.versions[0].unit,
        category: r.category,
      }));

    // Mark batch as CALCULATING
    await prisma.payrollBatch.update({
      where: { id: batchId },
      data: { status: "CALCULATING" },
    });

    const batchEmployees = await prisma.batchEmployee.findMany({
      where: { batchId },
      include: { employee: true },
    });

    let calculated = 0;
    let errors = 0;
    let totalGross = new Decimal(0);
    let totalNet = new Decimal(0);

    for (const be of batchEmployees) {
      const emp = be.employee;
      try {
        const result = await calculateEmployeePayroll(batchId, emp.id, ruleConfigs);

        await prisma.payrollRecord.upsert({
          where: { batchId_employeeId: { batchId, employeeId: emp.id } },
          update: {
            snapshotMatricule: emp.matricule,
            snapshotName: `${emp.firstName} ${emp.lastName}`,
            snapshotGrade: emp.grade,
            snapshotBaseSalary: emp.baseSalary,
            grossAmount: result.grossAmount,
            totalAllowances: result.totalAllowances,
            totalDeductions: result.totalDeductions,
            totalContributions: result.totalContributions,
            totalTaxes: result.totalTaxes,
            netAmount: result.netAmount,
            calculationMeta: result.calculationMeta,
            status: "CALCULATED",
            errorMessage: null,
            calculatedAt: new Date(),
          },
          create: {
            batchId,
            employeeId: emp.id,
            snapshotMatricule: emp.matricule,
            snapshotName: `${emp.firstName} ${emp.lastName}`,
            snapshotGrade: emp.grade,
            snapshotBaseSalary: emp.baseSalary,
            grossAmount: result.grossAmount,
            totalAllowances: result.totalAllowances,
            totalDeductions: result.totalDeductions,
            totalContributions: result.totalContributions,
            totalTaxes: result.totalTaxes,
            netAmount: result.netAmount,
            calculationMeta: result.calculationMeta,
            status: "CALCULATED",
          },
        });

        totalGross = totalGross.plus(result.grossAmount);
        totalNet = totalNet.plus(result.netAmount);
        calculated++;
      } catch (calcError) {
        errors++;
        await prisma.payrollRecord.upsert({
          where: { batchId_employeeId: { batchId, employeeId: emp.id } },
          update: {
            status: "ERROR",
            errorMessage: calcError instanceof Error ? calcError.message : "خطأ في الاحتساب",
          },
          create: {
            batchId,
            employeeId: emp.id,
            snapshotMatricule: emp.matricule,
            snapshotName: `${emp.firstName} ${emp.lastName}`,
            snapshotGrade: emp.grade,
            snapshotBaseSalary: emp.baseSalary,
            status: "ERROR",
            errorMessage: calcError instanceof Error ? calcError.message : "خطأ في الاحتساب",
          },
        });
      }
    }

    // Update batch status
    const finalStatus = errors > 0 ? "DRAFT" : "CALCULATED";
    await prisma.payrollBatch.update({
      where: { id: batchId },
      data: {
        status: finalStatus,
        calculatedAt: new Date(),
      },
    });

    const summary: CalculationSummary = {
      totalEmployees: batchEmployees.length,
      calculated,
      errors,
      totalGross: parseFloat(totalGross.toFixed(2)),
      totalNet: parseFloat(totalNet.toFixed(2)),
      blockers: [],
    };

    await recordAuditLog({
      userId: caller.id,
      action: "PAYROLL_CALCULATED",
      resourceType: "PAYROLL_BATCH",
      resourceId: batchId,
      details: summary as unknown as Record<string, unknown>,
    });

    revalidatePath(`/agent/batches/${batchId}`);
    revalidatePath(`/agent/batches/${batchId}/calculate`);
    return { success: true, data: summary };
  } catch (error) {
    // Reset batch to DRAFT on unexpected error
    await prisma.payrollBatch.update({
      where: { id: batchId },
      data: { status: "DRAFT" },
    }).catch(() => {});

    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}

// ── Mark Batch as Ready For Review ─────────────────────────────────────────────

export async function markBatchReadyForReviewAction(
  batchId: string
): Promise<ActionResult> {
  try {
    const caller = await verifyAgentCaller();

    const batch = await prisma.payrollBatch.findUnique({ where: { id: batchId } });
    if (!batch) return { success: false, error: "الدفعة غير موجودة." };
    if (batch.status !== "CALCULATED") {
      return { success: false, error: "يجب أن تكون الدفعة في حالة 'محتسبة' قبل الإرسال للمراجعة." };
    }

    // Check no error records
    const errorRecords = await prisma.payrollRecord.count({
      where: { batchId, status: "ERROR" },
    });
    if (errorRecords > 0) {
      return {
        success: false,
        error: `يوجد ${errorRecords} سجل(ات) بأخطاء. يرجى تصحيحها أولاً.`,
      };
    }

    await prisma.payrollBatch.update({
      where: { id: batchId },
      data: { status: "READY_FOR_REVIEW" },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "PAYROLL_READY_FOR_REVIEW",
      resourceType: "PAYROLL_BATCH",
      resourceId: batchId,
      details: { batchLabel: batch.label, versionNumber: batch.versionNumber },
    });

    revalidatePath(`/agent/batches/${batchId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
  }
}
