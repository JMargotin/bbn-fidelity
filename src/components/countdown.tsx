"use client";

import { useEffect, useState } from "react";

function parts(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass-panel min-w-[4.25rem] rounded-2xl px-3 py-2.5 text-center">
      <span className="block font-display text-3xl leading-none text-cream">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.15em] text-lavender-dim">
        {label}
      </span>
    </div>
  );
}

/**
 * Compte à rebours jusqu'au prochain tirage.
 *
 * Le rendu ne démarre qu'après le montage : le serveur et le navigateur ne
 * calculent jamais "maintenant" à la même milliseconde, et afficher la valeur
 * dès le rendu serveur provoquerait une erreur d'hydratation.
 */
export function Countdown({ target }: { target: string }) {
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    const deadline = new Date(target).getTime();
    const tick = () => setMsLeft(deadline - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (msLeft === null) {
    return <div className="h-[4.5rem]" aria-hidden />;
  }

  if (msLeft <= 0) {
    return (
      <p className="font-display text-xl tracking-wide text-cyan">Tirage imminent…</p>
    );
  }

  const { days, hours, minutes, seconds } = parts(msLeft);
  return (
    <div className="flex flex-wrap gap-2" aria-label="Temps restant avant le prochain tirage">
      <Cell value={days} label="jours" />
      <Cell value={hours} label="heures" />
      <Cell value={minutes} label="min" />
      <Cell value={seconds} label="sec" />
    </div>
  );
}
