"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const Home = () => (
  <svg className="ic" viewBox="0 0 24 24" {...S}><path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5v-6h-7v6H5A1.5 1.5 0 0 1 3.5 19z" /></svg>
);
const List = () => (
  <svg className="ic" viewBox="0 0 24 24" {...S}><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" /></svg>
);
const Plus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...S} strokeWidth={1.8}><path d="M12 5v14M5 12h14" /></svg>
);
const Plan = () => (
  <svg className="ic" viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="8.2" /><path d="M12 3.8v8.2l5.6 3.4" /></svg>
);
const Spark = () => (
  <svg className="ic" viewBox="0 0 24 24" {...S}><path d="M12 3.5c.9 4 2.6 5.7 6.5 6.5-3.9.8-5.6 2.5-6.5 6.5-.9-4-2.6-5.7-6.5-6.5 3.9-.8 5.6-2.5 6.5-6.5Z" /><path d="M18 16.2c.4 1.7 1.1 2.4 2.8 2.8-1.7.4-2.4 1.1-2.8 2.8-.4-1.7-1.1-2.4-2.8-2.8 1.7-.4 2.4-1.1 2.8-2.8Z" /></svg>
);

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/log", label: "Log", Icon: List },
  { href: "/add", label: "Add", Icon: Plus, fab: true },
  { href: "/plan", label: "Plan", Icon: Plan },
  { href: "/glow", label: "Glow", Icon: Spark },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {items.map(({ href, label, Icon, fab }) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            data-on={on}
            className={fab ? "fab" : undefined}
            aria-label={label}
          >
            <Icon />
            {!fab && <span className="tx">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
