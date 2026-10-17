-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARED',
    "totalAmount" DECIMAL NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DZD',
    "bankFormat" TEXT NOT NULL DEFAULT 'GENERIC_BANK_TRANSFER',
    "fileName" TEXT,
    "fileHash" TEXT,
    "fileSize" INTEGER,
    "createdById" TEXT,
    "confirmedById" TEXT,
    "confirmationMethod" TEXT DEFAULT 'MANUAL_CONTROLLED',
    "confirmationRef" TEXT,
    "processingStartedAt" DATETIME,
    "paidAt" DATETIME,
    "closedAt" DATETIME,
    "failureReason" TEXT,
    "reconciliationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_orders_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payroll_batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_orders_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentOrderId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollRecordId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "ribMasked" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_transactions_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_transactions_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_reference_key" ON "payment_orders"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_batchId_key" ON "payment_orders"("batchId");

-- CreateIndex
CREATE INDEX "payment_orders_status_idx" ON "payment_orders"("status");

-- CreateIndex
CREATE INDEX "payment_orders_batchId_idx" ON "payment_orders"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_payrollRecordId_key" ON "payment_transactions"("payrollRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_reference_key" ON "payment_transactions"("reference");

-- CreateIndex
CREATE INDEX "payment_transactions_paymentOrderId_idx" ON "payment_transactions"("paymentOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_employeeId_idx" ON "payment_transactions"("employeeId");
