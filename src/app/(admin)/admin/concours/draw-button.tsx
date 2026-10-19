"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DrawButton({ drawId, label }: { drawId: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    // Action irréversible : on confirme avant de tirer.
    if (!confirm(`Lancer le ${label} ? Le gagnant sera désigné définitivement.`)) return;

    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/concours/draws/${drawId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      router.refresh();
    } catch {
      setError("Connexion impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="btn-neon w-full rounded-xl px-4 py-2.5 text-sm"
      >
        {pending ? "Tirage…" : "Lancer le tirage"}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
