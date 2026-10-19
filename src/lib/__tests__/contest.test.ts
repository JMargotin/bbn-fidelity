import { describe, expect, it } from "vitest";
import {
  InvalidTicketQuantityError,
  MAX_TICKETS_PER_PURCHASE,
  affordableTickets,
  drawWeightedWinner,
  pointsToNextTicket,
  ticketCost,
  winChancePercent,
} from "../contest";

describe("ticketCost", () => {
  it("multiplie la quantité par le prix unitaire", () => {
    expect(ticketCost(1, 5)).toBe(5);
    expect(ticketCost(10, 5)).toBe(50);
  });

  it("refuse les quantités non entières, nulles ou négatives", () => {
    expect(() => ticketCost(0, 5)).toThrow(InvalidTicketQuantityError);
    expect(() => ticketCost(-3, 5)).toThrow(InvalidTicketQuantityError);
    expect(() => ticketCost(1.5, 5)).toThrow(InvalidTicketQuantityError);
  });

  it("plafonne un achat unitaire", () => {
    expect(() => ticketCost(MAX_TICKETS_PER_PURCHASE + 1, 5)).toThrow(InvalidTicketQuantityError);
  });
});

describe("affordableTickets", () => {
  it("arrondit vers le bas", () => {
    expect(affordableTickets(12, 5)).toBe(2);
    expect(affordableTickets(4, 5)).toBe(0);
    expect(affordableTickets(0, 5)).toBe(0);
  });

  it("ne renvoie jamais de valeur négative", () => {
    expect(affordableTickets(-10, 5)).toBe(0);
  });
});

describe("pointsToNextTicket", () => {
  it("indique ce qu'il manque quand le solde est insuffisant", () => {
    expect(pointsToNextTicket(3, 5)).toBe(2);
  });

  it("renvoie 0 dès qu'un ticket est abordable", () => {
    expect(pointsToNextTicket(5, 5)).toBe(0);
    expect(pointsToNextTicket(42, 5)).toBe(0);
  });
});

describe("drawWeightedWinner", () => {
  const candidates = [
    { entryId: "a", tickets: 1 },
    { entryId: "b", tickets: 3 },
    { entryId: "c", tickets: 6 },
  ];

  it("attribue chaque numéro de ticket au bon participant", () => {
    // Tickets 1 → a, 2-4 → b, 5-10 → c
    const winnerFor = (n: number) => drawWeightedWinner(candidates, () => n - 1)?.winnerEntryId;
    expect(winnerFor(1)).toBe("a");
    expect(winnerFor(2)).toBe("b");
    expect(winnerFor(4)).toBe("b");
    expect(winnerFor(5)).toBe("c");
    expect(winnerFor(10)).toBe("c");
  });

  it("expose les données d'audit du tirage", () => {
    const outcome = drawWeightedWinner(candidates, () => 4);
    expect(outcome).toEqual({
      winnerEntryId: "c",
      winnerTickets: 6,
      totalTickets: 10,
      winningTicket: 5,
    });
  });

  it("ignore les participants sans ticket", () => {
    const outcome = drawWeightedWinner(
      [
        { entryId: "zero", tickets: 0 },
        { entryId: "one", tickets: 2 },
      ],
      () => 0,
    );
    expect(outcome?.winnerEntryId).toBe("one");
    expect(outcome?.totalTickets).toBe(2);
  });

  it("renvoie null quand aucun ticket n'est en jeu", () => {
    expect(drawWeightedWinner([], () => 0)).toBeNull();
    expect(drawWeightedWinner([{ entryId: "a", tickets: 0 }], () => 0)).toBeNull();
  });

  it("respecte la pondération sur un grand nombre de tirages", () => {
    // c détient 60 % des tickets : sur les 10 numéros possibles, il doit en
    // remporter exactement 6.
    const wins = Array.from({ length: 10 }, (_, i) =>
      drawWeightedWinner(candidates, () => i)?.winnerEntryId,
    );
    expect(wins.filter((w) => w === "c")).toHaveLength(6);
    expect(wins.filter((w) => w === "b")).toHaveLength(3);
    expect(wins.filter((w) => w === "a")).toHaveLength(1);
  });
});

describe("winChancePercent", () => {
  it("calcule un pourcentage à une décimale", () => {
    expect(winChancePercent(1, 3)).toBe(33.3);
    expect(winChancePercent(5, 10)).toBe(50);
  });

  it("renvoie 0 sur les cas dégénérés", () => {
    expect(winChancePercent(0, 10)).toBe(0);
    expect(winChancePercent(5, 0)).toBe(0);
  });
});
