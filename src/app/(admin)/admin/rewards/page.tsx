import { requireOwner } from "@/lib/auth-page";
import { RewardsList } from "./rewards-list";

export default async function RewardsPage() {
  await requireOwner();
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-4xl">
          <span className="arcade">Les</span>{" "}
          <span className="script text-5xl text-magenta-soft">récompenses</span>
        </h1>
        <p className="text-sm text-lavender">Gère les paliers de points et leurs récompenses.</p>
      </header>
      <RewardsList />
    </div>
  );
}
