import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Burger by Night — Fidélité",
    short_name: "BBN Fidélité",
    description: "Ta carte de fidélité Burger by Night : points et QR code.",
    start_url: "/fidelite",
    scope: "/",
    display: "standalone",
    background_color: "#08030f",
    theme_color: "#200a3c",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
