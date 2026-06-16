import type { Metadata, Viewport } from "next";
import { Anton, Outfit, Kaushan_Script } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});
const kaushanScript = Kaushan_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-kaushan",
});

export const metadata: Metadata = {
  title: "Burger by Night — Carte de fidélité",
  description:
    "Le programme de fidélité Burger by Night. 1€ = 1 point. Cumulez, débloquez boissons, burgers et menus offerts.",
  icons: { icon: "/brand/icon-180.png", apple: "/brand/icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#0d0617",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${anton.variable} ${outfit.variable} ${kaushanScript.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
