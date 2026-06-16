import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSessionOrUnauthorized, isOwner } from "@/lib/api-session";
import { broadcastPassUpdateToAll } from "@/lib/services/passkit-push";

const PatchRewardSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  thresholdPoints: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;
  if (!isOwner(session.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let payload: z.infer<typeof PatchRewardSchema>;
  try {
    payload = PatchRewardSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reward = await prisma.reward.update({ where: { id }, data: payload });

  try {
    await broadcastPassUpdateToAll();
  } catch (err) {
    console.error("Reward broadcast error:", err);
  }

  return NextResponse.json({ reward });
}
