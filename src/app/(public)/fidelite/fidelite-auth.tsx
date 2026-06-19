"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Step = "phone" | "login" | "signup";

const PIN_HINT = "4 chiffres";

export function FideliteAuth() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [knownName, setKnownName] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [pin, setPin] = useState("");
  const [rgpd, setRgpd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resetTo(next: Step) {
    setError(null);
    setPin("");
    setStep(next);
  }

  async function checkPhone(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/fidelite/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneInput: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Numéro invalide");
        return;
      }
      if (data.exists) {
        setKnownName(data.firstName ?? null);
        resetTo("login");
      } else {
        resetTo("signup");
      }
    } finally {
      setPending(false);
    }
  }

  async function submitAuth(e: FormEvent, kind: "login" | "signup") {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body =
        kind === "login"
          ? { phoneInput: phone, pin }
          : { phoneInput: phone, pin, firstName, rgpdAccepted: rgpd };
      const res = await fetch(`/api/fidelite/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const errorBox = error && (
    <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
      {error}
    </p>
  );

  if (step === "phone") {
    return (
      <form onSubmit={checkPhone} className="space-y-5">
        <div>
          <h2 className="arcade text-3xl">Mon espace fidélité</h2>
          <p className="mt-1 text-sm text-lavender">
            Entre ton numéro pour accéder à ta carte ou en créer une.
          </p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-lavender">Téléphone</span>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field"
            placeholder="06 12 34 56 78"
            autoFocus
          />
        </label>
        {errorBox}
        <button type="submit" disabled={pending} className="btn-neon w-full rounded-2xl px-6 py-4 text-lg">
          {pending ? "…" : "Continuer"}
        </button>
      </form>
    );
  }

  if (step === "login") {
    return (
      <form onSubmit={(e) => submitAuth(e, "login")} className="space-y-5">
        <div>
          <h2 className="text-3xl">
            <span className="arcade">Re-bonjour</span>
            {knownName && (
              <span className="script mx-2 text-4xl text-magenta-soft">{knownName}</span>
            )}
          </h2>
          <p className="mt-1 text-sm text-lavender">Saisis ton code PIN ({PIN_HINT}).</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-lavender">Code PIN</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            required
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="field tracking-[0.5em]"
            placeholder="••••"
            autoFocus
          />
        </label>
        {errorBox}
        <button type="submit" disabled={pending} className="btn-neon w-full rounded-2xl px-6 py-4 text-lg">
          {pending ? "Connexion…" : "Voir ma carte"}
        </button>
        <button
          type="button"
          onClick={() => resetTo("phone")}
          className="block w-full text-center text-xs text-lavender-dim underline"
        >
          Changer de numéro
        </button>
      </form>
    );
  }

  // signup
  return (
    <form onSubmit={(e) => submitAuth(e, "signup")} className="space-y-5">
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
        <span className="mb-1.5 block text-sm font-medium text-lavender">
          Choisis un code PIN ({PIN_HINT})
        </span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          required
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="field tracking-[0.5em]"
          placeholder="••••"
        />
        <span className="mt-1 block text-xs text-lavender-dim">
          Tu en auras besoin pour te reconnecter.
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3">
        <input
          type="checkbox"
          required
          checked={rgpd}
          onChange={(e) => setRgpd(e.target.checked)}
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
      {errorBox}
      <button
        type="submit"
        disabled={pending || !rgpd || pin.length !== 4}
        className="btn-neon w-full rounded-2xl px-6 py-4 text-lg"
      >
        {pending ? "Création…" : "Créer ma carte"}
      </button>
      <button
        type="button"
        onClick={() => resetTo("phone")}
        className="block w-full text-center text-xs text-lavender-dim underline"
      >
        Changer de numéro
      </button>
    </form>
  );
}
