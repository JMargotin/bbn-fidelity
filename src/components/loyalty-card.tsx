import Image from "next/image";

// Decorative 11×11 QR-like glyph used in the mockup card. Pure visual.
const QR_PATTERN: ReadonlyArray<ReadonlyArray<0 | 1>> = [
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0],
  [1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
];

function MockQr() {
  return (
    <svg
      viewBox="0 0 11 11"
      className="h-full w-full"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect width="11" height="11" fill="#08030f" />
      {QR_PATTERN.flatMap((row, y) =>
        row.map((cell, x) =>
          cell ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#fff4fb" /> : null,
        ),
      )}
    </svg>
  );
}

export function LoyaltyCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute inset-0 translate-x-5 translate-y-6 rotate-6 rounded-[1.75rem] border border-white/10 bg-night-800/50" />
      <div className="float-card neon-frame card-pass relative overflow-hidden rounded-[1.75rem] p-6">
        <div className="pointer-events-none absolute -inset-x-10 -top-24 h-40 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative h-9 w-9 overflow-hidden rounded-lg ring-1 ring-white/20">
              <Image
                src="/brand/logo.png"
                alt="Burger by Night"
                fill
                sizes="36px"
                className="object-cover"
              />
            </span>
            <span className="leading-none">
              <span className="block font-display text-sm tracking-wide text-cream">BBN</span>
              <span className="block script text-sm text-magenta-soft">club</span>
            </span>
          </div>
          <span className="chip">Membre</span>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.25em] text-lavender-dim">Mes points</p>
          <p className="-mt-1 flex items-end gap-2">
            <span className="font-display text-grad text-6xl">240</span>
            <span className="mb-2 font-display text-xl text-lavender">pts</span>
          </p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-lavender-dim">Titulaire</p>
            <p className="font-display text-lg tracking-wide text-cream">Alex D.</p>
            <p className="mt-2 text-[0.65rem] text-lavender-dim">
              Plus que <span className="text-cyan">60 pts</span> → burger offert
            </p>
          </div>
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream/95 p-1.5 ring-1 ring-white/30">
            <MockQr />
          </div>
        </div>
      </div>
    </div>
  );
}
