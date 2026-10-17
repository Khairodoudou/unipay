import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { PaymentDashboardClient } from "@/components/comptable/payment/PaymentDashboardClient";

export const metadata: Metadata = {
  title: "إدارة أوامر الدفع — المحاسب المالي — UNI-PAY",
  description: "الإطار المحاسبي لإدارة أوامر الدفع وتتبع حالة التسوية",
};

export default async function ComptablePaymentPage() {
  const user = await requireRole(["COMPTABLE", "ADMIN"]);

  // 1. Batches AUTHORIZED prêts à déclencher un paiement
  const authorizedBatches = await prisma.payrollBatch.findMany({
    where: {
      organizationId: user.organizationId,
      status: "AUTHORIZED",
    },
    include: {
      period: { select: { label: true, year: true, month: true } },
      records: { select: { netAmount: true } },
      _count: { select: { employees: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // 2. Ordres de paiement (tous statuts)
  const paymentOrders = await prisma.paymentOrder.findMany({
    where: { batch: { organizationId: user.organizationId } },
    include: {
      batch: {
        select: {
          id: true,
          label: true,
          status: true,
          period: { select: { label: true, year: true, month: true } },
        },
      },
      createdBy:  { select: { firstName: true, lastName: true } },
      confirmedBy: { select: { firstName: true, lastName: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 3. Compteurs de statuts
  const statusCounts = await prisma.paymentOrder.groupBy({
    by: ["status"],
    where: { batch: { organizationId: user.organizationId } },
    _count: { id: true },
  });

  return (
    <PaymentDashboardClient
      user={{
        id: user.id,
        roleCode: user.roleCode,
        permissions: user.permissions,
      }}
      authorizedBatches={authorizedBatches.map(b => ({
        id: b.id,
        label: b.label ?? b.period?.label ?? b.id,
        period: b.period
          ? `${b.period.year}/${String(b.period.month).padStart(2, "0")}`
          : "–",
        employeeCount: b._count.employees,
        totalNet: b.records.reduce((sum, r) => sum + Number(r.netAmount), 0),
      }))}
      paymentOrders={paymentOrders.map(o => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        employeeCount: o.employeeCount,
        currency: o.currency,
        bankFormat: o.bankFormat,
        confirmationMethod: o.confirmationMethod ?? "MANUAL_CONTROLLED",
        confirmationRef: o.confirmationRef ?? null,
        reconciliationNotes: o.reconciliationNotes ?? null,
        processingStartedAt: o.processingStartedAt?.toISOString() ?? null,
        paidAt: o.paidAt?.toISOString() ?? null,
        closedAt: o.closedAt?.toISOString() ?? null,
        createdAt: o.createdAt.toISOString(),
        hasFile: !!o.fileName,
        fileHash: o.fileHash ?? null,
        transactionCount: o._count.transactions,
        batchId: o.batch.id,
        batchLabel: o.batch.label ?? o.batch.period?.label ?? o.batchId,
        batchStatus: o.batch.status,
        createdByName: o.createdBy
          ? `${o.createdBy.firstName} ${o.createdBy.lastName}`
          : null,
        confirmedByName: o.confirmedBy
          ? `${o.confirmedBy.firstName} ${o.confirmedBy.lastName}`
          : null,
      }))}
      statusCounts={Object.fromEntries(
        statusCounts.map(s => [s.status, s._count.id])
      )}
    />
  );
}
