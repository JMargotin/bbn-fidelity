import { prisma } from "@/lib/prisma";

export type Reward = { label: string; thresholdPoints: number };

export const FALLBACK_REWARDS: Reward[] = [
  { label: "Boisson offerte", thresholdPoints: 50 },
  { label: "Burger offert", thresholdPoints: 100 },
  { label: "Menu offert", thresholdPoints: 200 },
];

export async function loadActiveRewards(): Promise<Reward[]> {
  const rewards = await prisma.reward.findMany({
    where: { active: true },
    orderBy: { thresholdPoints: "asc" },
    select: { label: true, thresholdPoints: true },
  });
  return rewards.length > 0 ? rewards : FALLBACK_REWARDS;
}

/** Compact reward label for tight "rewards list" fields (drops "offerte", etc.). */
export function compactRewardLabel(label: string): string {
  return label.replace(/\s*(offerte?|complet|gratuite?)\s*/gi, " ").trim() || label;
}
