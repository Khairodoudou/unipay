/**
 * app/api/comptable/payment/route.ts
 * GET : liste des ordres de paiement de l'organisation.
 */

import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/guards";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!user.permissions.includes("payment.read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const status = searchParams.get("status");

  const where = {
    batch: { organizationId: user.organizationId },
    ...(status ? { status } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.paymentOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        reference: true,
        status: true,
        totalAmount: true,
        employeeCount: true,
        currency: true,
        bankFormat: true,
        fileName: true,
        fileHash: true,
        fileSize: true,
        confirmationMethod: true,
        confirmationRef: true,
        reconciliationNotes: true,
        processingStartedAt: true,
        paidAt: true,
        closedAt: true,
        createdAt: true,
        updatedAt: true,
        batch: {
          select: {
            id: true,
            label: true,
            status: true,
            period: { select: { label: true, year: true, month: true } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        confirmedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { transactions: true } },
      },
    }),
    prisma.paymentOrder.count({ where }),
  ]);

  return NextResponse.json({
    orders: orders.map(o => ({
      ...o,
      totalAmount: Number(o.totalAmount),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
