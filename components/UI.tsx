"use client";

import React, { useEffect } from "react";
import { monthLabel, shiftMonth, monthKey } from "@/lib/format";
import { Icon } from "@/lib/icons";

/* ---------- progress ring ---------- */
export function Ring({
  pct,
  size = 168,
  stroke = 13,
  children,
  tone = "auto",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  tone?: "auto" | "calm";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  const over = pct > 100;
  const gradId = tone === "calm" ? "ringCalm" : over ? "ringOver" : pct > 85 ? "ringWarn" : "ringOk";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringOk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8d9a5b" />
            <stop offset="55%" stopColor="#b3bd8e" />
            <stop offset="100%" stopColor="#e3c4d7" />
          </linearGradient>
          <linearGradient id="ringWarn" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c9a27f" />
            <stop offset="100%" stopColor="#e3c4d7" />
          </linearGradient>
          <linearGradient id="ringOver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#bf7a72" />
            <stop offset="100%" stopColor="#c9a3bb" />
          </linearGradient>
          <linearGradient id="ringCalm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c9a3bb" />
            <stop offset="100%" stopColor="#b3bd8e" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(75,82,48,0.10)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- month switcher ---------- */
export function MonthSwitch({ month, setMonth }: { month: string; setMonth: (m: string) => void }) {
  const atNow = month >= monthKey(new Date());
  return (
    <div className="month-switch">
      <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
        <Icon name="left" size={16} />
      </button>
      <span className="mlabel">{monthLabel(month)}</span>
      <button onClick={() => setMonth(shiftMonth(month, 1))} disabled={atNow} aria-label="Next month">
        <Icon name="right" size={16} />
      </button>
    </div>
  );
}

/* ---------- bottom sheet ---------- */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="grab" />
        {title && <h2 className="section" style={{ margin: "0 0 14px" }}>{title}</h2>}
        {children}
      </div>
    </>
  );
}

/* ---------- bits ---------- */
export function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="bar">
      <i style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

/** circular icon chip, tinted to the category colour */
export function Dot({
  icon,
  tint,
  size = 38,
}: {
  icon: string;
  tint?: string;
  size?: number;
}) {
  return (
    <span
      className="dot"
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        background: tint ? `${tint}20` : undefined,
        color: tint ?? "var(--olive-700)",
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function Empty({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="empty">
      <span className="empty-ic"><Icon name={icon} size={22} /></span>
      <div>{title}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

/** small square icon-only button */
export function IconBtn({
  icon,
  onClick,
  label,
  danger,
}: {
  icon: string;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className="icon-btn"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={danger ? { color: "var(--alert)" } : undefined}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}
