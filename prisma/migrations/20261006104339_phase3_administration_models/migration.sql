-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "address" TEXT;
ALTER TABLE "organizations" ADD COLUMN "description" TEXT;
ALTER TABLE "organizations" ADD COLUMN "email" TEXT;
ALTER TABLE "organizations" ADD COLUMN "phone" TEXT;
ALTER TABLE "organizations" ADD COLUMN "website" TEXT;
ALTER TABLE "organizations" ADD COLUMN "wilaya" TEXT;

-- CreateTable
CREATE TABLE "organization_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "organization_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organization_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "organization_units_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payroll_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payroll_rule_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "effectiveTo" DATETIME,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_rule_versions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "payroll_rules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_units_code_key" ON "organization_units"("code");

-- CreateIndex
CREATE INDEX "organization_units_organizationId_idx" ON "organization_units"("organizationId");

-- CreateIndex
CREATE INDEX "organization_units_parentId_idx" ON "organization_units"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_rules_code_key" ON "payroll_rules"("code");

-- CreateIndex
CREATE INDEX "payroll_rules_category_idx" ON "payroll_rules"("category");

-- CreateIndex
CREATE INDEX "payroll_rule_versions_ruleId_idx" ON "payroll_rule_versions"("ruleId");

-- CreateIndex
CREATE INDEX "payroll_rule_versions_effectiveFrom_idx" ON "payroll_rule_versions"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_rule_versions_ruleId_versionNumber_key" ON "payroll_rule_versions"("ruleId", "versionNumber");
