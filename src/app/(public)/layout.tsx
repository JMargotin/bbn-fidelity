import Link from "next/link";
import { Ambiance } from "@/components/ambiance";
import { BrandMark } from "@/components/brand-mark";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Ambiance />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-night-900/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <BrandMark />
          <Link
            href="/inscription"
            className="btn-ghost rounded-full px-4 py-2 text-sm font-semibold"
          >
            Ma carte
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>

      <footer className="border-t border-white/10 bg-night-950/50">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1 px-5 py-6 text-center text-xs text-lavender-dim">
          <p className="font-display text-sm tracking-wide text-lavender">
            Burger by Night · Le Mans 72
          </p>
          <div className="flex items-center gap-2.5">
            <Link href="/mentions-legales" className="mt-1 underline hover:text-magenta-soft">
              Mentions légales
            </Link>
            <Link href="/admin" className="mt-1 underline hover:text-magenta-soft">
              Espace livreur
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
