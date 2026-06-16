// Seed default rewards for BBN Fidelity.
//
// This script is invoked via `npm run db:seed` (which runs `tsx prisma/seed.ts`).
// Unlike Next.js runtime, `tsx` does not auto-load `.env.local`, so we load it
// explicitly via dotenv (matching the pattern in prisma.config.ts).
//
// Prisma 7 requires a driver adapter (`@prisma/adapter-pg`) instead of the bundled
// engine, so we mirror the client construction from src/lib/prisma.ts.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
