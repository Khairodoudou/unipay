-- CreateTable
CREATE TABLE "audit_findings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "employeeId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detectedValue" TEXT,
    "expectedValue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL DEFAULT 'RULE_ENGINE',
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolutionNote" TEXT,
    CONSTRAINT "audit_findings_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_findings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_findings_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "possibleCauses" TEXT,
    "dataConsidered" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_analyses_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "audit_findings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "audit_findings_batchId_idx" ON "audit_findings"("batchId");

-- CreateIndex
CREATE INDEX "audit_findings_employeeId_idx" ON "audit_findings"("employeeId");

-- CreateIndex
CREATE INDEX "audit_findings_status_idx" ON "audit_findings"("status");

-- CreateIndex
CREATE INDEX "audit_findings_severity_idx" ON "audit_findings"("severity");

-- CreateIndex
CREATE INDEX "audit_findings_type_idx" ON "audit_findings"("type");

-- CreateIndex
CREATE INDEX "ai_analyses_findingId_idx" ON "ai_analyses"("findingId");
