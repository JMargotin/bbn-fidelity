import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function QrCamionPage() {
  const base = (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const url = `${base}/fidelite`;

  const qrDataUrl = await QRCode.toDataURL(url, {
    margin: 2,
    width: 600,
    errorCorrectionLevel: "H",
    color: { dark: "#08030f", light: "#ffffff" },
  });

  return (
    <div className="mx-auto w-full max-w-md space-y-6 text-center">
      <div>
        <h1 className="arcade text-2xl sm:text-3xl">QR à afficher sur le camion</h1>
        <p className="mt-2 text-sm text-lavender">
          Les clients le scannent pour créer ou ouvrir leur carte de fidélité.
        </p>
      </div>

      <div className="glass rounded-3xl p-4 sm:p-6">
        {/* biome-ignore lint/performance/noImgElement: data-URL QR, not a static asset */}
        <img
          src={qrDataUrl}
          alt="QR code espace fidélité"
          className="mx-auto aspect-square w-full max-w-[18rem] rounded-2xl bg-cream p-3"
        />
        <p className="mt-4 break-all text-xs text-lavender-dim">{url}</p>
      </div>

      <p className="text-xs text-lavender-dim">
        Astuce : fais une capture d'écran ou imprime cette page (Cmd/Ctrl + P) pour l'afficher au
        camion.
      </p>
    </div>
  );
}
