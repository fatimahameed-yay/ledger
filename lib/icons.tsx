import React from "react";

/**
 * One coherent line-icon set — 24×24, stroke-only, currentColor.
 * No emoji anywhere in the app; categories and goals reference these by name.
 */

const P: Record<string, React.ReactNode> = {
  /* ---- categories ---- */
  basket: (
    <>
      <path d="M3.8 8.5h16.4l-1.5 9.8a2 2 0 0 1-2 1.7H7.3a2 2 0 0 1-2-1.7L3.8 8.5Z" />
      <path d="M8.6 8.5 11 4m5 4.5L13.5 4" />
      <path d="M9.8 12.3v3.6m4.4-3.6v3.6" />
    </>
  ),
  cup: (
    <>
      <path d="M4.8 8.2h11.4v6.4a4.2 4.2 0 0 1-4.2 4.2H9a4.2 4.2 0 0 1-4.2-4.2V8.2Z" />
      <path d="M16.2 9.6h1.9a2.4 2.4 0 0 1 0 4.8h-1.9" />
      <path d="M8 5.4V3.6m3.4 1.8V3.6m3.4 1.8V3.6" />
    </>
  ),
  figure: (
    <>
      <circle cx="12" cy="4.9" r="2.1" />
      <path d="M12 8.2v4.6" />
      <path d="M7.4 10.4h9.2" />
      <path d="M12 12.8 8.6 20m3.4-7.2L15.4 20" />
    </>
  ),
  droplet: (
    <path d="M12 3.4c0 0 5.6 5.6 5.6 9.4a5.6 5.6 0 1 1-11.2 0C6.4 9 12 3.4 12 3.4Z" />
  ),
  hanger: (
    <>
      <path d="M12 8.8V8a2.3 2.3 0 1 1 2.3-2.3" />
      <path d="M12 8.8 4.1 15.1a1.1 1.1 0 0 0 .7 2h14.4a1.1 1.1 0 0 0 .7-2L12 8.8Z" />
    </>
  ),
  house: (
    <>
      <path d="M4 10.4 12 4l8 6.4V19a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 19v-8.6Z" />
      <path d="M9.6 20.4v-5.6h4.8v5.6" />
    </>
  ),
  car: (
    <>
      <path d="M3.8 16.2v-3.6l1.9-4.3a2.1 2.1 0 0 1 1.9-1.3h8.8a2.1 2.1 0 0 1 1.9 1.3l1.9 4.3v3.6" />
      <path d="M3.8 12.6h16.4" />
      <path d="M6.6 16.2v1.8m10.8-1.8v1.8" />
      <circle cx="7.4" cy="14.4" r="0.9" />
      <circle cx="16.6" cy="14.4" r="0.9" />
    </>
  ),
  doc: (
    <>
      <path d="M6.4 3.6h7L18 8.2v12.2H6.4V3.6Z" />
      <path d="M13.2 3.6v4.8H18" />
      <path d="M9 13h6M9 16.4h4" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
      <path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12" />
    </>
  ),
  glass: (
    <>
      <path d="M19.2 3.4H4.8L12 11.6l7.2-8.2Z" />
      <path d="M12 11.6v9" />
      <path d="M8.2 20.6h7.6" />
    </>
  ),
  plane: (
    <path d="M10.6 13.4 3.4 11.2l17-6.6-6.6 17-2.2-7.2Zm0 0 4.6-4.6" />
  ),
  gift: (
    <>
      <path d="M4.4 10.2h15.2v9.4a.8.8 0 0 1-.8.8H5.2a.8.8 0 0 1-.8-.8v-9.4Z" />
      <path d="M3.6 7h16.8v3.2H3.6z" />
      <path d="M12 7v13.4" />
      <path d="M12 7S10.8 3.4 8.8 3.4a1.8 1.8 0 0 0 0 3.6H12Zm0 0s1.2-3.6 3.2-3.6a1.8 1.8 0 0 1 0 3.6H12Z" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.8" width="10" height="18.4" rx="2.2" />
      <path d="M11 5.4h2" />
      <path d="M12 18.2h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.2c.9 4.2 2.7 6 6.8 6.8-4.1.8-5.9 2.6-6.8 6.8-.9-4.2-2.7-6-6.8-6.8 4.1-.8 5.9-2.6 6.8-6.8Z" />
      <path d="M18 16.4c.4 1.8 1.2 2.6 3 3-1.8.4-2.6 1.2-3 3-.4-1.8-1.2-2.6-3-3 1.8-.4 2.6-1.2 3-3Z" />
    </>
  ),
  book: (
    <>
      <path d="M4.4 4.4h6a2.6 2.6 0 0 1 2.6 2.6v13a2 2 0 0 0-2-2H4.4V4.4Z" />
      <path d="M19.6 4.4h-6A2.6 2.6 0 0 0 11 7v13a2 2 0 0 1 2-2h6.6V4.4Z" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="9" r="1.9" />
      <circle cx="12" cy="6.8" r="1.9" />
      <circle cx="17" cy="9" r="1.9" />
      <path d="M12 11.4c2.8 0 4.8 2.1 4.8 4.4s-1.8 3.4-4.8 3.4-4.8-1.1-4.8-3.4 2-4.4 4.8-4.4Z" />
    </>
  ),

  /* ---- accounts & money ---- */
  bank: (
    <>
      <path d="M3.4 9.4 12 4.2l8.6 5.2" />
      <path d="M5.4 9.8v8.4m4.4-8.4v8.4m4.4-8.4v8.4m4.4-8.4v8.4" />
      <path d="M3.4 20.2h17.2" />
    </>
  ),
  card: (
    <>
      <rect x="2.8" y="5.4" width="18.4" height="13.2" rx="2.2" />
      <path d="M2.8 9.8h18.4" />
      <path d="M6.4 14.6h3.4" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.4 7.2a2 2 0 0 1 2-2h11.2a2 2 0 0 1 2 2v.8" />
      <rect x="3.4" y="7.2" width="17.2" height="11.6" rx="2.2" />
      <path d="M16.6 12.2h4v3.4h-4a1.7 1.7 0 0 1 0-3.4Z" />
    </>
  ),
  lotus: (
    <>
      <path d="M12 4.2c2 2 2.9 4 2.9 6.2 0 2.6-1.3 4.6-2.9 6-1.6-1.4-2.9-3.4-2.9-6 0-2.2.9-4.2 2.9-6.2Z" />
      <path d="M9.1 10.4c-2.4-.7-4.3-.4-5.7.6 1 3.4 4.2 5.6 8.6 5.6s7.6-2.2 8.6-5.6c-1.4-1-3.3-1.3-5.7-.6" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="6.6" rx="7.2" ry="2.8" />
      <path d="M4.8 6.6v4.8c0 1.5 3.2 2.8 7.2 2.8s7.2-1.3 7.2-2.8V6.6" />
      <path d="M4.8 11.4v4.8c0 1.5 3.2 2.8 7.2 2.8s7.2-1.3 7.2-2.8v-4.8" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),

  /* ---- interface ---- */
  home: (
    <path d="M3.6 10.4 12 4l8.4 6.4V19a1.5 1.5 0 0 1-1.5 1.5h-3.6v-6h-6.6v6H5.1A1.5 1.5 0 0 1 3.6 19v-8.6Z" />
  ),
  list: <path d="M8.4 6.6h11.6M8.4 12h11.6M8.4 17.4h11.6M4.2 6.6h.01M4.2 12h.01M4.2 17.4h.01" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 6.8V12l3.6 2.2" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V9.6M9.6 20V4.6M15.2 20v-7.8M20.8 20v-5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />,
  check: <path d="M4.8 12.6 9.6 17.4 19.2 6.6" />,
  pencil: (
    <>
      <path d="M4 20h4l10.6-10.6a2.3 2.3 0 0 0-3.2-3.2L4.8 16.8 4 20Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4.6 6.6h14.8" />
      <path d="M6.6 6.6 7.4 20a1.4 1.4 0 0 0 1.4 1.2h6.4A1.4 1.4 0 0 0 16.6 20l.8-13.4" />
      <path d="M9.4 6.6V4.4a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v2.2" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.2 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
    </>
  ),
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  up: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  down: <path d="M12 5v14m0 0 6-6m-6 6-6-6" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="M15.6 15.6 20 20" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.2" />
      <path d="M3.6 10h16.8M8.4 3.4v4M15.6 3.4v4" />
    </>
  ),
  pause: <path d="M9.4 5.4v13.2M14.6 5.4v13.2" />,
  play: <path d="M8 5.6 18 12 8 18.4V5.6Z" />,
  download: <path d="M12 4v11m0 0 4.4-4.4M12 15l-4.4-4.4M4.4 19.6h15.2" />,
  upload: <path d="M12 15.6V4.6m0 0L7.6 9M12 4.6 16.4 9M4.4 19.6h15.2" />,
  table: (
    <>
      <rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2" />
      <path d="M3.6 9.6h16.8M9.2 9.6v9.8" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.4 4.4v4.4H16" />
    </>
  ),
  bell: (
    <>
      <path d="M6.6 10a5.4 5.4 0 0 1 10.8 0c0 4.2 1.6 5.6 1.6 5.6H5s1.6-1.4 1.6-5.6Z" />
      <path d="M10.4 19a1.8 1.8 0 0 0 3.2 0" />
    </>
  ),
  flag: (
    <>
      <path d="M5.6 20.4V4.2" />
      <path d="M5.6 5.2h11.8l-2.2 3.6 2.2 3.6H5.6" />
    </>
  ),
  moon: <path d="M20 13.4A8.4 8.4 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4Z" />,
  diamond: (
    <>
      <path d="M6 4.4h12l3 5-9 10.8L3 9.4l3-5Z" />
      <path d="M3 9.4h18M8.6 9.4 12 20.2l3.4-10.8M6 4.4l2.6 5M18 4.4l-2.6 5" />
    </>
  ),
  wave: (
    <path d="M2.8 9.2c2.3-2.4 4.6-2.4 6.9 0s4.6 2.4 6.9 0 4.6-2.4 4.6 0M2.8 15.4c2.3-2.4 4.6-2.4 6.9 0s4.6 2.4 6.9 0 4.6-2.4 4.6 0" />
  ),
  cap: (
    <>
      <path d="M2.6 8.6 12 4.4l9.4 4.2-9.4 4.2-9.4-4.2Z" />
      <path d="M6.6 10.4v4.8c0 1.6 2.4 2.8 5.4 2.8s5.4-1.2 5.4-2.8v-4.8" />
    </>
  ),
  candle: (
    <>
      <path d="M12 3.4c1.6 1.7 2.4 2.9 2.4 4a2.4 2.4 0 0 1-4.8 0c0-1.1.8-2.3 2.4-4Z" />
      <rect x="8.4" y="10.4" width="7.2" height="10" rx="1.4" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 9.8c0-2.8.8-4.2 2.4-4.2s2.4 1.4 1 3.6M12 14.2c0 2.8-.8 4.2-2.4 4.2s-2.4-1.4-1-3.6M9.8 12c-2.8 0-4.2-.8-4.2-2.4s1.4-2.4 3.6-1M14.2 12c2.8 0 4.2.8 4.2 2.4s-1.4 2.4-3.6 1" />
    </>
  ),
  heart: (
    <path d="M12 20.2s-7.4-4.6-7.4-9.6a4.3 4.3 0 0 1 7.4-2.9 4.3 4.3 0 0 1 7.4 2.9c0 5-7.4 9.6-7.4 9.6Z" />
  ),
  ring: (
    <>
      <circle cx="12" cy="14.4" r="5.4" />
      <path d="M9.4 9.6 12 4.6l2.6 5" />
      <path d="M9 4.6h6" />
    </>
  ),
};

export type IconName = keyof typeof P;

export const ICON_NAMES = Object.keys(P) as IconName[];

/** icons offered when naming a category or a goal */
export const PICKER_ICONS: IconName[] = [
  "basket", "cup", "figure", "droplet", "hanger", "house",
  "car", "doc", "leaf", "glass", "plane", "gift",
  "phone", "sparkle", "book", "paw", "heart", "target",
  "diamond", "wave", "cap", "candle", "flower", "ring",
  "coins", "lotus", "bank", "card", "moon", "flag",
];

export function Icon({
  name,
  size = 20,
  stroke = 1.5,
  className,
  style,
}: {
  name: IconName | string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const d = P[name] ?? P.sparkle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}
