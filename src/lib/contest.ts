/**
 * Règles métier pures du jeu-concours (aucun accès base / réseau).
 *
 * Principe : un ticket coûte `pointsPerTicket` points de fidélité. Les tickets
 * sont CUMULÉS sur toute la durée du concours — ils ne sont jamais consommés
 * par un tirage, donc un participant garde son poids pour les tirages suivants.
 */

/** Coût en points d'un ticket (valeur par défaut, surchargeable par concours). */
export const DEFAULT_POINTS_PER_TICKET = 5;

/** Tickets offerts d'office à la première participation. */
export const DEFAULT_FREE_TICKETS = 1;

/** Garde-fou anti-erreur de saisie sur un achat unitaire. */
export const MAX_TICKETS_PER_PURCHASE = 50;

export class InvalidTicketQuantityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTicketQuantityError";
  }
}

export class NotEnoughPointsError extends Error {
  constructor(
    readonly currentPoints: number,
    readonly requiredPoints: number,
  ) {
    super(`Customer has ${currentPoints} points, needs ${requiredPoints}`);
    this.name = "NotEnoughPointsError";
  }
}

/** Coût total, après validation de la quantité. */
export function ticketCost(quantity: number, pointsPerTicket: number): number {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new InvalidTicketQuantityError("La quantité doit être un entier positif");
  }
  if (quantity > MAX_TICKETS_PER_PURCHASE) {
    throw new InvalidTicketQuantityError(
      `Maximum ${MAX_TICKETS_PER_PURCHASE} tickets en une seule fois`,
    );
  }
  return quantity * pointsPerTicket;
}

/** Nombre de tickets que le solde de points permet d'acheter. */
export function affordableTickets(points: number, pointsPerTicket: number): number {
  if (pointsPerTicket <= 0) return 0;
  return Math.max(0, Math.floor(points / pointsPerTicket));
}

/** Points manquants pour s'offrir un ticket de plus (0 si déjà possible). */
export function pointsToNextTicket(points: number, pointsPerTicket: number): number {
  if (pointsPerTicket <= 0) return 0;
  if (points >= pointsPerTicket) return 0;
  return pointsPerTicket - points;
}

export type DrawCandidate = { entryId: string; tickets: number };

export type DrawOutcome = {
  winnerEntryId: string;
  winnerTickets: number;
  totalTickets: number;
  /** Numéro du ticket gagnant, de 1 à totalTickets (conservé pour l'audit). */
  winningTicket: number;
};

/**
 * Tirage au sort pondéré par le nombre de tickets.
 *
 * On aligne virtuellement tous les tickets bout à bout et on en tire un :
 * un participant avec 10 tickets a donc 10× plus de chances qu'un participant
 * avec 1 ticket. `randomInt(max)` doit renvoyer un entier dans [0, max).
 *
 * Renvoie null si aucun candidat n'a de ticket.
 */
export function drawWeightedWinner(
  candidates: DrawCandidate[],
  randomInt: (maxExclusive: number) => number,
): DrawOutcome | null {
  const eligible = candidates.filter((c) => c.tickets > 0);
  const totalTickets = eligible.reduce((sum, c) => sum + c.tickets, 0);
  if (totalTickets <= 0) return null;

  // winningTicket est 1-based pour rester lisible dans le back-office.
  const winningTicket = randomInt(totalTickets) + 1;

  let cursor = 0;
  for (const candidate of eligible) {
    cursor += candidate.tickets;
    if (winningTicket <= cursor) {
      return {
        winnerEntryId: candidate.entryId,
        winnerTickets: candidate.tickets,
        totalTickets,
        winningTicket,
      };
    }
  }

  // Inatteignable (winningTicket <= totalTickets), mais on reste défensif.
  const last = eligible[eligible.length - 1];
  return {
    winnerEntryId: last.entryId,
    winnerTickets: last.tickets,
    totalTickets,
    winningTicket,
  };
}

/** Probabilité de gain d'un participant, en % (1 décimale). */
export function winChancePercent(tickets: number, totalTickets: number): number {
  if (totalTickets <= 0 || tickets <= 0) return 0;
  return Math.round((tickets / totalTickets) * 1000) / 10;
}

/* -------------------------------------------------------------------------
 * Formatage des dates
 * Le fuseau est figé sur Europe/Paris : le serveur (Fly, en UTC) et le
 * navigateur du client doivent produire exactement la même chaîne, sinon
 * React signale une erreur d'hydratation.
 * ---------------------------------------------------------------------- */

const PARIS = "Europe/Paris";

/** "26 octobre" */
export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: PARIS,
  }).format(date);
}

/** "26 octobre 2026" */
export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: PARIS,
  }).format(date);
}

/** "26/10/2026 à 20:00" */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: PARIS,
  }).format(date);
}
