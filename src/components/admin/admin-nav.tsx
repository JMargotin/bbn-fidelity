"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export function AdminNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "shrink-0 whitespace-nowrap rounded-full bg-magenta/20 px-3 py-1.5 font-semibold text-magenta-soft ring-1 ring-magenta/40"
                : "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-lavender transition hover:bg-white/5 hover:text-cream"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
