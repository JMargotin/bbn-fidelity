"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_TICKETS_PER_PURCHASE, affordableTickets, winChancePercent } from "@/lib/contest";

/** "upcoming" = pas encore ouvert, "closed" = terminé ou tous les tirages passés. */
export type ShopStatus = "upcoming" | "open" | "closed";

type Props = {
  pointsPerTicket: number;
  pointsTotal: number;
  tickets: number;
  totalTickets: number;
  status: ShopStatus;
  /** Date d'ouverture, affichée quand le concours n'a pas encore commencé. */
  startsAtLabel?: string;
};

/** Paliers proposés en un clic — l'achat groupé est mis en avant. */
const PRESETS = [1, 3, 5, 10];

export function TicketShop({
  pointsPerTicket,
  pointsTotal,
  tickets,
  totalTickets,
  status,
  startsAtLabel,
}: Props) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const maxAffordable = Math.min(
    affordableTickets(pointsTotal, pointsPerTicket),
    MAX_TICKETS_PER_PURCHASE,
  );
  const cost = quantity * pointsPerTicket;
  const canBuy = status === "open" && quantity > 0 && cost <= pointsTotal;

  // Chances actuelles vs. chances après l'achat — le cœur de l'incitation.
  const currentChance = winChancePercent(tickets, totalTickets);
  const nextChance = winChancePercent(tickets + quantity, totalTickets + quantity);

  async function buy() {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const res = await fetch("/api/concours/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setSuccess(
        `+${data.quantity} ticket${data.quantity > 1 ? "s" : ""} ! Tu en as maintenant ${data.tickets}.`,
      );
      setQuantity(1);
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="neon-frame card-pass relative overflow-hidden rounded-3xl p-6">
      <div className="pointer-events-none absolute -inset-x-10 -top-24 h-40 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-lavender-dim">Mes tickets</p>
          <p className="-mt-1 flex items-end gap-2">
            <span className="font-display text-grad text-6xl">{tickets}</span>
            <span className="mb-2 font-display text-xl text-lavender">
              ticket{tickets > 1 ? "s" : ""}
            </span>
          </p>
          {totalTickets > 0 && tickets > 0 && (
            <p className="mt-1 text-xs text-lavender-dim">
              Soit <span className="text-cyan">{currentChance} %</span> de chances au prochain
              tirage
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-lavender-dim">Mes points</p>
          <p className="font-display text-2xl text-cream">{pointsTotal}</p>
        </div>
      </div>

      {status !== "open" ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-lavender">
          {status === "upcoming"
            ? `Le concours ouvre le ${startsAtLabel}. Les tickets s'achèteront ici, ${pointsPerTicket} points l'unité, prélevés sur ton solde.`
            : "La vente de tickets est terminée. Rendez-vous aux résultats des tirages !"}
        </p>
      ) : (
        <>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-cream">
              Ajoute des tickets{" "}
              <span className="text-lavender-dim">· {pointsPerTicket} pts l'unité</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((n) => {
                const tooExpensive = n * pointsPerTicket > pointsTotal;
                const selected = quantity === n;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={tooExpensive}
                    onClick={() => setQuantity(n)}
                    className={
                      selected
                        ? "rounded-xl bg-magenta/25 px-4 py-2.5 text-sm font-semibold text-cream ring-1 ring-magenta/60"
                        : "rounded-xl bg-white/[0.04] px-4 py-2.5 text-sm text-lavender ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-cream disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/[0.04]"
                    }
                  >
                    <span className="font-display">+{n}</span>
                    <span className="ml-1.5 text-xs opacity-70">{n * pointsPerTicket} pts</span>
                  </button>
                );
              })}
              {maxAffordable > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(maxAffordable)}
                  className="rounded-xl bg-cyan/10 px-4 py-2.5 text-sm text-cyan ring-1 ring-cyan/40 transition hover:bg-cyan/20"
                >
                  <span className="font-display">MAX</span>
                  <span className="ml-1.5 text-xs opacity-80">{maxAffordable}</span>
                </button>
              )}
            </div>

            {maxAffordable === 0 && (
              <p className="mt-3 text-xs text-lavender-dim">
                Il te faut {pointsPerTicket} points pour un ticket. Passe commande au camion pour
                en cumuler !
              </p>
            )}

            {quantity > 0 && maxAffordable > 0 && nextChance > currentChance && (
              <p className="mt-3 text-xs text-lavender">
                Tes chances passeraient de{" "}
                <span className="text-lavender-dim">{currentChance} %</span> à{" "}
                <span className="font-semibold text-cyan">{nextChance} %</span>
              </p>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-xl border border-cyan/40 bg-cyan/10 p-3 text-sm text-cyan">
              {success}
            </p>
          )}

          <button
            type="button"
            onClick={buy}
            disabled={!canBuy || pending}
            className="btn-neon mt-5 w-full rounded-2xl px-6 py-4 text-lg"
          >
            {pending
              ? "…"
              : `Prendre ${quantity} ticket${quantity > 1 ? "s" : ""} · ${cost} pts`}
          </button>
        </>
      )}
    </div>
  );
}
