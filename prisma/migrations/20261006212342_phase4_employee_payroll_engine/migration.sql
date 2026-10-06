-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matricule" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "nationalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "grade" TEXT,
    "position" TEXT,
    "category" TEXT,
    "recruitmentDate" DATETIME,
    "baseSalary" DECIMAL NOT NULL DEFAULT 0,
    "index" INTEGER,
    "rib" TEXT,
    "bankName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "organizationId" TEXT NOT NULL,
    "organizationUnitId" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employees_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "organization_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_history_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payroll_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "calculatedAt" DATETIME,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payroll_batches_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "payroll_periods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batch_employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "addedBy" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_employees_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batch_employees_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "snapshotMatricule" TEXT NOT NULL,
    "snapshotName" TEXT NOT NULL,
    "snapshotGrade" TEXT,
    "snapshotBaseSalary" DECIMAL NOT NULL,
    "grossAmount" DECIMAL NOT NULL DEFAULT 0,
    "totalAllowances" DECIMAL NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL NOT NULL DEFAULT 0,
    "totalContributions" DECIMAL NOT NULL DEFAULT 0,
    "totalTaxes" DECIMAL NOT NULL DEFAULT 0,
    "netAmount" DECIMAL NOT NULL DEFAULT 0,
    "calculationMeta" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CALCULATED',
    "errorMessage" TEXT,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payroll_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workingDays" INTEGER NOT NULL DEFAULT 30,
    "presentDays" DECIMAL NOT NULL DEFAULT 30,
    "absentDays" DECIMAL NOT NULL DEFAULT 0,
    "sickDays" DECIMAL NOT NULL DEFAULT 0,
    "vacationDays" DECIMAL NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_line_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT,
    "labelAr" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT true,
    "sourceRule" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_line_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payroll_line_items_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_matricule_key" ON "employees"("matricule");

-- CreateIndex
CREATE INDEX "employees_organizationId_idx" ON "employees"("organizationId");

-- CreateIndex
CREATE INDEX "employees_organizationUnitId_idx" ON "employees"("organizationUnitId");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_grade_idx" ON "employees"("grade");

-- CreateIndex
CREATE INDEX "employee_history_employeeId_idx" ON "employee_history"("employeeId");

-- CreateIndex
CREATE INDEX "employee_history_field_idx" ON "employee_history"("field");

-- CreateIndex
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_year_month_key" ON "payroll_periods"("year", "month");

-- CreateIndex
CREATE INDEX "payroll_batches_periodId_idx" ON "payroll_batches"("periodId");

-- CreateIndex
CREATE INDEX "payroll_batches_status_idx" ON "payroll_batches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batches_periodId_versionNumber_key" ON "payroll_batches"("periodId", "versionNumber");

-- CreateIndex
CREATE INDEX "batch_employees_batchId_idx" ON "batch_employees"("batchId");

-- CreateIndex
CREATE INDEX "batch_employees_employeeId_idx" ON "batch_employees"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "batch_employees_batchId_employeeId_key" ON "batch_employees"("batchId", "employeeId");

-- CreateIndex
CREATE INDEX "payroll_records_batchId_idx" ON "payroll_records"("batchId");

-- CreateIndex
CREATE INDEX "payroll_records_employeeId_idx" ON "payroll_records"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_batchId_employeeId_key" ON "payroll_records"("batchId", "employeeId");

-- CreateIndex
CREATE INDEX "attendance_records_batchId_idx" ON "attendance_records"("batchId");

-- CreateIndex
CREATE INDEX "attendance_records_employeeId_idx" ON "attendance_records"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_batchId_employeeId_key" ON "attendance_records"("batchId", "employeeId");

-- CreateIndex
CREATE INDEX "payroll_line_items_batchId_idx" ON "payroll_line_items"("batchId");

-- CreateIndex
CREATE INDEX "payroll_line_items_employeeId_idx" ON "payroll_line_items"("employeeId");

-- CreateIndex
CREATE INDEX "payroll_line_items_type_idx" ON "payroll_line_items"("type");
