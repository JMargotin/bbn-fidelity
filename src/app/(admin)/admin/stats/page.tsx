import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth-page";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function StatsPage() {
  await requireOwner();
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
    prisma.transaction.aggregate({ _sum: { pointsCredit: true }, where: { reversedAt: null } }),
    prisma.rewardRedemption.aggregate({ _sum: { pointsDebit: true } }),
    prisma.transaction.count({ where: { createdAt: { gte: since }, reversedAt: null } }),
    prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { pointsTotal: "desc" },
      take: 10,
      select: { id: true, firstName: true, pointsTotal: true },
    }),
  ]);

  const pointsCredited = pointsCreditedAgg._sum.pointsCredit ?? 0;
  const pointsRedeemed = pointsRedeemedAgg._sum.pointsDebit ?? 0;

  const tiles: { label: string; value: number; sub?: string; accent: string }[] = [
    {
      label: "Clients inscrits",
      value: totalCustomers,
      sub: `${customersLast30Days} ces 30 derniers jours`,
      accent: "var(--color-magenta)",
    },
    { label: "Transactions 30j", value: transactions30Days, accent: "var(--color-cyan)" },
    { label: "Points crédités (total)", value: pointsCredited, accent: "var(--color-sunset)" },
    { label: "Points consommés", value: pointsRedeemed, accent: "var(--color-violet)" },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-4xl">
          <span className="arcade">Les</span>{" "}
          <span className="script text-5xl text-magenta-soft">stats</span>
        </h1>
        <p className="text-sm text-lavender">Vue d'ensemble du programme de fidélité.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="glass relative overflow-hidden rounded-2xl p-5">
            <div
              className="absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-25 blur-2xl"
              style={{ background: tile.accent }}
            />
            <p className="relative text-xs uppercase tracking-wider text-lavender-dim">{tile.label}</p>
            <p className="relative mt-2 font-display text-4xl" style={{ color: tile.accent }}>
              {tile.value}
            </p>
            {tile.sub && <p className="relative mt-1 text-xs text-lavender-dim">{tile.sub}</p>}
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="mb-3 font-display text-xl text-cream">
          🏆 Top 10 <span className="text-grad">clients</span>
        </h2>
        <ul className="space-y-1">
          {topCustomers.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-center font-display text-sm text-lavender-dim">
                  {i + 1}
                </span>
                <span className="font-medium text-cream">{c.firstName}</span>
              </span>
              <span className="font-display text-lg text-grad">{c.pointsTotal} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
