import { requireSession } from "@/lib/auth-page";
import { ClientsTable } from "./clients-table";

export default async function ClientsPage() {
  await requireSession();
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-4xl">
          <span className="arcade">Les</span>{" "}
          <span className="script text-5xl text-magenta-soft">clients</span>
        </h1>
        <p className="text-sm text-lavender">Recherche un client par prénom ou téléphone.</p>
      </header>
      <ClientsTable />
    </div>
  );
}
