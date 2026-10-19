import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { formatDayMonth, formatFullDate, winChancePercent } from "@/lib/contest";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getContestStateForCustomer, isContestOpen } from "@/lib/services/contest";
import { type ShopStatus, TicketShop } from "./ticket-shop";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jeu-concours GTA VI — Burger by Night",
  description:
    "Cumule des tickets avec tes points de fidélité et tente de gagner GTA VI sur PS5. 3 tirages, 3 gagnants.",
};

const STEPS = [
  {
    n: "1",
    t: "Commande",
    d: "1 € dépensé = 1 point. Chaque commande au camion gonfle ton solde.",
  },
  {
    n: "2",
    t: "Achète tes tickets",
    d: "1 ticket = 5 points, débités de ton solde. Aucune limite : plus tu en achètes, plus tu as de chances.",
  },
  {
    n: "3",
    t: "Croise les doigts",
    d: "Tirage au sort chaque semaine. Les gagnants sont prévenus par téléphone.",
  },
];

export default async function ConcoursPage() {
  const customer = await getCurrentCustomer();
  const state = await getContestStateForCustomer(customer?.id ?? null);

  if (!state) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-16 text-center">
        <span className="chip">Jeu-concours</span>
        <h1 className="text-4xl sm:text-5xl">
          <span className="arcade">Aucun concours</span>{" "}
          <span className="script text-5xl text-magenta-soft sm:text-6xl">en cours</span>
        </h1>
        <p className="text-lavender">
          Reviens vite : le prochain jeu-concours arrive bientôt. En attendant, cumule tes points !
        </p>
        <Link href="/fidelite" className="btn-neon inline-flex rounded-full px-8 py-4">
          Ma carte de fidélité
        </Link>
      </div>
    );
  }

  const { contest, entry, totalTickets, participantCount } = state;
  const now = new Date();
  const open = contest.active && isContestOpen(contest, now);

  const pendingDraws = contest.draws.filter((d) => !d.drawnAt);
  const nextDraw = pendingDraws[0] ?? null;
  const myTickets = entry?.tickets ?? 0;
  // Les tickets restent valables pour tous les tirages : on peut donc encore
  // vendre tant qu'un tirage n'a pas eu lieu.
  const shopStatus: ShopStatus =
    now < contest.startsAt ? "upcoming" : open && pendingDraws.length > 0 ? "open" : "closed";

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="space-y-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="chip flicker reveal">Jeu-concours · 100 % gratuit</span>
            <h1 className="reveal" style={{ animationDelay: "0.08s" }}>
              <span className="arcade block text-5xl sm:text-6xl lg:text-7xl">Gagne</span>
              <span className="script -mt-1 block text-6xl text-magenta-soft sm:text-7xl">
                GTA VI
              </span>
              <span className="arcade arcade-cyan block text-4xl sm:text-5xl lg:text-6xl">
                sur PS5
              </span>
            </h1>
            <p
              className="reveal max-w-md text-lg text-lavender"
              style={{ animationDelay: "0.16s" }}
            >
              Du {formatDayMonth(contest.startsAt)} au {formatFullDate(contest.endsAt)}.{" "}
              <span className="text-cream">3 tirages, 3 gagnants.</span> Achète tes tickets avec
              tes points de fidélité et multiplie tes chances.
            </p>

            <div className="reveal flex flex-wrap gap-2" style={{ animationDelay: "0.2s" }}>
              <span className="glass-panel rounded-xl px-3 py-2 text-sm">
                <span className="font-display text-gold">
                  {contest.pointsPerTicket} pts
                </span>{" "}
                <span className="text-lavender-dim">= 1 ticket</span>
              </span>
              <span className="glass-panel rounded-xl px-3 py-2 text-sm">
                <span className="font-display text-cyan">1 ticket</span>{" "}
                <span className="text-lavender-dim">offert à l'inscription</span>
              </span>
              <span className="glass-panel rounded-xl px-3 py-2 text-sm">
                <span className="font-display text-magenta-soft">Illimité</span>{" "}
                <span className="text-lavender-dim">aucun plafond</span>
              </span>
            </div>

            {nextDraw && (
              <div className="reveal space-y-2" style={{ animationDelay: "0.24s" }}>
                <p className="text-xs uppercase tracking-[0.2em] text-lavender-dim">
                  Prochain tirage · {formatDayMonth(nextDraw.scheduledFor)}
                </p>
                <Countdown target={nextDraw.scheduledFor.toISOString()} />
              </div>
            )}
          </div>

          <div className="reveal relative" style={{ animationDelay: "0.2s" }}>
            <div className="neon-frame float-card relative aspect-video overflow-hidden rounded-3xl ring-1 ring-white/10">
              <Image
                src="/GTA_6_Release.jpg"
                alt="Grand Theft Auto VI"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                <div>
                  <p className="font-display text-2xl tracking-wide text-cream">GTA VI</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">
                    Édition PlayStation 5
                  </p>
                </div>
                <span className="chip shrink-0">×3 à gagner</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── Tickets : achat ou invitation ──────────────── */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        {customer ? (
          <TicketShop
            pointsPerTicket={contest.pointsPerTicket}
            pointsTotal={customer.pointsTotal}
            tickets={myTickets}
            totalTickets={totalTickets}
            status={shopStatus}
            startsAtLabel={formatFullDate(contest.startsAt)}
          />
        ) : (
          <div className="neon-frame card-pass relative overflow-hidden rounded-3xl p-6">
            <h2 className="text-3xl">
              <span className="arcade">Ton 1er ticket</span>{" "}
              <span className="script text-4xl text-magenta-soft">offert</span>
            </h2>
            <p className="mt-3 text-sm text-lavender">
              Crée ta carte de fidélité — c'est gratuit et ça prend 30 secondes. Un ticket t'est
              offert d'office, et tes points te permettent d'en prendre autant que tu veux.
            </p>
            <Link href="/fidelite" className="btn-neon mt-6 w-full rounded-2xl px-6 py-4 text-lg">
              Je participe
            </Link>
            <p className="mt-3 text-center text-xs text-lavender-dim">
              Déjà membre ? Connecte-toi avec ton numéro et ton code PIN.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="glass rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-lavender-dim">
              Le concours en direct
            </p>
            <dl className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-lavender">Participants</dt>
                <dd className="font-display text-2xl text-cream">{participantCount}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-lavender">Tickets en jeu</dt>
                <dd className="font-display text-2xl text-cream">{totalTickets}</dd>
              </div>
              {customer && myTickets > 0 && (
                <div className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-3">
                  <dt className="text-sm text-lavender">Mes chances</dt>
                  <dd className="font-display text-2xl text-cyan">
                    {winChancePercent(myTickets, totalTickets)} %
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <p className="font-display text-lg tracking-wide text-cream">
              Pourquoi prendre plusieurs tickets ?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-lavender">
              Chaque ticket est une chance supplémentaire : avec 10 tickets, tu as 10 fois plus de
              chances qu'avec 1. Et comme les tickets sont{" "}
              <span className="text-cream">conservés pour les 3 tirages</span>, ceux que tu prends
              aujourd'hui rejouent automatiquement la semaine prochaine.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────── Comment ça marche ───────────────────── */}
      <section className="space-y-7">
        <h2 className="text-4xl sm:text-5xl">
          <span className="arcade">Comment</span>{" "}
          <span className="script text-5xl text-cyan sm:text-6xl">participer</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="glass-panel reveal relative overflow-hidden rounded-2xl p-6"
              style={{ animationDelay: `${0.1 + 0.1 * i}s` }}
            >
              <span className="arcade block text-6xl text-gold">{step.n}</span>
              <p className="mt-3 font-display text-xl tracking-wide text-cream">{step.t}</p>
              <p className="mt-2 text-sm text-lavender">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── Les 3 tirages ─────────────────────── */}
      <section className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-4xl sm:text-5xl">
            <span className="arcade">Les</span>{" "}
            <span className="script text-5xl text-magenta-soft sm:text-6xl">tirages</span>
          </h2>
          <p className="text-sm text-lavender">1 gagnant par tirage · 1 seul lot par personne</p>
        </div>

        <ol className="grid gap-4 sm:grid-cols-3">
          {contest.draws.map((draw) => {
            const done = Boolean(draw.drawnAt);
            const isNext = draw.id === nextDraw?.id;
            return (
              <li
                key={draw.id}
                className={`relative overflow-hidden rounded-2xl p-6 ${
                  isNext ? "neon-frame glass" : "glass-panel"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-lavender-dim">
                    {draw.label}
                  </span>
                  {done ? (
                    <span className="rounded-full bg-cyan/15 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-cyan ring-1 ring-cyan/40">
                      Tiré
                    </span>
                  ) : isNext ? (
                    <span className="chip">À venir</span>
                  ) : null}
                </div>

                <p className="mt-3 font-display text-2xl tracking-wide text-cream">
                  {formatDayMonth(draw.scheduledFor)}
                </p>

                {done && draw.winnerEntry ? (
                  <p className="mt-2 text-sm text-lavender">
                    Gagnant :{" "}
                    <span className="script text-xl text-magenta-soft">
                      {draw.winnerEntry.customer.firstName}
                    </span>
                    {draw.totalTickets ? (
                      <span className="mt-1 block text-xs text-lavender-dim">
                        Ticket n°{draw.winningTicket} sur {draw.totalTickets}
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-lavender-dim">
                    {done ? "Aucun participant éligible" : "Gagnant non encore désigné"}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ─────────────────────────── CTA ─────────────────────────── */}
      <section className="neon-frame glass relative overflow-hidden rounded-3xl px-6 py-14 text-center">
        <h2 className="text-4xl sm:text-6xl">
          <span className="arcade">Tente ta</span>{" "}
          <span className="script text-5xl text-magenta-soft sm:text-7xl">chance</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lavender">
          Un burger, des points, des tickets. C'est tout ce qui te sépare de GTA VI.
        </p>
        <Link
          href={customer ? "/fidelite" : "/fidelite"}
          className="btn-neon mt-8 inline-flex rounded-full px-9 py-4 text-lg"
        >
          {customer ? "Voir ma carte" : "Créer ma carte"}
        </Link>
        <p className="mt-6 text-xs text-lavender-dim">
          Jeu gratuit sans obligation d'achat ·{" "}
          <Link href="/concours/reglement" className="underline hover:text-magenta-soft">
            Règlement complet
          </Link>
        </p>
      </section>
    </div>
  );
}
