import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { pushPassUpdateForCustomer } from "@/lib/services/passkit-push";

export class InsufficientPointsError extends Error {
  constructor(currentPoints: number, requiredPoints: number) {
    super(`Customer has ${currentPoints} points, needs ${requiredPoints}`);
    this.name = "InsufficientPointsError";
  }
}

export class RewardNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RewardNotAvailableError";
  }
}

const RedeemRewardSchema = z.object({
  customerId: z.string().min(1),
  rewardId: z.string().min(1),
  employeeId: z.string().min(1),
});

export async function redeemReward(input: {
  customerId: string;
  rewardId: string;
  employeeId: string;
}) {
  const { customerId, rewardId, employeeId } = RedeemRewardSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.active) {
      throw new RewardNotAvailableError(`Reward ${rewardId} is not available`);
    }

    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.deletedAt) {
      throw new RewardNotAvailableError(`Customer ${customerId} not found`);
    }

    if (customer.pointsTotal < reward.thresholdPoints) {
      throw new InsufficientPointsError(customer.pointsTotal, reward.thresholdPoints);
    }

    const pointsDebit = reward.thresholdPoints;
    const redemption = await tx.rewardRedemption.create({
      data: {
        customerId,
        rewardId,
        pointsDebit,
        createdByEmployeeId: employeeId,
      },
    });

    const updated = await tx.customer.update({
      where: { id: customerId },
      data: { pointsTotal: { decrement: pointsDebit } },
    });

    return {
      redemptionId: redemption.id,
      pointsDebit,
      newPointsTotal: updated.pointsTotal,
    };
  });

  pushPassUpdateForCustomer(customerId);
  return result;
}
