import { ScanForm } from "./scan-form";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl sm:text-4xl">
          <span className="arcade">Scan</span>{" "}
          <span className="script text-4xl text-magenta-soft sm:text-5xl">& Crédit</span>
        </h1>
        <p className="text-sm text-lavender">
          Scanne le QR code de la carte ou saisis l'identifiant client.
        </p>
      </header>
      <ScanForm />
    </div>
  );
}
