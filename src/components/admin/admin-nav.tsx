"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export function AdminNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "rounded-full bg-magenta/20 px-3 py-1.5 font-semibold text-magenta-soft ring-1 ring-magenta/40"
                : "rounded-full px-3 py-1.5 text-lavender transition hover:bg-white/5 hover:text-cream"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
