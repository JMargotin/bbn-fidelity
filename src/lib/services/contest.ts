import { randomInt } from "node:crypto";
import { z } from "zod";
import {
  type DrawCandidate,
  NotEnoughPointsError,
  drawWeightedWinner,
  ticketCost,
} from "@/lib/contest";
import { prisma } from "@/lib/prisma";
import { pushPassUpdateForCustomer } from "@/lib/services/passkit-push";

export class ContestNotOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContestNotOpenError";
  }
}

export class DrawNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DrawNotAvailableError";
  }
}

/** Le concours actif (le plus récent si plusieurs), tirages inclus. */
export async function getActiveContest() {
  return prisma.contest.findFirst({
    where: { active: true },
    orderBy: { startsAt: "desc" },
    include: {
      draws: {
        orderBy: { position: "asc" },
        include: {
          winnerEntry: { include: { customer: { select: { firstName: true } } } },
        },
      },
    },
  });
}

export function isContestOpen(contest: { startsAt: Date; endsAt: Date }, now = new Date()) {
  return now >= contest.startsAt && now <= contest.endsAt;
}

/**
 * Participation du client, créée à la volée avec les tickets offerts.
 *
 * Idempotent et sûr en concurrence : `createMany({ skipDuplicates })` produit
 * un INSERT ... ON CONFLICT DO NOTHING, donc deux appels simultanés ne lèvent
 * pas d'erreur — le second voit `count: 0` et se contente de relire la ligne.
 * Le ticket offert n'est journalisé que par celui qui a réellement créé
 * l'entrée, ce qui garantit qu'il n'est jamais attribué deux fois.
 */
export async function ensureEntry(contestId: string, customerId: string) {
  const existing = await prisma.contestEntry.findUnique({
    where: { contestId_customerId: { contestId, customerId } },
  });
  if (existing) return existing;

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) throw new ContestNotOpenError(`Contest ${contestId} not found`);

  return prisma.$transaction(async (tx) => {
    const created = await tx.contestEntry.createMany({
      data: [{ contestId, customerId, tickets: contest.freeTickets, pointsSpent: 0 }],
      skipDuplicates: true,
    });

    const entry = await tx.contestEntry.findUniqueOrThrow({
      where: { contestId_customerId: { contestId, customerId } },
    });

    if (created.count === 1 && contest.freeTickets > 0) {
      await tx.contestTicketPurchase.create({
        data: {
          entryId: entry.id,
          quantity: contest.freeTickets,
          pointsSpent: 0,
          source: "FREE",
        },
      });
    }

    return entry;
  });
}

const BuyTicketsSchema = z.object({
  contestId: z.string().min(1),
  customerId: z.string().min(1),
  quantity: z.number().int().positive(),
});

/**
 * Achat de tickets : débite les points de fidélité et crédite les tickets,
 * dans une seule transaction. Le débit est conditionné en base
 * (`pointsTotal >= cost`) pour éviter tout solde négatif en cas de concurrence.
 */
export async function buyTickets(input: {
  contestId: string;
  customerId: string;
  quantity: number;
}) {
  const { contestId, customerId, quantity } = BuyTicketsSchema.parse(input);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest || !contest.active) {
    throw new ContestNotOpenError("Ce concours n'est pas disponible");
  }
  if (!isContestOpen(contest)) {
    throw new ContestNotOpenError("Le concours est terminé ou n'a pas encore commencé");
  }

  const cost = ticketCost(quantity, contest.pointsPerTicket);
  const entry = await ensureEntry(contestId, customerId);

  const result = await prisma.$transaction(async (tx) => {
    // updateMany + filtre sur pointsTotal : si le solde a bougé entre-temps,
    // count vaut 0 et on refuse l'achat plutôt que de passer sous zéro.
    const debited = await tx.customer.updateMany({
      where: { id: customerId, deletedAt: null, pointsTotal: { gte: cost } },
      data: { pointsTotal: { decrement: cost } },
    });

    if (debited.count === 0) {
      const current = await tx.customer.findUnique({
        where: { id: customerId },
        select: { pointsTotal: true },
      });
      throw new NotEnoughPointsError(current?.pointsTotal ?? 0, cost);
    }

    const updatedEntry = await tx.contestEntry.update({
      where: { id: entry.id },
      data: {
        tickets: { increment: quantity },
        pointsSpent: { increment: cost },
      },
    });

    await tx.contestTicketPurchase.create({
      data: { entryId: entry.id, quantity, pointsSpent: cost, source: "PURCHASE" },
    });

    const customer = await tx.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: { pointsTotal: true },
    });

    return {
      quantity,
      pointsSpent: cost,
      tickets: updatedEntry.tickets,
      newPointsTotal: customer.pointsTotal,
    };
  });

  // La carte Apple Wallet affiche le solde de points : on la rafraîchit.
  pushPassUpdateForCustomer(customerId);

  return result;
}

/**
 * Vue complète du concours pour un client (ou pour un visiteur : customerId null).
 *
 * Tant que le concours est ouvert, la simple consultation crée la participation
 * et crédite le ticket offert : « 1 ticket offert à tout le monde » ne doit pas
 * dépendre d'un premier achat. L'opération est idempotente.
 */
export async function getContestStateForCustomer(customerId: string | null) {
  const contest = await getActiveContest();
  if (!contest) return null;

  const entry = customerId
    ? contest.active && isContestOpen(contest)
      ? await ensureEntry(contest.id, customerId)
      : await prisma.contestEntry.findUnique({
          where: { contestId_customerId: { contestId: contest.id, customerId } },
        })
    : null;

  // Agrégat calculé APRÈS ensureEntry, pour que le ticket offert soit compté.
  const aggregate = await prisma.contestEntry.aggregate({
    where: { contestId: contest.id },
    _sum: { tickets: true },
    _count: { _all: true },
  });

  return {
    contest,
    entry,
    totalTickets: aggregate._sum.tickets ?? 0,
    participantCount: aggregate._count._all,
  };
}

/**
 * Effectue un tirage. Les gagnants des tirages précédents sont exclus
 * (un seul lot par participant — cf. règlement, article 6).
 */
export async function runDraw(drawId: string) {
  const draw = await prisma.contestDraw.findUnique({ where: { id: drawId } });
  if (!draw) throw new DrawNotAvailableError("Tirage introuvable");
  if (draw.drawnAt) throw new DrawNotAvailableError("Ce tirage a déjà été effectué");

  const previousWinnerIds = (
    await prisma.contestDraw.findMany({
      where: { contestId: draw.contestId, winnerEntryId: { not: null } },
      select: { winnerEntryId: true },
    })
  ).flatMap((d) => (d.winnerEntryId ? [d.winnerEntryId] : []));

  const entries = await prisma.contestEntry.findMany({
    where: {
      contestId: draw.contestId,
      tickets: { gt: 0 },
      id: { notIn: previousWinnerIds },
      customer: { deletedAt: null },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, tickets: true },
  });

  const candidates: DrawCandidate[] = entries.map((e) => ({
    entryId: e.id,
    tickets: e.tickets,
  }));

  const outcome = drawWeightedWinner(candidates, (max) => randomInt(max));
  if (!outcome) throw new DrawNotAvailableError("Aucun participant éligible pour ce tirage");

  // updateMany filtré sur drawnAt: null → un double clic ne peut pas écraser
  // un tirage déjà effectué.
  const updated = await prisma.contestDraw.updateMany({
    where: { id: drawId, drawnAt: null },
    data: {
      drawnAt: new Date(),
      winnerEntryId: outcome.winnerEntryId,
      winnerTickets: outcome.winnerTickets,
      totalTickets: outcome.totalTickets,
      winningTicket: outcome.winningTicket,
    },
  });
  if (updated.count === 0) throw new DrawNotAvailableError("Ce tirage a déjà été effectué");

  return prisma.contestDraw.findUniqueOrThrow({
    where: { id: drawId },
    include: {
      winnerEntry: {
        include: { customer: { select: { id: true, firstName: true, phoneE164: true } } },
      },
    },
  });
}
