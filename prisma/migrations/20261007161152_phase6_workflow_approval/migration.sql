-- AlterTable
ALTER TABLE "payroll_batches" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "payroll_batches" ADD COLUMN "submittedAt" DATETIME;
ALTER TABLE "payroll_batches" ADD COLUMN "submittedBy" TEXT;

-- CreateTable
CREATE TABLE "workflow_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_actions_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_actions_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "messageAr" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "workflow_actions_batchId_createdAt_idx" ON "workflow_actions"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_actions_actorId_createdAt_idx" ON "workflow_actions"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_actions_action_idx" ON "workflow_actions"("action");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payroll_batches_organizationId_idx" ON "payroll_batches"("organizationId");
