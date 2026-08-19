"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/lib/icons";
import { useLedger } from "@/lib/store";

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/activity", label: "Activity", icon: "list" },
  { href: "/add", label: "Add", icon: "plus", fab: true },
  { href: "/spending", label: "Spending", icon: "chart" },
  { href: "/plan", label: "Plan", icon: "flag" },
];

export default function Nav() {
  const path = usePathname();
  const { ready, data } = useLedger();

  // keep the first-run screens clean
  if (!ready || !data.settings.onboarded) return null;

  return (
    <nav className="nav">
      {items.map(({ href, label, icon, fab }) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} data-on={on} className={fab ? "fab" : undefined} aria-label={label}>
            <Icon name={icon} size={fab ? 22 : 21} stroke={fab ? 1.8 : 1.5} />
            {!fab && <span className="tx">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
