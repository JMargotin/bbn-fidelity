import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      phoneE164: true,
      pointsTotal: true,
      deletedAt: true,
    },
  });

  if (!customer || customer.deletedAt) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const rewards = await prisma.reward.findMany({
    where: { active: true },
    orderBy: { thresholdPoints: "asc" },
  });

  return NextResponse.json({
    customer,
    rewards: rewards.map((r) => ({
      id: r.id,
      label: r.label,
      thresholdPoints: r.thresholdPoints,
      available: customer.pointsTotal >= r.thresholdPoints,
      missing: Math.max(0, r.thresholdPoints - customer.pointsTotal),
    })),
  });
}
