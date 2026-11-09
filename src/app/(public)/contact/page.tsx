import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — Burger by Night",
  description: "Une question, une demande pour un événement ? Écris à Burger by Night.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <header className="space-y-2">
        <span className="chip">Contact</span>
        <h1 className="text-4xl sm:text-5xl">
          <span className="arcade">Une</span>{" "}
          <span className="script text-5xl text-magenta-soft sm:text-6xl">question ?</span>
        </h1>
        <p className="text-sm text-lavender">Écris-nous, on te répond au plus vite.</p>
      </header>

      <section className="glass-panel rounded-2xl p-6">
        <ContactForm />
      </section>
    </div>
  );
}
