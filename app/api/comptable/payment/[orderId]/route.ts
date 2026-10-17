/**
 * app/api/comptable/payment/[orderId]/route.ts
 * GET : détail d'un ordre de paiement avec ses transactions.
 * RIB complet jamais retourné — uniquement ribMasked.
 */

import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!user.permissions.includes("payment.read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.paymentOrder.findUnique({
    where: { id: orderId },
    include: {
      batch: {
        select: {
          id: true,
          label: true,
          status: true,
          organizationId: true,
          period: { select: { label: true, year: true, month: true } },
        },
      },
      createdBy:  { select: { id: true, firstName: true, lastName: true, role: { select: { code: true } } } },
      confirmedBy:{ select: { id: true, firstName: true, lastName: true, role: { select: { code: true } } } },
      transactions: {
        select: {
          id: true,
          reference: true,
          amount: true,
          ribMasked: true, // jamais le RIB complet ici
          status: true,
          failureReason: true,
          confirmedAt: true,
          createdAt: true,
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

  if (!order) return new NextResponse("Not Found", { status: 404 });

  // Sécurité multi-tenancy stricte
  if (
    order.batch.organizationId &&
    order.batch.organizationId !== user.organizationId
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.json({
    ...order,
    totalAmount: Number(order.totalAmount),
    transactions: order.transactions.map(tx => ({
      ...tx,
      amount: Number(tx.amount),
    })),
  });
}
