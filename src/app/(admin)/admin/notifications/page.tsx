import { requireOwner } from "@/lib/auth-page";
import { NotificationsForm } from "./notifications-form";

export default async function NotificationsPage() {
  await requireOwner();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1">
        <h1 className="text-4xl">
          <span className="arcade">Les</span>{" "}
          <span className="script text-5xl text-magenta-soft">notifs</span>
        </h1>
        <p className="text-sm text-lavender">
          Envoie un message à tous les clients qui ont ajouté leur carte à Apple Wallet.
        </p>
      </header>
      <NotificationsForm />
    </div>
  );
}
