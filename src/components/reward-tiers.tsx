import { prisma } from "@/lib/prisma";

const FALLBACK_REWARDS = [
  { id: "f1", label: "Boisson offerte", thresholdPoints: 50 },
  { id: "f2", label: "Burger offert", thresholdPoints: 100 },
  { id: "f3", label: "Menu offert", thresholdPoints: 200 },
];

const TIER_COLORS = ["#2de2ff", "#ff1f8f", "#ffd23f", "#b026ff"] as const;

const ICONS = {
  cup: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden>
      <path d="M19 4 L22 9" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8 9 H24 L22.4 12 H9.6 Z"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.8 12 L11.4 27 H20.6 L22.2 12"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.7 18 H21.3" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  ),
  burger: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M5 13 C5 8.5 10 6 16 6 C22 6 27 8.5 27 13 Z"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M5 16 C9 14 23 14 27 16"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 20 H26" strokeWidth={1.6} strokeLinecap="round" />
      <path
        d="M7 23 C7 25.5 10 26 13 26 H19 C22 26 25 25.5 25 23 Z"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  ),
  fries: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden>
      <path d="M11 15 V7" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M14.5 15 V5" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M17.5 15 V6" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M21 15 V8" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M9 14 L10.6 27 H21.4 L23 14 Z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M9.6 18 H22.4" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden>
      <path d="M6 14 H26 V26 H6 Z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M5 11 H27 V14 H5 Z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M16 11 V26" strokeWidth={1.6} />
      <path
        d="M16 11 C13 11 10.5 8.5 12.5 6 C14.5 4.5 16 8.5 16 11"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M16 11 C19 11 21.5 8.5 19.5 6 C17.5 4.5 16 8.5 16 11"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  ),
} as const;

function pickIcon(label: string): keyof typeof ICONS {
  const l = label.toLowerCase();
  if (l.includes("boisson") || l.includes("soda") || l.includes("drink")) return "cup";
  if (l.includes("burger") || l.includes("sandwich")) return "burger";
  if (l.includes("menu") || l.includes("frite")) return "fries";
  return "gift";
}

export async function RewardTiers() {
  const dbRewards = await prisma.reward.findMany({
    where: { active: true },
    orderBy: { thresholdPoints: "asc" },
    select: { id: true, label: true, thresholdPoints: true },
  });
  const rewards = dbRewards.length > 0 ? dbRewards : FALLBACK_REWARDS;

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {rewards.map((reward, i) => {
        const color = TIER_COLORS[i % TIER_COLORS.length];
        return (
          <div
            key={reward.id}
            className="group reveal glass relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl p-7 text-center transition-transform duration-300 hover:-translate-y-1.5"
            style={{ animationDelay: `${0.15 + 0.1 * i}s` }}
          >
            <div
              className="absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-50"
              style={{ background: color }}
            />
            <span className="chip relative">Palier {i + 1}</span>
            <div className="reward-halo relative" style={{ color }}>
              {ICONS[pickIcon(reward.label)]}
            </div>
            <div className="relative">
              <span className="arcade glow-self text-6xl" style={{ color }}>
                {reward.thresholdPoints}
              </span>
              <span className="ml-1 align-top font-display text-lg text-lavender">pts</span>
            </div>
            <p className="relative font-display text-xl tracking-wide text-cream">{reward.label}</p>
          </div>
        );
      })}
    </div>
  );
}
