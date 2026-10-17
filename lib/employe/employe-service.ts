import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { UserSessionData } from "@/lib/auth/session";

export interface EmployeeProfileDTO {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  position: string | null;
  grade: string | null;
  category: string | null;
  recruitmentDate: Date | null;
  status: string;
  baseSalary: number;
  index: number | null;
  maskedRib: string | null;
  bankName: string | null;
  organizationName: string;
  organizationUnitName: string | null;
}

export interface EmployeePayslipListItemDTO {
  id: string; // PayrollRecord id
  batchId: string;
  year: number;
  month: number;
  periodLabel: string;
  versionNumber: number;
  grossAmount: number;
  totalAllowances: number;
  totalDeductions: number;
  totalContributions: number;
  totalTaxes: number;
  netAmount: number;
  statusTextAr: string;
  calculatedAt: Date;
}

export interface EmployeePayslipDetailDTO {
  id: string;
  batchId: string;
  periodLabel: string;
  year: number;
  month: number;
  versionNumber: number;
  calculatedAt: Date;
  employee: {
    matricule: string;
    fullName: string;
    grade: string | null;
    position: string | null;
    category: string | null;
    organizationName: string;
    organizationUnitName: string | null;
    maskedRib: string | null;
    bankName: string | null;
    baseSalary: number;
  };
  attendance: {
    workingDays: number;
    presentDays: number;
    absentDays: number;
    sickDays: number;
    vacationDays: number;
  } | null;
  lineItems: Array<{
    id: string;
    type: string;
    code: string | null;
    labelAr: string;
    amount: number;
  }>;
  summary: {
    baseSalary: number;
    grossAmount: number;
    totalAllowances: number;
    totalDeductions: number;
    totalContributions: number;
    totalTaxes: number;
    netAmount: number;
  };
}

/**
 * Masque un numéro de RIB pour préserver la confidentialité
 * Ex: 00100234567890123456 -> **** **** **** 3456
 */
export function maskRib(rib: string | null | undefined): string | null {
  if (!rib || rib.length < 4) return null;
  const last4 = rib.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Récupère l'employé lié à l'utilisateur actuellement authentifié.
 * RÈGLE ABSOLUE : Zéro paramètre client. Tout découle de la session serveur.
 */
export async function getAuthenticatedEmployee(customUser?: UserSessionData) {
  const user = customUser ?? (await requireRole("EMPLOYE"));

  let employeeId = user.employeeId;

  // Si non présent en session directe, interroger la base
  if (!employeeId) {
    const userInDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });
    employeeId = userInDb?.employeeId ?? null;
  }

  // Si toujours non relié, tenter une résolution de secours par email si employé actif
  if (!employeeId && user.email) {
    const matchedEmployee = await prisma.employee.findFirst({
      where: { email: user.email, status: "ACTIVE" },
      select: { id: true },
    });
    if (matchedEmployee) {
      await prisma.user.update({
        where: { id: user.id },
        data: { employeeId: matchedEmployee.id },
      });
      employeeId = matchedEmployee.id;
    }
  }

  if (!employeeId) {
    throw new Error("UNAUTHORIZED_NO_EMPLOYEE_LINK: Compte utilisateur non relié à une fiche employé valide.");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      organization: true,
      organizationUnit: true,
    },
  });

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND: Fiche employé introuvable.");
  }

  if (employee.status !== "ACTIVE") {
    throw new Error("EMPLOYEE_SUSPENDED: Compte employé inactif ou suspendu.");
  }

  return employee;
}

/**
 * Récupère les informations de profil autorisées de l'employé (en lecture seule).
 */
export async function getEmployeeProfile(customUser?: UserSessionData): Promise<EmployeeProfileDTO> {
  const employee = await getAuthenticatedEmployee(customUser);

  return {
    id: employee.id,
    matricule: employee.matricule,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    position: employee.position,
    grade: employee.grade,
    category: employee.category,
    recruitmentDate: employee.recruitmentDate,
    status: employee.status,
    baseSalary: Number(employee.baseSalary),
    index: employee.index,
    maskedRib: maskRib(employee.rib),
    bankName: employee.bankName,
    organizationName: employee.organization.name,
    organizationUnitName: employee.organizationUnit?.name ?? null,
  };
}

/**
 * Récupère les statistiques synthétiques pour le dashboard employé.
 */
export async function getEmployeeDashboardStats(customUser?: UserSessionData) {
  const employee = await getAuthenticatedEmployee(customUser);

  // 1. Nombre de bulletins autorisés
  const totalPayslipsCount = await prisma.payrollRecord.count({
    where: {
      employeeId: employee.id,
      batch: { status: "AUTHORIZED" },
    },
  });

  // 2. Dernier bulletin autorisé
  const latestRecord = await prisma.payrollRecord.findFirst({
    where: {
      employeeId: employee.id,
      batch: { status: "AUTHORIZED" },
    },
    include: {
      batch: {
        include: {
          period: true,
        },
      },
    },
    orderBy: [
      { batch: { period: { year: "desc" } } },
      { batch: { period: { month: "desc" } } },
      { batch: { versionNumber: "desc" } },
    ],
  });

  // 3. Notifications non lues
  const user = customUser ?? (await requireRole("EMPLOYE"));
  const unreadNotificationsCount = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  });

  return {
    employeeName: `${employee.firstName} ${employee.lastName}`,
    matricule: employee.matricule,
    position: employee.position ?? "أستاذ / موظف",
    organizationName: employee.organization.name,
    totalPayslipsCount,
    unreadNotificationsCount,
    latestPayslip: latestRecord
      ? {
          id: latestRecord.id,
          periodLabel: latestRecord.batch.period.label,
          year: latestRecord.batch.period.year,
          month: latestRecord.batch.period.month,
          netAmount: Number(latestRecord.netAmount),
          calculatedAt: latestRecord.calculatedAt,
        }
      : null,
  };
}

/**
 * Récupère la liste des bulletins autorisés pour l'employé connecté.
 * RÈGLE ABSOLUE : Seuls les lots au statut "AUTHORIZED" sont renvoyés.
 */
export async function getEmployeePayslips(
  options?: {
    year?: number;
    month?: number;
  },
  customUser?: UserSessionData
): Promise<EmployeePayslipListItemDTO[]> {
  const employee = await getAuthenticatedEmployee(customUser);

  const records = await prisma.payrollRecord.findMany({
    where: {
      employeeId: employee.id,
      batch: {
        status: "AUTHORIZED", // Publication condition
        ...(options?.year ? { period: { year: options.year } } : {}),
        ...(options?.month ? { period: { month: options.month } } : {}),
      },
    },
    include: {
      batch: {
        include: {
          period: true,
        },
      },
    },
    orderBy: [
      { batch: { period: { year: "desc" } } },
      { batch: { period: { month: "desc" } } },
      { batch: { versionNumber: "desc" } },
    ],
  });

  // Déduplication par période : si plusieurs versions autorisées existaient, ne garder que la version la plus récente
  const seenPeriods = new Set<string>();
  const uniqueRecords: typeof records = [];

  for (const rec of records) {
    const periodKey = `${rec.batch.period.year}-${rec.batch.period.month}`;
    if (!seenPeriods.has(periodKey)) {
      seenPeriods.add(periodKey);
      uniqueRecords.push(rec);
    }
  }

  return uniqueRecords.map((r) => ({
    id: r.id,
    batchId: r.batchId,
    year: r.batch.period.year,
    month: r.batch.period.month,
    periodLabel: r.batch.period.label,
    versionNumber: r.batch.versionNumber,
    grossAmount: Number(r.grossAmount),
    totalAllowances: Number(r.totalAllowances),
    totalDeductions: Number(r.totalDeductions),
    totalContributions: Number(r.totalContributions),
    totalTaxes: Number(r.totalTaxes),
    netAmount: Number(r.netAmount),
    statusTextAr: "متاح",
    calculatedAt: r.calculatedAt,
  }));
}

/**
 * Récupère le détail complet d'un bulletin autorisé pour l'employé connecté.
 * RÈGLE D'OWNERSHIP STRICTE :
 * Si le record n'existe pas, n'appartient pas à l'employé ou n'est pas AUTHORIZED, retourne null.
 */
export async function getEmployeePayslipDetail(
  recordId: string,
  customUser?: UserSessionData
): Promise<EmployeePayslipDetailDTO | null> {
  const employee = await getAuthenticatedEmployee(customUser);

  const record = await prisma.payrollRecord.findUnique({
    where: { id: recordId },
    include: {
      batch: {
        include: {
          period: true,
        },
      },
      employee: {
        include: {
          organization: true,
          organizationUnit: true,
        },
      },
    },
  });

  if (!record) {
    return null;
  }

  // CONTRÔLE D'OWNERSHIP STRICT
  if (record.employeeId !== employee.id) {
    return null;
  }

  // CONTRÔLE DE PUBLICATION STRICT : AUTHORIZED UNIQUEMENT
  if (record.batch.status !== "AUTHORIZED") {
    return null;
  }

  // Récupérer les éléments de décompte (indemnités, retenues)
  const lineItems = await prisma.payrollLineItem.findMany({
    where: {
      batchId: record.batchId,
      employeeId: employee.id,
    },
    orderBy: { createdAt: "asc" },
  });

  // Récupérer les données de présence si disponibles
  const attendance = await prisma.attendanceRecord.findUnique({
    where: {
      batchId_employeeId: {
        batchId: record.batchId,
        employeeId: employee.id,
      },
    },
  });

  return {
    id: record.id,
    batchId: record.batchId,
    periodLabel: record.batch.period.label,
    year: record.batch.period.year,
    month: record.batch.period.month,
    versionNumber: record.batch.versionNumber,
    calculatedAt: record.calculatedAt,
    employee: {
      matricule: record.snapshotMatricule || employee.matricule,
      fullName: record.snapshotName || `${employee.firstName} ${employee.lastName}`,
      grade: record.snapshotGrade || employee.grade,
      position: employee.position,
      category: employee.category,
      organizationName: employee.organization.name,
      organizationUnitName: employee.organizationUnit?.name ?? null,
      maskedRib: maskRib(employee.rib),
      bankName: employee.bankName,
      baseSalary: Number(record.snapshotBaseSalary || employee.baseSalary),
    },
    attendance: attendance
      ? {
          workingDays: attendance.workingDays,
          presentDays: Number(attendance.presentDays),
          absentDays: Number(attendance.absentDays),
          sickDays: Number(attendance.sickDays),
          vacationDays: Number(attendance.vacationDays),
        }
      : null,
    lineItems: lineItems.map((li) => ({
      id: li.id,
      type: li.type,
      code: li.code,
      labelAr: li.labelAr,
      amount: Number(li.amount),
    })),
    summary: {
      baseSalary: Number(record.snapshotBaseSalary || employee.baseSalary),
      grossAmount: Number(record.grossAmount),
      totalAllowances: Number(record.totalAllowances),
      totalDeductions: Number(record.totalDeductions),
      totalContributions: Number(record.totalContributions),
      totalTaxes: Number(record.totalTaxes),
      netAmount: Number(record.netAmount),
    },
  };
}

/**
 * Récupère les années disponibles pour le filtre des bulletins
 */
export async function getAvailablePayslipYears(customUser?: UserSessionData): Promise<number[]> {
  const employee = await getAuthenticatedEmployee(customUser);

  const periods = await prisma.payrollRecord.findMany({
    where: {
      employeeId: employee.id,
      batch: { status: "AUTHORIZED" },
    },
    select: {
      batch: {
        select: {
          period: {
            select: { year: true },
          },
        },
      },
    },
    distinct: ["batchId"],
  });

  const years = Array.from(new Set(periods.map((p) => p.batch.period.year))).sort((a, b) => b - a);
  return years.length > 0 ? years : [new Date().getFullYear()];
}
