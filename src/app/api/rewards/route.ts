import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSessionOrUnauthorized, isOwner } from "@/lib/api-session";
import { broadcastPassUpdateToAll } from "@/lib/services/passkit-push";

const CreateRewardSchema = z.object({
  label: z.string().trim().min(1).max(80),
  thresholdPoints: z.number().int().positive(),
});

export async function GET() {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;

  const rewards = await prisma.reward.findMany({ orderBy: { thresholdPoints: "asc" } });
  return NextResponse.json({ rewards });
}

export async function POST(request: Request) {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;
  if (!isOwner(session.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: z.infer<typeof CreateRewardSchema>;
  try {
    payload = CreateRewardSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reward = await prisma.reward.create({ data: { ...payload, active: true } });

  try {
    await broadcastPassUpdateToAll();
  } catch (err) {
    console.error("Reward broadcast error:", err);
  }

  return NextResponse.json({ reward });
}
