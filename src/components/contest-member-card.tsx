import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { affordableTickets, formatDayMonth, winChancePercent } from "@/lib/contest";
import { getContestStateForCustomer } from "@/lib/services/contest";

/**
 * Section concours de l'espace fidélité (client connecté).
 *
 * Comme le bandeau de la page d'accueil, elle reste visible avant, pendant et
 * après le concours — seul le discours change. Ne rend rien s'il n'existe
 * aucun concours actif en base.
 */
export async function ContestMemberCard({
  customerId,
  pointsTotal,
}: {
  customerId: string;
  pointsTotal: number;
}) {
  const state = await getContestStateForCustomer(customerId);
  if (!state) return null;

  const { contest, entry, totalTickets } = state;
  const now = new Date();
  const nextDraw = contest.draws.find((d) => !d.drawnAt) ?? null;

  const phase: "upcoming" | "open" | "ended" =
    now < contest.startsAt ? "upcoming" : now > contest.endsAt && !nextDraw ? "ended" : "open";

  const myTickets = entry?.tickets ?? 0;
  const extra = affordableTickets(pointsTotal, contest.pointsPerTicket);
  const myWin = contest.draws.find((d) => d.winnerEntry && d.winnerEntryId === entry?.id);

  return (
    <section className="neon-frame relative overflow-hidden rounded-2xl">
      <Image
        src="/GTA_6_Release.jpg"
        alt=""
        aria-hidden
        fill
        sizes="(max-width: 448px) 100vw, 448px"
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night-950/80 via-night-950/88 to-night-950/95" />

      <div className="relative space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="chip">Jeu-concours</span>
            <p className="mt-2 font-display text-xl leading-tight tracking-wide text-cream">
              Gagne GTA VI sur PS5
            </p>
            <p className="mt-0.5 text-xs text-lavender-dim">3 gagnants · 1 lot par personne</p>
          </div>
          <span className="shrink-0 rounded-lg bg-white/[0.06] px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-lavender ring-1 ring-white/10">
            ×3
          </span>
        </div>

        {/* Le gagnant voit d'abord sa victoire. */}
        {myWin ? (
          <div className="rounded-xl bg-gold/10 p-4 text-center ring-1 ring-gold/40">
            <p className="font-display text-lg tracking-wide text-gold">Tu as gagné ! 🎉</p>
            <p className="mt-1 text-xs text-lavender">
              {myWin.label} · on te contacte au {"​"}numéro de ta carte pour la remise du lot.
            </p>
          </div>
        ) : phase === "ended" ? (
          <p className="rounded-xl bg-white/[0.04] p-3 text-sm text-lavender ring-1 ring-white/10">
            Le concours est terminé. Merci d'avoir joué — le prochain arrive bientôt !
          </p>
        ) : (
          <>
            {/* Compteur de tickets — masqué avant l'ouverture, où il afficherait
                un « 0 » en contradiction avec le ticket offert annoncé. */}
            {phase === "open" && (
            <div className="flex items-end justify-between gap-4 border-y border-white/10 py-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-lavender-dim">
                  Mes tickets
                </p>
                <p className="-mt-0.5 flex items-end gap-1.5">
                  <span className="font-display text-grad text-4xl">{myTickets}</span>
                  <span className="mb-1 font-display text-sm text-lavender">
                    {myTickets > 1 ? "tickets" : "ticket"}
                  </span>
                </p>
              </div>
              {myTickets > 0 && totalTickets > 0 && (
                <div className="text-right">
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-lavender-dim">
                    Mes chances
                  </p>
                  <p className="font-display text-2xl text-cyan">
                    {winChancePercent(myTickets, totalTickets)} %
                  </p>
                </div>
              )}
            </div>
            )}

            {/* Incitation : ce que le solde de points permet d'obtenir */}
            <p className="text-sm text-lavender">
              {phase === "upcoming" ? (
                <>
                  Ouverture le{" "}
                  <span className="text-cream">{formatDayMonth(contest.startsAt)}</span> — ton
                  premier ticket est offert. Les suivants s'achètent{" "}
                  {contest.pointsPerTicket} points l'unité.{" "}
                  {extra > 0 && (
                    <>
                      Ton solde actuel t'en paierait{" "}
                      <span className="font-semibold text-cyan">{extra}</span>.
                    </>
                  )}
                </>
              ) : extra > 0 ? (
                <>
                  Avec tes {pointsTotal} points, tu peux acheter{" "}
                  <span className="font-semibold text-cyan">
                    {extra} ticket{extra > 1 ? "s" : ""} de plus
                  </span>{" "}
                  ({contest.pointsPerTicket} points l'unité) — autant de chances en plus.
                </>
              ) : (
                <>
                  Encore {contest.pointsPerTicket - (pointsTotal % contest.pointsPerTicket)} points
                  et tu pourras t'offrir un ticket de plus. Passe commande au camion !
                </>
              )}
            </p>

            {/* Compte à rebours : ouverture, puis prochain tirage */}
            {(phase === "upcoming" || nextDraw) && (
              <div className="space-y-1.5">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-lavender-dim">
                  {phase === "upcoming"
                    ? "Ouverture dans"
                    : `Prochain tirage · ${nextDraw ? formatDayMonth(nextDraw.scheduledFor) : ""}`}
                </p>
                <Countdown
                  target={(phase === "upcoming"
                    ? contest.startsAt
                    : (nextDraw?.scheduledFor ?? contest.startsAt)
                  ).toISOString()}
                />
              </div>
            )}
          </>
        )}

        <Link
          href="/concours"
          className={
            phase === "open" && !myWin
              ? "btn-neon w-full rounded-xl px-5 py-3 text-sm"
              : "btn-ghost w-full rounded-xl px-5 py-3 text-sm font-semibold"
          }
        >
          {phase === "open" && !myWin
            ? "Prendre des tickets"
            : phase === "upcoming"
              ? "Découvrir le concours"
              : "Voir les résultats"}
        </Link>
      </div>
    </section>
  );
}
