import { SignupForm } from "./signup-form";

export default function InscriptionPage() {
  return (
    <div className="space-y-10 py-6">
      <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <span className="chip flicker">Ta carte de fidélité</span>
          <h1 className="text-5xl sm:text-6xl">
            <span className="arcade block">Rejoins le</span>
            <span className="script block text-6xl text-magenta-soft sm:text-7xl">crew BBN</span>
          </h1>
          <p className="max-w-md text-lg text-lavender">
            1 € = 1 point. Crée ta carte en 30 secondes, ajoute-la à Apple Wallet, et commence à
            cumuler dès ta prochaine commande.
          </p>
        </div>
        <div className="glass neon-frame rounded-3xl p-6 sm:p-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
