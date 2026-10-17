-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payment_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentOrderId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollRecordId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "ribMasked" TEXT NOT NULL,
    "snapshotMatricule" TEXT,
    "snapshotName" TEXT,
    "ribSnapshot" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'DZD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_transactions_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_transactions_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_payment_transactions" ("amount", "confirmedAt", "createdAt", "employeeId", "failureReason", "id", "paymentOrderId", "payrollRecordId", "reference", "ribMasked", "status", "updatedAt") SELECT "amount", "confirmedAt", "createdAt", "employeeId", "failureReason", "id", "paymentOrderId", "payrollRecordId", "reference", "ribMasked", "status", "updatedAt" FROM "payment_transactions";
DROP TABLE "payment_transactions";
ALTER TABLE "new_payment_transactions" RENAME TO "payment_transactions";
CREATE UNIQUE INDEX "payment_transactions_payrollRecordId_key" ON "payment_transactions"("payrollRecordId");
CREATE UNIQUE INDEX "payment_transactions_reference_key" ON "payment_transactions"("reference");
CREATE INDEX "payment_transactions_paymentOrderId_idx" ON "payment_transactions"("paymentOrderId");
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");
CREATE INDEX "payment_transactions_employeeId_idx" ON "payment_transactions"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
