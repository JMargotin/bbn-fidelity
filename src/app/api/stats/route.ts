import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSessionOrUnauthorized, isOwner } from "@/lib/api-session";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;
  if (!isOwner(session.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const [
    totalCustomers,
    customersLast30Days,
    pointsCreditedAgg,
    pointsRedeemedAgg,
    transactions30Days,
    topCustomers,
  ] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
    prisma.transaction.aggregate({
      _sum: { pointsCredit: true },
      where: { reversedAt: null },
    }),
    prisma.rewardRedemption.aggregate({ _sum: { pointsDebit: true } }),
    prisma.transaction.count({ where: { createdAt: { gte: since }, reversedAt: null } }),
    prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { pointsTotal: "desc" },
      take: 10,
      select: { id: true, firstName: true, pointsTotal: true },
    }),
  ]);

  return NextResponse.json({
    totalCustomers,
    customersLast30Days,
    totalPointsCredited: pointsCreditedAgg._sum.pointsCredit ?? 0,
    totalPointsRedeemed: pointsRedeemedAgg._sum.pointsDebit ?? 0,
    transactions30Days,
    topCustomers,
  });
}
