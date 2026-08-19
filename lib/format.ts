export const CURRENCIES = ["Rs", "₨", "PKR", "$", "£", "€", "₹", "AED", "﷼"];

// multi-character symbols read better with a space: "Rs 12,500" not "Rs12,500"
const gap = (c: string) => (c.length > 1 ? " " : "");

export function money(n: number, currency = "Rs", compact = false) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const pre = `${sign}${currency}${gap(currency)}`;

  if (compact && abs >= 1_000_000) {
    return `${pre}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
  }
  if (compact && abs >= 1000) {
    return `${pre}${(abs / 1000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  }
  const s = abs.toLocaleString("en-US", {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${pre}${s}`;
}

export function monthKey(d: Date | string = new Date()) {
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function monthShort(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

export function daysInMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const today = todayISO();
  if (iso === today) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yk = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(
    y.getDate()
  ).padStart(2, "0")}`;
  if (iso === yk) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
