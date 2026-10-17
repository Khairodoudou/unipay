import prisma from "@/lib/db/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { FindingType, FindingSeverity } from "./types";

export interface CandidateFinding {
  batchId: string;
  employeeId?: string | null;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  detectedValue?: string | null;
  expectedValue?: string | null;
  source?: string;
  confidence?: number | null;
}

export interface AuditEngineResult {
  batchId: string;
  totalGenerated: number;
  criticalCount: number;
  highCount: number;
  warningCount: number;
  infoCount: number;
  findings: CandidateFinding[];
}

// Seuils techniques paramétrables (neutres, non juridiques)
export const AUDIT_THRESHOLDS = {
  SALARY_VARIATION_HIGH_PERCENT: 50,
  SALARY_VARIATION_WARN_PERCENT: 20,
  SALARY_VARIATION_MIN_DIFF_DZD: 5000,
  TOTAL_ALLOWANCES_RATIO_WARN: 1.5, // 150% du salaire de base
  MAX_ALLOWED_LINE_ITEM_AMOUNT: 5000000, // 5 millions DZD
  BATCH_TOTAL_VARIATION_HIGH_PERCENT: 25,
  BATCH_TOTAL_VARIATION_WARN_PERCENT: 15,
};

/**
 * Moteur d'audit déterministe (Rule-Based Audit Engine)
 * Analyse un Payroll Batch calculé et détecte les anomalies structurelles,
 * mathématiques, d'assiduité, de doublons et de variations.
 */
export async function executeAuditRules(batchId: string): Promise<AuditEngineResult> {
  const batch = await prisma.payrollBatch.findUnique({
    where: { id: batchId },
    include: {
      period: true,
      employees: {
        include: {
          employee: {
            include: { organizationUnit: true },
          },
        },
      },
      records: true,
      attendanceRecords: true,
      lineItems: true,
    },
  });

  if (!batch) {
    throw new Error(`الدفعة المعرفة بالرقم ${batchId} غير موجودة.`);
  }

  const candidates: CandidateFinding[] = [];

  // Indexation rapide des données de ce lot
  const recordsMap = new Map<string, (typeof batch.records)[0]>();
  for (const r of batch.records) {
    recordsMap.set(r.employeeId, r);
  }

  const attendanceMap = new Map<string, (typeof batch.attendanceRecords)[0]>();
  for (const a of batch.attendanceRecords) {
    attendanceMap.set(a.employeeId, a);
  }

  const lineItemsByEmp = new Map<string, (typeof batch.lineItems)>();
  for (const item of batch.lineItems) {
    const list = lineItemsByEmp.get(item.employeeId) || [];
    list.push(item);
    lineItemsByEmp.set(item.employeeId, list);
  }

  // Récupérer le lot de la période précédente pour les comparaisons historiques
  const previousPeriod = await prisma.payrollPeriod.findFirst({
    where:
      batch.period.month === 1
        ? { year: batch.period.year - 1, month: 12 }
        : { year: batch.period.year, month: batch.period.month - 1 },
    include: {
      batches: {
        where: { status: { in: ["CALCULATED", "READY_FOR_REVIEW", "CLOSED"] } },
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { records: true },
      },
    },
  });

  const prevBatch = previousPeriod?.batches[0];
  const prevRecordsMap = new Map<string, (typeof batch.records)[0]>();
  if (prevBatch) {
    for (const pr of prevBatch.records) {
      prevRecordsMap.set(pr.employeeId, pr);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RÈGLE G : PAYROLL_TOTAL_VARIATION (Variation globale du lot)
  // ─────────────────────────────────────────────────────────────────────────────
  if (prevBatch && prevBatch.records.length > 0 && batch.records.length > 0) {
    const currentTotalNet = batch.records.reduce((sum, r) => sum.plus(r.netAmount), new Decimal(0));
    const prevTotalNet = prevBatch.records.reduce((sum, r) => sum.plus(r.netAmount), new Decimal(0));

    if (prevTotalNet.greaterThan(0)) {
      const diff = currentTotalNet.minus(prevTotalNet);
      const percent = diff.div(prevTotalNet).mul(100).toNumber();
      const absPercent = Math.abs(percent);

      if (absPercent >= AUDIT_THRESHOLDS.BATCH_TOTAL_VARIATION_HIGH_PERCENT) {
        candidates.push({
          batchId: batch.id,
          employeeId: null,
          type: "PAYROLL_TOTAL_VARIATION",
          severity: "HIGH",
          title: "تباين حاد في الكتلة الإجمالية لصافي رواتب الدفعة",
          description: `الكتلة الإجمالية لصافي الرواتب تغيرت بنسبة ${percent.toFixed(
            1
          )}% مقارنة بالفترة السابقة (${prevTotalNet.toFixed(2)} دج ➜ ${currentTotalNet.toFixed(2)} دج).`,
          detectedValue: `${currentTotalNet.toFixed(2)} دج (${percent > 0 ? "+" : ""}${percent.toFixed(1)}%)`,
          expectedValue: `مقارنة بـ ${prevTotalNet.toFixed(2)} دج`,
          source: "RULE_ENGINE",
          confidence: 0.95,
        });
      } else if (absPercent >= AUDIT_THRESHOLDS.BATCH_TOTAL_VARIATION_WARN_PERCENT) {
        candidates.push({
          batchId: batch.id,
          employeeId: null,
          type: "PAYROLL_TOTAL_VARIATION",
          severity: "WARNING",
          title: "تغير ملحوظ في الكتلة الإجمالية للدفعة",
          description: `الكتلة الإجمالية للدفعة سجلت تبايناً بنسبة ${percent.toFixed(
            1
          )}% (${prevTotalNet.toFixed(2)} دج ➜ ${currentTotalNet.toFixed(2)} دج).`,
          detectedValue: `${currentTotalNet.toFixed(2)} دج`,
          expectedValue: `مقارنة بـ ${prevTotalNet.toFixed(2)} دج`,
          source: "RULE_ENGINE",
          confidence: 0.9,
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RÈGLE F : DUPLICATE_EMPLOYEE (Détection de doublons d'identité ou RIB)
  // ─────────────────────────────────────────────────────────────────────────────
  const seenCINs = new Map<string, { id: string; matricule: string; name: string }>();
  const seenRIBs = new Map<string, { id: string; matricule: string; name: string }>();
  const seenEmails = new Map<string, { id: string; matricule: string; name: string }>();

  for (const be of batch.employees) {
    const emp = be.employee;
    const name = `${emp.firstName} ${emp.lastName}`;

    // Doublon CIN
    if (emp.nationalId && emp.nationalId.trim().length > 3) {
      const cinKey = emp.nationalId.trim();
      const prev = seenCINs.get(cinKey);
      if (prev && prev.id !== emp.id) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "DUPLICATE_EMPLOYEE",
          severity: "CRITICAL",
          title: "تطابق في رقم التعريف الوطني (CIN) مع موظف آخر",
          description: `الموظف ${name} (${emp.matricule}) يشترك في نفس رقم الهوية الوطنية (${cinKey}) مع الموظف ${prev.name} (${prev.matricule}).`,
          detectedValue: cinKey,
          expectedValue: "رقم تعريف وطني فريد لكل موظف",
          source: "RULE_ENGINE",
          confidence: 1.0,
        });
      } else {
        seenCINs.set(cinKey, { id: emp.id, matricule: emp.matricule, name });
      }
    }

    // Doublon RIB
    if (emp.rib && emp.rib.trim().length > 5) {
      const ribKey = emp.rib.trim();
      const prev = seenRIBs.get(ribKey);
      if (prev && prev.id !== emp.id) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "DUPLICATE_EMPLOYEE",
          severity: "CRITICAL",
          title: "تطابق في الحساب البنكي (RIB) مع موظف آخر",
          description: `الحساب البنكي ${ribKey} مسجل لكل من ${name} (${emp.matricule}) و ${prev.name} (${prev.matricule}).`,
          detectedValue: ribKey,
          expectedValue: "حساب بنكي فريد لكل مستفيد",
          source: "RULE_ENGINE",
          confidence: 1.0,
        });
      } else {
        seenRIBs.set(ribKey, { id: emp.id, matricule: emp.matricule, name });
      }
    }

    // Doublon Email
    if (emp.email && emp.email.trim().length > 3) {
      const emailKey = emp.email.trim().toLowerCase();
      const prev = seenEmails.get(emailKey);
      if (prev && prev.id !== emp.id) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "DUPLICATE_EMPLOYEE",
          severity: "HIGH",
          title: "تطابق في البريد الإلكتروني مع موظف آخر",
          description: `البريد الإلكتروني (${emailKey}) مشترك بين ${name} و ${prev.name}.`,
          detectedValue: emailKey,
          expectedValue: "بريد مهني فريد",
          source: "RULE_ENGINE",
          confidence: 0.95,
        });
      } else {
        seenEmails.set(emailKey, { id: emp.id, matricule: emp.matricule, name });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYSE INDIVIDUELLE PAR EMPLOYÉ
  // ─────────────────────────────────────────────────────────────────────────────
  for (const be of batch.employees) {
    const emp = be.employee;
    const empName = `${emp.firstName} ${emp.lastName}`;
    const record = recordsMap.get(emp.id);
    const attendance = attendanceMap.get(emp.id);
    const empLineItems = lineItemsByEmp.get(emp.id) || [];
    const baseSalaryNum = Number(emp.baseSalary);

    // ── RÈGLE B : MISSING_DATA ─────────────────────────────────────────────────
    if (!emp.grade || emp.grade.trim() === "") {
      candidates.push({
        batchId: batch.id,
        employeeId: emp.id,
        type: "MISSING_DATA",
        severity: "WARNING",
        title: "الرتبة الوظيفية غير محددة",
        description: `ملف الموظف ${empName} (${emp.matricule}) لا يتضمن رتبة وظيفية محددة.`,
        detectedValue: "فارغ",
        expectedValue: "رتبة معتمدة (مثل: أستاذ مساعد، متصرف)",
        source: "RULE_ENGINE",
        confidence: 1.0,
      });
    }

    if (!emp.baseSalary || baseSalaryNum <= 0) {
      candidates.push({
        batchId: batch.id,
        employeeId: emp.id,
        type: "MISSING_DATA",
        severity: "CRITICAL",
        title: "الراتب الأساسي مفقود أو مساوي للصفر",
        description: `الراتب الأساسي للموظف ${empName} هو 0 دج أو غير مسجل. لا يمكن صرف الراتب بدون راتب أساسي قانوني.`,
        detectedValue: `${baseSalaryNum} دج`,
        expectedValue: "> 0 دج",
        source: "RULE_ENGINE",
        confidence: 1.0,
      });
    }

    if (!emp.rib || emp.rib.trim().length < 10) {
      candidates.push({
        batchId: batch.id,
        employeeId: emp.id,
        type: "RIB_DATA_ANOMALY",
        severity: "HIGH",
        title: "رقم الحساب البنكي (RIB) ناقص أو غير مسجل",
        description: `الموظف ${empName} لا يمتلك حساباً بنكياً صالحاً (RIB) لتحويل الراتب.`,
        detectedValue: emp.rib ? `${emp.rib} (غير مكتمل)` : "غير متوفر",
        expectedValue: "معرف بنكي ساري المفعول",
        source: "RULE_ENGINE",
        confidence: 0.98,
      });
    }

    if (!emp.nationalId || emp.nationalId.trim() === "") {
      candidates.push({
        batchId: batch.id,
        employeeId: emp.id,
        type: "MISSING_DATA",
        severity: "WARNING",
        title: "رقم التعريف الوطني (CIN) غير مسجل",
        description: `ملف الموظف ${empName} يفتقر لرقم الهوية الوطنية اللازم للمطابقات الرقابية.`,
        detectedValue: "غير متوفر",
        expectedValue: "رقم الهوية الوطنية (CIN)",
        source: "RULE_ENGINE",
        confidence: 1.0,
      });
    }

    // ── RÈGLE C & D : ATTENDANCE_ANOMALY & INVALID_VALUE ───────────────────────
    if (!attendance) {
      candidates.push({
        batchId: batch.id,
        employeeId: emp.id,
        type: "MISSING_DATA",
        severity: "CRITICAL",
        title: "غياب سجل الحضور والغيابات للشهر",
        description: `لم يتم إدخال بيانات حضور الموظف ${empName} لهذا الشهر.`,
        detectedValue: "مفقود",
        expectedValue: "سجل حضور معتمد",
        source: "RULE_ENGINE",
        confidence: 1.0,
      });
    } else {
      const workingDays = attendance.workingDays;
      const presentDays = Number(attendance.presentDays);
      const absentDays = Number(attendance.absentDays);
      const sickDays = Number(attendance.sickDays);
      const vacationDays = Number(attendance.vacationDays);
      const totalAbsences = absentDays + sickDays + vacationDays;

      // Valeurs négatives ou illogiques
      if (workingDays <= 0 || presentDays < 0 || absentDays < 0) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "INVALID_VALUE",
          severity: "CRITICAL",
          title: "قيم سالبة أو غير مقبولة في سجل الحضور",
          description: `سجل حضور الموظف ${empName} يحتوي على قيم سالبة أو أيام عمل منعدمة (أيام العمل: ${workingDays}).`,
          detectedValue: `عمل: ${workingDays}, حضور: ${presentDays}, غياب: ${absentDays}`,
          expectedValue: "أيام عمل > 0 وأيام حضور/غياب موجبة",
          source: "RULE_ENGINE",
          confidence: 1.0,
        });
      }

      // Présence supérieure au nombre de jours ouvrables
      if (presentDays > workingDays) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "INVALID_VALUE",
          severity: "CRITICAL",
          title: "أيام الحضور الفعلية تتجاوز عدد أيام العمل للشهر",
          description: `تم تسجيل ${presentDays} يوم حضور للموظف ${empName} بينما أيام العمل للشهر هي ${workingDays} يوماً.`,
          detectedValue: `${presentDays} يوماً`,
          expectedValue: `≤ ${workingDays} يوماً`,
          source: "RULE_ENGINE",
          confidence: 1.0,
        });
      }

      // Total des absences supérieur aux jours de travail
      if (totalAbsences > workingDays) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "ATTENDANCE_ANOMALY",
          severity: "CRITICAL",
          title: "مجموع أيام الغياب والعطل يتجاوز أيام العمل",
          description: `إجمالي الغياب والعطل (${totalAbsences} يوماً) يتجاوز سقف أيام الشهر (${workingDays} يوماً).`,
          detectedValue: `${totalAbsences} يوماً`,
          expectedValue: `≤ ${workingDays} يوماً`,
          source: "RULE_ENGINE",
          confidence: 1.0,
        });
      }

      // Absence complète du mois (0 jours de présence)
      if (presentDays === 0 && workingDays > 0) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "ATTENDANCE_ANOMALY",
          severity: "HIGH",
          title: "غياب كلي عن العمل طيلة الشهر (0 يوم حضور)",
          description: `الموظف ${empName} لم يسجل أي يوم حضور فعلي خلال الشهر (${workingDays} يوم عمل). يرجى مراجعة سبب الانقطاع.`,
          detectedValue: "0 يوم حضور",
          expectedValue: "> 0 يوم حضور (أو تجميد الراتب)",
          source: "RULE_ENGINE",
          confidence: 0.95,
        });
      }
    }

    // ── RÈGLE E : ALLOWANCE_ANOMALY & INVALID_VALUE ───────────────────────────
    let totalEmpAllowances = new Decimal(0);
    const seenLineItemCodes = new Set<string>();

    for (const item of empLineItems) {
      const itemAmount = Number(item.amount);

      if (item.type === "ALLOWANCE" || item.type === "BONUS") {
        totalEmpAllowances = totalEmpAllowances.plus(item.amount);
      }

      if (itemAmount <= 0) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "INVALID_VALUE",
          severity: "WARNING",
          title: "بند منحة أو خصم بقيمة صفر أو سالبة",
          description: `البند "${item.labelAr}" مسجل بمبلغ ${itemAmount} دج للموظف ${empName}.`,
          detectedValue: `${itemAmount} دج`,
          expectedValue: "> 0 دج",
          source: "RULE_ENGINE",
          confidence: 1.0,
        });
      }

      if (itemAmount > AUDIT_THRESHOLDS.MAX_ALLOWED_LINE_ITEM_AMOUNT) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "INVALID_VALUE",
          severity: "CRITICAL",
          title: "مبلغ البند يتجاوز الحد المعقول (أكثر من 5 ملايين دج)",
          description: `البند "${item.labelAr}" مسجل بمبلغ استثنائي قدره ${itemAmount.toLocaleString()} دج.`,
          detectedValue: `${itemAmount.toLocaleString()} دج`,
          expectedValue: `≤ ${AUDIT_THRESHOLDS.MAX_ALLOWED_LINE_ITEM_AMOUNT.toLocaleString()} دج`,
          source: "RULE_ENGINE",
          confidence: 1.0,
        });
      }

      // Détection de doublons de lignes identiques
      if (item.code) {
        if (seenLineItemCodes.has(item.code)) {
          candidates.push({
            batchId: batch.id,
            employeeId: emp.id,
            type: "ALLOWANCE_ANOMALY",
            severity: "WARNING",
            title: `تكرار محتمل لبند التعويض (${item.code})`,
            description: `تم إدراج البند (${item.labelAr}) أكثر من مرة لنفس الموظف ${empName}.`,
            detectedValue: `بند مكرر (${item.code})`,
            expectedValue: "بند واحد لنفس الرمز في الشهر",
            source: "RULE_ENGINE",
            confidence: 0.9,
          });
        } else {
          seenLineItemCodes.add(item.code);
        }
      }
    }

    // Ratio des indemnités par rapport au salaire de base
    if (baseSalaryNum > 0 && totalEmpAllowances.toNumber() > baseSalaryNum * AUDIT_THRESHOLDS.TOTAL_ALLOWANCES_RATIO_WARN) {
      candidates.push({
        batchId: batch.id,
        employeeId: emp.id,
        type: "ALLOWANCE_ANOMALY",
        severity: "WARNING",
        title: "مجموع المنح يتجاوز 150% من الراتب الأساسي",
        description: `مجموع المنح والتعويضات (${totalEmpAllowances.toFixed(
          2
        )} دج) يتجاوز بكثير الراتب الأساسي للموظف (${baseSalaryNum} دج).`,
        detectedValue: `${totalEmpAllowances.toFixed(2)} دج`,
        expectedValue: `أقل من ${(baseSalaryNum * AUDIT_THRESHOLDS.TOTAL_ALLOWANCES_RATIO_WARN).toFixed(2)} دج`,
        source: "RULE_ENGINE",
        confidence: 0.85,
      });
    }

    // ── RÈGLE A : SALARY_VARIATION ─────────────────────────────────────────────
    if (record) {
      const netAmountNum = Number(record.netAmount);

      // Valeur nette négative
      if (netAmountNum < 0) {
        candidates.push({
          batchId: batch.id,
          employeeId: emp.id,
          type: "INVALID_VALUE",
          severity: "CRITICAL",
          title: "صافي الراتب سالب غير مقبول",
          description: `نتيجة احتساب الراتب للموظف ${empName} أسفرت عن صافي سالب (${netAmountNum} دج).`,
          detectedValue: `${netAmountNum} دج`,
          expectedValue: "≥ 0 دج",
          source: "RULE_ENGINE",
          confidence: 1.0,
        });
      }

      // Comparaison avec le mois précédent (ou dernier lot calculé de l'employé)
      let prevRecord = prevRecordsMap.get(emp.id);
      if (!prevRecord) {
        const anyPrev = await prisma.payrollRecord.findFirst({
          where: {
            employeeId: emp.id,
            batchId: { not: batch.id },
            status: "CALCULATED",
          },
          orderBy: { calculatedAt: "desc" },
        });
        if (anyPrev) prevRecord = anyPrev;
      }

      if (prevRecord) {
        const prevNet = Number(prevRecord.netAmount);
        if (prevNet > 0) {
          const diff = Math.abs(netAmountNum - prevNet);
          const percent = (diff / prevNet) * 100;

          if (
            percent >= AUDIT_THRESHOLDS.SALARY_VARIATION_HIGH_PERCENT &&
            diff >= AUDIT_THRESHOLDS.SALARY_VARIATION_MIN_DIFF_DZD
          ) {
            candidates.push({
              batchId: batch.id,
              employeeId: emp.id,
              type: "SALARY_VARIATION",
              severity: "HIGH",
              title: "تغير حاد في صافي الراتب مقارنة بالشهر السابق (> 50%)",
              description: `صافي الراتب للموظف ${empName} تغير بنسبة ${percent.toFixed(
                1
              )}% (${prevNet.toLocaleString()} دج ➜ ${netAmountNum.toLocaleString()} دج، بفارق ${diff.toLocaleString()} دج).`,
              detectedValue: `${netAmountNum.toLocaleString()} دج (${percent.toFixed(1)}%)`,
              expectedValue: `${prevNet.toLocaleString()} دج`,
              source: "RULE_ENGINE",
              confidence: 0.95,
            });
          } else if (
            percent >= AUDIT_THRESHOLDS.SALARY_VARIATION_WARN_PERCENT &&
            diff >= AUDIT_THRESHOLDS.SALARY_VARIATION_MIN_DIFF_DZD
          ) {
            candidates.push({
              batchId: batch.id,
              employeeId: emp.id,
              type: "SALARY_VARIATION",
              severity: "WARNING",
              title: "تغير لافت في صافي الراتب (> 20%)",
              description: `صافي الراتب للموظف ${empName} تباين بنسبة ${percent.toFixed(
                1
              )}% مقارنة بالشهر الماضي (${prevNet.toLocaleString()} دج ➜ ${netAmountNum.toLocaleString()} دج).`,
              detectedValue: `${netAmountNum.toLocaleString()} دج`,
              expectedValue: `${prevNet.toLocaleString()} دج`,
              source: "RULE_ENGINE",
              confidence: 0.85,
            });
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PERSISTANCE ATOMIQUE DES ANOMALIES
  // RÈGLE : Ne JAMAIS écraser les anomalies déjà traitées par l'humain
  // (REVIEWED, CONFIRMED, FALSE_POSITIVE, RESOLVED). On rafraîchit uniquement
  // les OPEN issues de RULE_ENGINE.
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    // Supprimer les anomalies automatiques encore au statut OPEN pour régénérer à jour
    await tx.auditFinding.deleteMany({
      where: {
        batchId: batch.id,
        source: "RULE_ENGINE",
        status: "OPEN",
      },
    });

    for (const c of candidates) {
      // Vérifier si une anomalie équivalente n'a pas déjà été résolue manuellement
      const existingResolved = await tx.auditFinding.findFirst({
        where: {
          batchId: c.batchId,
          employeeId: c.employeeId || null,
          type: c.type,
          status: { in: ["REVIEWED", "CONFIRMED", "FALSE_POSITIVE", "RESOLVED"] },
        },
      });

      // Si l'utilisateur a déjà statué dessus, on ne réouvre pas
      if (existingResolved) {
        continue;
      }

      await tx.auditFinding.create({
        data: {
          batchId: c.batchId,
          employeeId: c.employeeId || null,
          type: c.type,
          severity: c.severity,
          title: c.title,
          description: c.description,
          detectedValue: c.detectedValue || null,
          expectedValue: c.expectedValue || null,
          status: "OPEN",
          source: c.source || "RULE_ENGINE",
          confidence: c.confidence ?? null,
        },
      });
    }
  });

  // Calcul du résumé
  let criticalCount = 0;
  let highCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const c of candidates) {
    if (c.severity === "CRITICAL") criticalCount++;
    else if (c.severity === "HIGH") highCount++;
    else if (c.severity === "WARNING") warningCount++;
    else if (c.severity === "INFO") infoCount++;
  }

  return {
    batchId,
    totalGenerated: candidates.length,
    criticalCount,
    highCount,
    warningCount,
    infoCount,
    findings: candidates,
  };
}
