"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Settings2 } from "lucide-react";

const items = [
  { href: "/admin", label: "Agenda", icon: CalendarDays },
  { href: "/admin/horaires", label: "Horaires & réglages", icon: Settings2 },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration" className="flex gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
              active ? "bg-rose-soft text-rose-darker" : "text-ink-soft hover:bg-sand hover:text-ink"
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
