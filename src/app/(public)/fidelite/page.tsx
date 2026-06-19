import Image from "next/image";
import QRCode from "qrcode";
import { getCurrentCustomer } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";
import { signQrToken } from "@/lib/services/qr";
import { compactRewardLabel, loadActiveRewards } from "@/lib/wallet/rewards";
import { FideliteAuth } from "./fidelite-auth";
import { InstallPrompt } from "./install-prompt";
import { LogoutButton } from "./logout-button";

// Always render fresh (points/QR/announcements change per request).
export const dynamic = "force-dynamic";

export default async function FidelitePage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="glass rounded-3xl p-6">
          <FideliteAuth />
        </div>
      </div>
    );
  }

  const token = await signQrToken({ customerId: customer.id });
  const qrDataUrl = await QRCode.toDataURL(token, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#08030f", light: "#ffffff" },
  });

  const rewards = await loadActiveRewards();
  const announcement = await prisma.announcement.findFirst({ orderBy: { createdAt: "desc" } });

  const nextReward = rewards.find((r) => r.thresholdPoints > customer.pointsTotal);
  const missing = nextReward ? nextReward.thresholdPoints - customer.pointsTotal : 0;

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-lavender-dim">Espace fidélité</p>
          <h1 className="text-2xl">
            <span className="arcade">Salut</span>
            <span className="script ml-2 text-3xl text-magenta-soft">{customer.firstName}</span>
          </h1>
        </div>
        <LogoutButton />
      </div>

      {/* Loyalty card */}
      <div className="neon-frame card-pass relative overflow-hidden rounded-[1.75rem] p-6">
        <div className="pointer-events-none absolute -inset-x-10 -top-24 h-40 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative h-9 w-9 overflow-hidden rounded-lg ring-1 ring-white/20">
              <Image src="/brand/logo.png" alt="Burger by Night" fill sizes="36px" className="object-cover" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-sm tracking-wide text-cream">BBN</span>
              <span className="block script text-sm text-magenta-soft">club</span>
            </span>
          </div>
          <span className="chip">Membre</span>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.25em] text-lavender-dim">Mes points</p>
          <p className="-mt-1 flex items-end gap-2">
            <span className="font-display text-grad text-6xl">{customer.pointsTotal}</span>
            <span className="mb-2 font-display text-xl text-lavender">pts</span>
          </p>
          {nextReward && (
            <p className="mt-1 text-xs text-lavender-dim">
              Plus que <span className="text-cyan">{missing} pts</span> →{" "}
              {compactRewardLabel(nextReward.label)}
            </p>
          )}
        </div>

        {/* Real QR — staff scans this to credit points / redeem rewards */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {/* biome-ignore lint/performance/noImgElement: data-URL QR, not a static asset */}
          <img
            src={qrDataUrl}
            alt="QR code de ta carte de fidélité"
            className="h-56 w-56 rounded-2xl bg-cream p-2 ring-1 ring-white/30"
          />
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-lavender-dim">
            Montre ce QR au camion
          </p>
        </div>
      </div>

      {/* Add to home screen */}
      <InstallPrompt />

      {/* Apple Wallet */}
      <a
        href={`/api/passes/apple/download/${customer.id}`}
        className="btn-ghost block w-full rounded-2xl px-6 py-3 text-center text-sm font-semibold"
      >
         Ajouter à Apple Wallet (iPhone)
      </a>

      {/* Announcement */}
      {announcement && (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm font-semibold text-cream">{announcement.title}</p>
          <p className="mt-1 text-sm text-lavender">{announcement.body}</p>
        </div>
      )}

      {/* Rewards list */}
      <div className="glass rounded-2xl p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-lavender-dim">Récompenses</p>
        <ul className="space-y-1.5">
          {rewards.map((r) => {
            const unlocked = customer.pointsTotal >= r.thresholdPoints;
            return (
              <li key={`${r.label}-${r.thresholdPoints}`} className="flex items-center justify-between text-sm">
                <span className={unlocked ? "text-cream" : "text-lavender"}>{r.label}</span>
                <span className={unlocked ? "font-display text-cyan" : "text-lavender-dim"}>
                  {unlocked ? "✓ débloqué" : `${r.thresholdPoints} pts`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-center text-xs text-lavender-dim">
        1€ dépensé = 1 point · Contact : 06 03 25 07 23
      </p>
    </div>
  );
}
