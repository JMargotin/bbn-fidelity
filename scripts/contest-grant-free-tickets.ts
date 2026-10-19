// Crédite le ticket offert à TOUS les clients existants du programme de
// fidélité, y compris ceux qui n'ouvrent jamais l'application web (carte
// Apple Wallet uniquement, inscription au camion...).
//
// À lancer une fois au démarrage du concours :
//   npm run contest:grant
//
// Le script est idempotent : un client qui a déjà une participation est ignoré,
// donc on peut le relancer sans risque pour rattraper les nouveaux inscrits.

// Must be the first import: loads env vars before prisma reads them.
import "./load-env";
import { prisma } from "../src/lib/prisma";

async function main() {
  const contest = await prisma.contest.findFirst({
    where: { active: true },
    orderBy: { startsAt: "desc" },
  });
  if (!contest) {
    console.error("Aucun concours actif. Lance d'abord `npm run db:seed`.");
    process.exit(1);
  }

  console.log(`Concours : ${contest.name} (${contest.freeTickets} ticket offert)`);

  if (contest.freeTickets <= 0) {
    console.log("Aucun ticket offert configuré, rien à faire.");
    return;
  }

  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      contestEntries: { none: { contestId: contest.id } },
    },
    select: { id: true },
  });

  if (customers.length === 0) {
    console.log("Tous les clients ont déjà leur participation. Rien à faire.");
    return;
  }

  // createMany + skipDuplicates : sûr même si un client crée sa participation
  // depuis le site pendant l'exécution du script.
  const created = await prisma.contestEntry.createMany({
    data: customers.map((c) => ({
      contestId: contest.id,
      customerId: c.id,
      tickets: contest.freeTickets,
      pointsSpent: 0,
    })),
    skipDuplicates: true,
  });

  // Journal d'audit : une ligne FREE par participation réellement créée.
  const entries = await prisma.contestEntry.findMany({
    where: {
      contestId: contest.id,
      customerId: { in: customers.map((c) => c.id) },
      purchases: { none: {} },
    },
    select: { id: true },
  });

  await prisma.contestTicketPurchase.createMany({
    data: entries.map((e) => ({
      entryId: e.id,
      quantity: contest.freeTickets,
      pointsSpent: 0,
      source: "FREE" as const,
    })),
  });

  console.log(`${created.count} participation(s) créée(s) avec le ticket offert.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
