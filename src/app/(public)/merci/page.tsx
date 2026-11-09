import type { Metadata } from "next";
import Link from "next/link";

// Landing page after a contact form sent without JavaScript (Codexa `_redirect`).
export const metadata: Metadata = {
  title: "Message envoyé — Burger by Night",
  robots: { index: false },
};

export default function MerciPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 text-center">
      <span className="chip">Contact</span>
      <h1 className="text-4xl sm:text-5xl">
        <span className="arcade">Message</span>{" "}
        <span className="script text-5xl text-magenta-soft sm:text-6xl">envoyé !</span>
      </h1>
      <p className="text-lavender">Merci, on a bien reçu ton message. On te répond au plus vite.</p>
      <Link
        href="/"
        className="btn-ghost inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
