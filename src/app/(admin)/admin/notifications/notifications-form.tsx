"use client";

import { useEffect, useState, type FormEvent } from "react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  deviceCount: number;
  createdAt: string;
};

type Recipients = { devices: number; customers: number };

const TITLE_MAX = 80;
const BODY_MAX = 400;

export function NotificationsForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recipients, setRecipients] = useState<Recipients | null>(null);

  async function refresh() {
    const res = await fetch("/api/announcements");
    if (!res.ok) return;
    const data = await res.json();
    setAnnouncements(data.announcements);
    setRecipients(data.recipients);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!confirm(`Envoyer cette notification à ${recipients?.devices ?? 0} appareil(s) ?`)) return;
    setPending(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      const b = data.broadcast;
      setSuccess(
        `Envoyé ! ${b.ok}/${b.devices} appareil(s) notifié(s)${
          b.failed ? ` · ${b.failed} échec(s)` : ""
        }.`,
      );
      setTitle("");
      setBody("");
      await refresh();
      setTimeout(() => setSuccess(null), 6000);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass neon-frame space-y-5 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="arcade text-2xl">Nouvelle notif</h2>
          {recipients && (
            <span className="chip">
              {recipients.devices} appareil{recipients.devices > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-lavender">
            <span>Titre</span>
            <span className="text-xs text-lavender-dim">
              {title.length}/{TITLE_MAX}
            </span>
          </span>
          <input
            type="text"
            required
            maxLength={TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="field"
            placeholder="Ex : Happy hour ce soir 🔥"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-lavender">
            <span>Message</span>
            <span className="text-xs text-lavender-dim">
              {body.length}/{BODY_MAX}
            </span>
          </span>
          <textarea
            required
            maxLength={BODY_MAX}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="field resize-none"
            placeholder="Ex : -50% sur tous les menus jusqu'à 23h, viens vite !"
          />
        </label>

        <p className="text-xs text-lavender-dim">
          Sur l'écran verrouillé, le titre de la notif reste « Burger by Night » (limite Apple) ;
          ton message s'affiche en dessous. Seuls les clients ayant ajouté la carte à Wallet la
          reçoivent.
        </p>

        {error && (
          <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !title.trim() || !body.trim()}
          className="btn-neon w-full rounded-2xl px-6 py-4 text-lg"
        >
          {pending ? "Envoi…" : "Envoyer à tous"}
        </button>
      </form>

      {announcements.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-xl text-cream">Historique</h2>
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li key={a.id} className="glass-panel rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-cream">{a.title}</p>
                  <span className="shrink-0 text-xs text-lavender-dim">
                    {new Date(a.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-lavender">{a.body}</p>
                <p className="mt-2 text-xs text-lavender-dim">
                  📲 {a.deviceCount} appareil{a.deviceCount > 1 ? "s" : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
