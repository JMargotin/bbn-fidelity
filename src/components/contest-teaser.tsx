import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { formatDayMonth, formatFullDate } from "@/lib/contest";
import { getActiveContest } from "@/lib/services/contest";

/**
 * Bandeau concours de la page d'accueil.
 *
 * Trois états, pour que la section reste visible pendant tout le cycle de vie
 * du concours :
 *   · "upcoming" — avant l'ouverture : on tease, compte à rebours vers le
 *     lancement et rappel du prix d'un ticket.
 *   · "open"     — pendant : compte à rebours vers le prochain tirage.
 *   · "ended"    — après le dernier tirage : palmarès des gagnants.
 *
 * Ne rend rien uniquement s'il n'existe aucun concours actif en base.
 */
export async function ContestTeaser() {
  const contest = await getActiveContest();
  if (!contest) return null;

  const now = new Date();
  const nextDraw = contest.draws.find((d) => !d.drawnAt) ?? null;
  const winners = contest.draws.filter((d) => d.drawnAt && d.winnerEntry);

  const phase: "upcoming" | "open" | "ended" =
    now < contest.startsAt ? "upcoming" : now > contest.endsAt && !nextDraw ? "ended" : "open";

  // Le compte à rebours vise l'ouverture avant le lancement, puis le tirage.
  const countdownTarget =
    phase === "upcoming" ? contest.startsAt : phase === "open" ? nextDraw?.scheduledFor : null;

  return (
    <section className="neon-frame relative overflow-hidden rounded-3xl">
      {/* Visuel de fond */}
      <Image
        src="/GTA_6_Release.jpg"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="object-cover object-center opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-night-950 via-night-950/85 to-night-950/40" />

      <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[minmax(0,1.15fr)_auto] lg:items-center">
        <div className="space-y-4">
          <span className="chip flicker">
            {phase === "upcoming"
              ? `Jeu-concours · à partir du ${formatDayMonth(contest.startsAt)}`
              : phase === "open"
                ? `Jeu-concours · jusqu'au ${formatDayMonth(contest.endsAt)}`
                : "Jeu-concours · terminé"}
          </span>

          <h2 className="text-4xl sm:text-5xl">
            <span className="arcade block">{phase === "ended" ? "Ils ont gagné" : "Gagne"}</span>
            <span className="script -mt-1 block text-5xl text-magenta-soft sm:text-6xl">
              GTA VI
            </span>
            <span className="arcade arcade-cyan block text-3xl sm:text-4xl">sur PS5</span>
          </h2>

          {phase === "ended" ? (
            <p className="max-w-lg text-lavender">
              Merci à tous les participants ! Le prochain jeu-concours arrive bientôt — garde tes
              points au chaud.
            </p>
          ) : (
            <p className="max-w-lg text-lavender">
              <span className="text-cream">3 exemplaires à gagner, 3 gagnants.</span> Le premier
              ticket est offert ; les suivants s'achètent {contest.pointsPerTicket} points l'unité,
              sans aucune limite de nombre.
            </p>
          )}

          {/* Compte à rebours : ouverture, puis prochain tirage */}
          {countdownTarget && (
            <div className="space-y-2 pt-1">
              <p className="text-xs uppercase tracking-[0.2em] text-lavender-dim">
                {phase === "upcoming"
                  ? "Ouverture dans"
                  : `Prochain tirage · ${formatDayMonth(countdownTarget)}`}
              </p>
              <Countdown target={countdownTarget.toISOString()} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/concours" className="btn-neon rounded-full px-7 py-3.5">
              {phase === "upcoming"
                ? "Voir le concours"
                : phase === "open"
                  ? "Je participe"
                  : "Voir les résultats"}
            </Link>
            {phase === "upcoming" && (
              <span className="text-sm text-lavender-dim">
                Ticket offert à l'ouverture · les suivants à {contest.pointsPerTicket} points ⚡
              </span>
            )}
          </div>
        </div>

        {/* Calendrier des tirages */}
        <div className="glass rounded-2xl p-5 lg:min-w-[15rem]">
          <p className="text-xs uppercase tracking-[0.2em] text-lavender-dim">Les tirages</p>
          <ul className="mt-3 space-y-2.5">
            {contest.draws.map((draw) => {
              const done = Boolean(draw.drawnAt);
              return (
                <li key={draw.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className={done ? "text-lavender-dim" : "text-cream"}>
                    {formatDayMonth(draw.scheduledFor)}
                  </span>
                  <span
                    className={
                      done
                        ? "script text-lg text-magenta-soft"
                        : "text-xs uppercase tracking-wider text-cyan"
                    }
                  >
                    {done ? (draw.winnerEntry?.customer.firstName ?? "—") : "à venir"}
                  </span>
                </li>
              );
            })}
          </ul>

          {winners.length > 0 ? (
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-lavender-dim">
              {winners.length}{" "}
              {winners.length > 1 ? "gagnants déjà désignés" : "gagnant déjà désigné"} 🎉
            </p>
          ) : (
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-lavender-dim">
              Du {formatDayMonth(contest.startsAt)} au {formatFullDate(contest.endsAt)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
