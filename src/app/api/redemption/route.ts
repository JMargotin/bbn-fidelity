import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  redeemReward,
  InsufficientPointsError,
  RewardNotAvailableError,
} from "@/lib/services/redemption";

const RedemptionSchema = z.object({
  customerId: z.string().min(1),
  rewardId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: z.infer<typeof RedemptionSchema>;
  try {
    payload = RedemptionSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await redeemReward({
      customerId: payload.customerId,
      rewardId: payload.rewardId,
      employeeId: session.user.id,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InsufficientPointsError || err instanceof RewardNotAvailableError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Redemption error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
