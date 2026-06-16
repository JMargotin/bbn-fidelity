"use client";

import { useEffect, useState, type FormEvent } from "react";

type Reward = {
  id: string;
  label: string;
  thresholdPoints: number;
  active: boolean;
};

export function RewardsList() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [label, setLabel] = useState("");
  const [threshold, setThreshold] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/rewards");
    const body = await res.json();
    setRewards(body.rewards);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, thresholdPoints: Number.parseInt(threshold, 10) }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? `Erreur ${res.status}`);
        return;
      }
      setLabel("");
      setThreshold("");
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(reward: Reward) {
    await fetch(`/api/rewards/${reward.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !reward.active }),
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="glass flex flex-wrap gap-2 rounded-2xl p-4">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Libellé (ex: Burger offert)"
          required
          className="field flex-1"
        />
        <input
          type="number"
          min={1}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="Seuil (pts)"
          required
          className="field w-32"
        />
        <button type="submit" disabled={pending} className="btn-neon rounded-xl px-5">
          Ajouter
        </button>
      </form>

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {rewards.map((r) => (
          <li
            key={r.id}
            className={`glass flex items-center justify-between rounded-2xl p-4 ${
              r.active ? "" : "opacity-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-magenta/15 font-display text-magenta-soft ring-1 ring-magenta/30">
                {r.thresholdPoints}
              </span>
              <div>
                <p className="font-semibold text-cream">{r.label}</p>
                <p className="text-xs text-lavender-dim">{r.thresholdPoints} points</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleActive(r)}
              className="btn-ghost rounded-full px-4 py-1.5 text-sm"
            >
              {r.active ? "Désactiver" : "Activer"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
