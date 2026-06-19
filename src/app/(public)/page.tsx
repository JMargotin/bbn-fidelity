import Link from "next/link";
import { LoyaltyCard } from "@/components/loyalty-card";
import { RewardTiers } from "@/components/reward-tiers";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  {
    n: "1",
    t: "Crée ta carte",
    d: "Ton prénom, ton numéro, et c'est dans la poche. Direct dans Apple Wallet.",
  },
  {
    n: "2",
    t: "Montre ton QR",
    d: "À chaque commande, on scanne ta carte. Tes points tombent automatiquement.",
  },
  {
    n: "3",
    t: "Profite",
    d: "Dès le palier atteint, on déduit ta récompense. Boisson, burger, menu offerts !",
  },
];

export default function Home() {
  return (
    <div className="space-y-20 py-6 sm:py-10">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <span className="chip flicker reveal" style={{ animationDelay: "0s" }}>
            Programme de fidélité
          </span>
          <h1 className="reveal" style={{ animationDelay: "0.08s" }}>
            <span className="arcade block text-5xl sm:text-6xl lg:text-7xl">Chaque burger</span>
            <span className="script -mt-1 block text-6xl text-magenta-soft sm:text-7xl">
              te rapproche
            </span>
            <span className="arcade arcade-cyan block text-5xl sm:text-6xl lg:text-7xl">
              du gratuit
            </span>
          </h1>
          <p
            className="reveal max-w-md text-lg text-lavender"
            style={{ animationDelay: "0.16s" }}
          >
            1 € dépensé = 1 point. Cumule tes points à chaque commande et débloque boissons,
            burgers et menus offerts. Ta carte vit dans ton téléphone.
          </p>
          <div
            className="reveal flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.24s" }}
          >
            <Link href="/fidelite" className="btn-neon rounded-full px-8 py-4 text-lg">
              Créer ma carte
            </Link>
            <span className="text-sm text-lavender-dim">Gratuit · 30 secondes ⚡</span>
          </div>
        </div>

        <div className="reveal relative py-6" style={{ animationDelay: "0.2s" }}>
          <LoyaltyCard />
        </div>
      </section>

      <section className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-4xl sm:text-5xl">
            <span className="arcade">Tes</span>{" "}
            <span className="script text-5xl text-magenta-soft sm:text-6xl">récompenses</span>
          </h2>
          <p className="text-sm text-lavender">Plus tu commandes, plus tu gagnes.</p>
        </div>
        <RewardTiers />
      </section>

      <section className="space-y-7">
        <h2 className="text-4xl sm:text-5xl">
          <span className="arcade">Comment ça</span>{" "}
          <span className="script text-5xl text-cyan sm:text-6xl">marche</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
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

      <section className="neon-frame glass relative overflow-hidden rounded-3xl px-6 py-14 text-center">
        <h2 className="text-4xl sm:text-6xl">
          <span className="arcade">Prêt à</span>{" "}
          <span className="script text-5xl text-magenta-soft sm:text-7xl">cumuler</span>
          <span className="arcade"> ?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lavender">
          Rejoins le crew BBN. Ta première commande te rapporte déjà des points.
        </p>
        <Link
          href="/fidelite"
          className="btn-neon mt-8 inline-flex rounded-full px-9 py-4 text-lg"
        >
          Rejoindre le programme
        </Link>
      </section>
    </div>
  );
}
