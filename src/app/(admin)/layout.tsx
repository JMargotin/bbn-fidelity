import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const role = session.user.role;
  const items = [
    { href: "/admin/scan", label: "Scan" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/qr-camion", label: "QR Camion" },
    ...(role === "OWNER"
      ? [
          { href: "/admin/rewards", label: "Récompenses" },
          { href: "/admin/notifications", label: "Notifs" },
          { href: "/admin/stats", label: "Stats" },
        ]
      : []),
  ];

  return (
    <div className="relative flex min-h-dvh flex-col">

      <header className="sticky top-0 z-40 border-b border-white/10 bg-night-900/70 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <BrandMark href="/admin/scan" size={36} showText={false} />
              <span className="chip shrink-0">Admin</span>
              {/* Inline nav on large screens; below the header on smaller ones. */}
              <div className="hidden lg:block">
                <AdminNav items={items} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden max-w-[12rem] truncate text-xs text-lavender-dim sm:inline">
                {session.user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
          <div className="mt-3 lg:hidden">
            <AdminNav items={items} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-5">{children}</main>
    </div>
  );
}
