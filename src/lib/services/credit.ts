import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculatePointsCredit } from "@/lib/points";
import { pushPassUpdateForCustomer } from "@/lib/services/passkit-push";

const MAX_TX_PER_MINUTE = 10;

export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer not found: ${customerId}`);
    this.name = "CustomerNotFoundError";
  }
}

export class TooManyRecentTransactionsError extends Error {
  constructor() {
    super("Too many recent transactions for this customer (max 10/min)");
    this.name = "TooManyRecentTransactionsError";
  }
}

const CreditPointsSchema = z.object({
  customerId: z.string().min(1),
  amountEurCents: z.number().int().positive(),
  employeeId: z.string().min(1),
});

export async function creditPoints(input: {
  customerId: string;
  amountEurCents: number;
  employeeId: string;
}) {
  const { customerId, amountEurCents, employeeId } = CreditPointsSchema.parse(input);
  const pointsCredit = calculatePointsCredit(amountEurCents);

  const recentCount = await prisma.transaction.count({
    where: {
      customerId,
      createdAt: { gte: new Date(Date.now() - 60_000) },
      reversedAt: null,
    },
  });
  if (recentCount >= MAX_TX_PER_MINUTE) throw new TooManyRecentTransactionsError();

  const result = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.deletedAt) throw new CustomerNotFoundError(customerId);

    const transaction = await tx.transaction.create({
      data: {
        customerId,
        amountEurCents,
        pointsCredit,
        createdByEmployeeId: employeeId,
      },
    });

    const updatedCustomer = await tx.customer.update({
      where: { id: customerId },
      data: { pointsTotal: { increment: pointsCredit } },
    });

    return {
      transactionId: transaction.id,
      pointsCredit,
      newPointsTotal: updatedCustomer.pointsTotal,
    };
  });

  // Fire-and-forget push to refresh the customer's Apple Wallet pass.
  pushPassUpdateForCustomer(customerId);

  return result;
}
