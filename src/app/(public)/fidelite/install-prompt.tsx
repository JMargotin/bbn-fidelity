"use client";

import { useEffect, useState } from "react";

// Minimal typing for the non-standard beforeinstallprompt event (Chromium).
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(true); // assume installed until proven otherwise
  const [iosHintOpen, setIosHintOpen] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    setStandalone(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // Already installed → nothing to show.
  if (standalone) return null;

  // Android / Chromium: native install button.
  if (deferred) {
    return (
      <button
        type="button"
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
        className="btn-ghost w-full rounded-2xl px-6 py-3 text-sm font-semibold"
      >
        📲 Ajouter à l'écran d'accueil
      </button>
    );
  }

  // iOS: no programmatic install — show the manual steps.
  if (isIos) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-lavender">
        <button
          type="button"
          onClick={() => setIosHintOpen((v) => !v)}
          className="flex w-full items-center justify-between font-semibold text-lavender"
        >
          <span>📲 Ajouter à l'écran d'accueil</span>
          <span className="text-lavender-dim">{iosHintOpen ? "−" : "+"}</span>
        </button>
        {iosHintOpen && (
          <p className="mt-2 leading-relaxed text-lavender-dim">
            Touche le bouton <strong className="text-lavender">Partager</strong> en bas de Safari,
            puis <strong className="text-lavender">« Sur l'écran d'accueil »</strong>. Ta carte
            s'ouvrira comme une app.
          </p>
        )}
      </div>
    );
  }

  return null;
}
