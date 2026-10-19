// Seed default rewards for BBN Fidelity.
//
// This script is invoked via `npm run db:seed` (which runs `tsx prisma/seed.ts`).
// Unlike Next.js runtime, `tsx` does not auto-load `.env.local`, so we load it
// explicitly via dotenv (matching the pattern in prisma.config.ts).
//
// Prisma 7 requires a driver adapter (`@prisma/adapter-pg`) instead of the bundled
// engine, so we mirror the client construction from src/lib/prisma.ts.
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"] });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set (expected in .env.local)");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rewards = [
    { label: "Boisson offerte", thresholdPoints: 50 },
    { label: "Burger offert", thresholdPoints: 100 },
    { label: "Menu complet offert", thresholdPoints: 200 },
  ];

  for (const r of rewards) {
    await prisma.reward.upsert({
      where: { id: `seed-${r.thresholdPoints}` },
      create: { id: `seed-${r.thresholdPoints}`, ...r, active: true },
      update: {},
    });
  }

  console.log(`Seeded ${rewards.length} rewards.`);

  // ── Jeu-concours GTA VI ────────────────────────────────────────────────
  // Du 19 octobre au 19 novembre, 3 tirages hebdomadaires (1 gagnant chacun).
  // Les heures sont en UTC ; +02:00 en octobre (CEST) et +01:00 dès le 26/10
  // (CET), pour un tirage à 20 h heure de Paris dans les deux cas.
  const CONTEST_ID = "seed-contest-gta6";

  await prisma.contest.upsert({
    where: { id: CONTEST_ID },
    create: {
      id: CONTEST_ID,
      name: "Concours GTA VI",
      prizeLabel: "Grand Theft Auto VI — édition PlayStation 5",
      startsAt: new Date("2026-10-19T00:00:00+02:00"),
      endsAt: new Date("2026-11-19T23:59:59+01:00"),
      pointsPerTicket: 5,
      freeTickets: 1,
      active: true,
    },
    update: {},
  });

  const draws = [
    { position: 1, label: "Tirage 1", scheduledFor: new Date("2026-10-26T20:00:00+02:00") },
    { position: 2, label: "Tirage 2", scheduledFor: new Date("2026-11-02T20:00:00+01:00") },
    { position: 3, label: "Tirage 3", scheduledFor: new Date("2026-11-09T20:00:00+01:00") },
  ];

  for (const draw of draws) {
    await prisma.contestDraw.upsert({
      where: { contestId_position: { contestId: CONTEST_ID, position: draw.position } },
      create: { contestId: CONTEST_ID, ...draw },
      update: {},
    });
  }

  console.log(`Seeded contest "Concours GTA VI" with ${draws.length} draws.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
