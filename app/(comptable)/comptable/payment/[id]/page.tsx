import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";
import { PaymentOrderDetailClient } from "@/components/comptable/payment/PaymentOrderDetailClient";

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "تفاصيل أمر الدفع — المحاسب المالي — UNI-PAY",
  description: "عرض حركات الدفع والملف التقني والتسوية المحاسبية",
};

export default async function PaymentOrderDetailPage({
  params,
}: PaymentDetailPageProps) {
  const { id } = await params;
  const user = await requireRole(["COMPTABLE", "ADMIN"]);

  const order = await prisma.paymentOrder.findUnique({
    where: { id },
    include: {
      batch: {
        include: {
          period: { select: { label: true, year: true, month: true } },
        },
      },
      createdBy: { select: { firstName: true, lastName: true } },
      confirmedBy: { select: { firstName: true, lastName: true } },
      transactions: {
        include: {
          employee: {
            select: {
              id: true,
              matricule: true,
              firstName: true,
              lastName: true,
              bankName: true,
            },
          },
        },
        orderBy: { reference: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Multi-tenancy check
  if (
    order.batch.organizationId &&
    order.batch.organizationId !== user.organizationId &&
    user.roleCode !== "ADMIN"
  ) {
    notFound();
  }

  const periodLabel = order.batch.period?.label ?? `${order.batch.period?.year ?? ""}/${order.batch.period?.month ?? ""}`;

  return (
    <PaymentOrderDetailClient
      order={{
        id: order.id,
        reference: order.reference,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        employeeCount: order.employeeCount,
        currency: order.currency,
        bankFormat: order.bankFormat,
        fileName: order.fileName,
        fileHash: order.fileHash,
        fileSize: order.fileSize,
        confirmationMethod: order.confirmationMethod,
        confirmationRef: order.confirmationRef,
        reconciliationNotes: order.reconciliationNotes,
        processingStartedAt: order.processingStartedAt?.toISOString() ?? null,
        paidAt: order.paidAt?.toISOString() ?? null,
        closedAt: order.closedAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        batchId: order.batch.id,
        batchLabel: order.batch.label ?? order.batch.period?.label ?? order.batchId,
        batchStatus: order.batch.status,
        periodLabel,
        createdByName: order.createdBy
          ? `${order.createdBy.firstName} ${order.createdBy.lastName}`
          : null,
        confirmedByName: order.confirmedBy
          ? `${order.confirmedBy.firstName} ${order.confirmedBy.lastName}`
          : null,
      }}
      transactions={order.transactions.map((tx) => ({
        id: tx.id,
        reference: tx.reference,
        amount: Number(tx.amount),
        ribMasked: tx.ribMasked,
        status: tx.status,
        failureReason: tx.failureReason,
        confirmedAt: tx.confirmedAt?.toISOString() ?? null,
        employee: {
          id: tx.employee.id,
          matricule: tx.employee.matricule,
          firstName: tx.employee.firstName,
          lastName: tx.employee.lastName,
          bankName: tx.employee.bankName,
        },
      }))}
      user={{
        id: user.id,
        roleCode: user.roleCode,
        permissions: user.permissions,
      }}
    />
  );
}
