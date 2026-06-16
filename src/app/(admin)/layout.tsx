import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Ambiance } from "@/components/ambiance";
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
      <Ambiance variant="calm" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-night-900/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-5">
            <BrandMark href="/admin/scan" size={36} showText={false} />
            <span className="chip">Admin</span>
            <AdminNav items={items} />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-lavender-dim sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
