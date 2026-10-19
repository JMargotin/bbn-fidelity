import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatDateTime, formatFullDate, winChancePercent } from "@/lib/contest";
import { prisma } from "@/lib/prisma";
import { getActiveContest } from "@/lib/services/contest";
import { DrawButton } from "./draw-button";

export const dynamic = "force-dynamic";

export default async function AdminConcoursPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin/scan");

  const contest = await getActiveContest();

  if (!contest) {
    return (
      <div className="glass rounded-2xl p-6">
        <h1 className="arcade text-2xl">Concours</h1>
        <p className="mt-2 text-sm text-lavender">
          Aucun concours actif. Lance <code className="text-cream">npm run db:seed</code> pour créer
          l'édition GTA VI.
        </p>
      </div>
    );
  }

  const entries = await prisma.contestEntry.findMany({
    where: { contestId: contest.id },
    orderBy: [{ tickets: "desc" }, { createdAt: "asc" }],
    include: { customer: { select: { firstName: true, phoneE164: true, deletedAt: true } } },
  });

  const totalTickets = entries.reduce((sum, e) => sum + e.tickets, 0);
  const totalPointsSpent = entries.reduce((sum, e) => sum + e.pointsSpent, 0);
  const winnerEntryIds = new Set(
    contest.draws.flatMap((d) => (d.winnerEntryId ? [d.winnerEntryId] : [])),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">
            <span className="arcade">Jeu-</span>
            <span className="script text-4xl text-magenta-soft">concours</span>
          </h1>
          <p className="mt-1 text-sm text-lavender-dim">
            {contest.name} · du {formatFullDate(contest.startsAt)} au{" "}
            {formatFullDate(contest.endsAt)}
          </p>
        </div>
        <span className="chip">{contest.pointsPerTicket} pts = 1 ticket</span>
      </header>

      {/* Chiffres clés */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Participants", value: entries.length },
          { label: "Tickets en jeu", value: totalTickets },
          { label: "Points convertis", value: totalPointsSpent },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-lavender-dim">{stat.label}</p>
            <p className="mt-1 font-display text-3xl text-cream">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tirages */}
      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-wide text-cream">Tirages</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {contest.draws.map((draw) => {
            const done = Boolean(draw.drawnAt);
            return (
              <div key={draw.id} className="glass flex flex-col gap-3 rounded-2xl p-4">
                <div>
                  <p className="font-display text-lg tracking-wide text-cream">{draw.label}</p>
                  <p className="text-xs text-lavender-dim">
                    Prévu le {formatFullDate(draw.scheduledFor)}
                  </p>
                </div>

                {done ? (
                  <div className="rounded-xl bg-cyan/10 p-3 ring-1 ring-cyan/30">
                    <p className="text-xs uppercase tracking-wider text-cyan">Gagnant</p>
                    <p className="mt-0.5 font-semibold text-cream">
                      {draw.winnerEntry?.customer.firstName ?? "—"}
                    </p>
                    <p className="text-sm text-lavender">
                      {/* Numéro nécessaire pour contacter le gagnant. */}
                      {(
                        entries.find((e) => e.id === draw.winnerEntryId)?.customer.phoneE164 ?? "—"
                      )}
                    </p>
                    <p className="mt-2 text-[0.7rem] text-lavender-dim">
                      Ticket n°{draw.winningTicket} / {draw.totalTickets} · tiré le{" "}
                      {draw.drawnAt ? formatDateTime(draw.drawnAt) : "—"}
                    </p>
                  </div>
                ) : (
                  <DrawButton drawId={draw.id} label={draw.label} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-lavender-dim">
          Le tirage est pondéré par le nombre de tickets. Les gagnants précédents sont
          automatiquement exclus des tirages suivants.
        </p>
      </section>

      {/* Participants */}
      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-wide text-cream">
          Participants ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <p className="glass rounded-2xl p-4 text-sm text-lavender">
            Aucun participant pour le moment.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry, i) => (
              <li
                key={entry.id}
                className={`glass flex items-center justify-between gap-3 rounded-2xl p-3.5 ${
                  entry.customer.deletedAt ? "opacity-40" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 shrink-0 text-right font-display text-sm text-lavender-dim">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-cream">
                      {entry.customer.firstName}
                      {winnerEntryIds.has(entry.id) && (
                        <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-gold ring-1 ring-gold/40">
                          Gagnant
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-lavender-dim">
                      {entry.customer.phoneE164} · {entry.pointsSpent} pts convertis
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl text-cream">{entry.tickets}</p>
                  <p className="text-[0.65rem] text-lavender-dim">
                    {winChancePercent(entry.tickets, totalTickets)} %
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
