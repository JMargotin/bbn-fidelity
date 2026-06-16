"use client";

import { useState, type FormEvent } from "react";

type SignupResult = { customerId: string; firstName: string };

export function SignupForm() {
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignupResult | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, phoneInput: phone, rgpdAccepted }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? `Erreur ${response.status}`);
        return;
      }
      setResult(data);
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-magenta/15 text-4xl ring-1 ring-magenta/40 pulse-neon">
          🎉
        </div>
        <div>
          <h2 className="text-3xl">
            <span className="arcade">Bienvenue</span>
            <span className="script mx-2 text-4xl text-magenta-soft">{result.firstName}</span>
            <span className="arcade">!</span>
          </h2>
          <p className="mt-2 text-lavender">
            Ta carte de fidélité BBN est prête. Ajoute-la à ton téléphone.
          </p>
        </div>
        <a
          href={`/api/passes/apple/download/${result.customerId}`}
          className="btn-neon w-full rounded-2xl px-6 py-4 text-lg"
        >
          Ajouter à Apple Wallet
        </a>
        <div className="space-y-1 text-xs text-lavender-dim">
          <p>
            Sur iPhone, ouvre cette page dans <strong className="text-lavender">Safari</strong> puis
            touche le bouton ci-dessus.
          </p>
          <p>Google Wallet arrive bientôt sur Android.</p>
        </div>
        <p className="border-t border-white/10 pt-4 text-xs text-lavender-dim">
          ID client :{" "}
          <code className="rounded bg-night-950/70 px-2 py-1 text-magenta-soft">
            {result.customerId}
          </code>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="arcade text-3xl">Crée ta carte</h2>
        <p className="mt-1 text-sm text-lavender">Gratuit, en 30 secondes.</p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-lavender">Prénom</span>
        <input
          type="text"
          required
          maxLength={50}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="field"
          placeholder="Ton prénom"
          autoFocus
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-lavender">Téléphone</span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="field"
          placeholder="06 12 34 56 78"
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3">
        <input
          type="checkbox"
          required
          checked={rgpdAccepted}
          onChange={(e) => setRgpdAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-magenta"
        />
        <span className="text-xs leading-relaxed text-lavender">
          J'accepte que mes données soient utilisées pour gérer mon programme de fidélité.{" "}
          <a href="/mentions-legales" className="text-magenta-soft underline">
            Mentions légales
          </a>
          .
        </span>
      </label>

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !rgpdAccepted}
        className="btn-neon w-full rounded-2xl px-6 py-4 text-lg"
      >
        {pending ? "Création…" : "Créer ma carte"}
      </button>
    </form>
  );
}
