"use client";

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from "react";
import type {
  Ledger, Txn, Goal, Recurring, WishItem, Category, Account, Settings, MonthLimit,
} from "./types";
import { DEFAULT_CATEGORIES } from "./categories";
import { monthKey, todayISO, uid, daysInMonth } from "./format";

const KEY = "ledger.v1";

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: "current", name: "Current", icon: "bank",  tint: "#8d9a5b", opening: 0, saving: false },
  { id: "savings", name: "Savings", icon: "lotus", tint: "#a86f92", opening: 0, saving: true },
];

const defaultSettings: Settings = {
  name: "",
  currency: "Rs",
  onboarded: false,
  startMonth: monthKey(),
  pauseDays: 30,
  startedAt: Date.now(),
};

const initial: Ledger = {
  version: 3,
  settings: defaultSettings,
  accounts: DEFAULT_ACCOUNTS,
  categories: DEFAULT_CATEGORIES,
  txns: [],
  limits: {},
  recurring: [],
  goals: [],
  wishlist: [],
};

const emptyLimit = (): MonthLimit => ({ monthlyLimit: 0, envelopes: {} });

/** bring older saved data (v1/v2 expense-only shape) onto the account model */
function migrate(raw: any): Ledger {
  if (!raw) return initial;
  const settings: Settings = { ...defaultSettings, ...(raw.settings ?? {}) };

  if (raw.version >= 3) {
    return {
      ...initial,
      ...raw,
      settings,
      accounts: raw.accounts?.length ? raw.accounts : DEFAULT_ACCOUNTS,
      categories: raw.categories?.length ? raw.categories : DEFAULT_CATEGORIES,
      txns: raw.txns ?? [],
      limits: raw.limits ?? {},
    };
  }

  // v1 / v2 → v3
  const txns: Txn[] = (raw.expenses ?? []).map((e: any) => ({
    id: e.id,
    date: e.date,
    type: "spend" as const,
    amount: e.amount,
    account: e.method === "savings" ? "savings" : "current",
    category: e.category,
    merchant: e.merchant ?? "",
    note: e.note ?? "",
    kind: e.kind,
    createdAt: e.createdAt ?? Date.now(),
  }));

  const limits: Record<string, MonthLimit> = {};
  for (const [k, p] of Object.entries<any>(raw.plans ?? {})) {
    limits[k] = { monthlyLimit: 0, envelopes: p.envelopes ?? {} };
  }

  return {
    ...initial,
    settings: { ...settings, onboarded: false },
    accounts: DEFAULT_ACCOUNTS,
    categories: raw.categories?.length ? raw.categories : DEFAULT_CATEGORIES,
    txns,
    limits,
    recurring: (raw.recurring ?? []).map((r: any) => ({ ...r, account: r.account ?? "current" })),
    goals: (raw.goals ?? []).map((g: any) => ({ ...g, icon: g.icon ?? "target" })),
    wishlist: raw.wishlist ?? [],
  };
}

interface Ctx {
  ready: boolean;
  data: Ledger;
  month: string;
  setMonth: (m: string) => void;
  limit: MonthLimit;
  saveLimit: (l: Partial<MonthLimit>) => void;
  addTxn: (t: Omit<Txn, "id" | "createdAt">) => void;
  updateTxn: (id: string, t: Partial<Txn>) => void;
  removeTxn: (id: string) => void;
  addAccount: (a: Omit<Account, "id">) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  moveCategory: (id: string, dir: -1 | 1) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "saved">) => void;
  fundGoal: (id: string, amount: number) => void;
  removeGoal: (id: string) => void;
  addRecurring: (r: Omit<Recurring, "id">) => void;
  toggleRecurring: (id: string) => void;
  removeRecurring: (id: string) => void;
  addWish: (w: Omit<WishItem, "id" | "addedAt">) => void;
  resolveWish: (id: string, how: "bought" | "passed") => void;
  removeWish: (id: string) => void;
  setSettings: (s: Partial<Settings>) => void;
  replaceAll: (d: Ledger) => void;
  reset: () => void;
}

const LedgerCtx = createContext<Ctx | null>(null);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Ledger>(initial);
  const [ready, setReady] = useState(false);
  const [month, setMonth] = useState(monthKey());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(migrate(JSON.parse(raw)));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }, [data, ready]);

  const patch = useCallback((fn: (d: Ledger) => Ledger) => setData((d) => fn(d)), []);
  const limit = data.limits[month] ?? emptyLimit();

  const value: Ctx = {
    ready, data, month, setMonth, limit,

    saveLimit: (l) =>
      patch((d) => ({ ...d, limits: { ...d.limits, [month]: { ...(d.limits[month] ?? emptyLimit()), ...l } } })),

    addTxn: (t) => patch((d) => ({ ...d, txns: [{ ...t, id: uid(), createdAt: Date.now() }, ...d.txns] })),
    updateTxn: (id, t) => patch((d) => ({ ...d, txns: d.txns.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
    removeTxn: (id) => patch((d) => ({ ...d, txns: d.txns.filter((x) => x.id !== id) })),

    addAccount: (a) => patch((d) => ({ ...d, accounts: [...d.accounts, { ...a, id: uid() }] })),
    updateAccount: (id, a) =>
      patch((d) => ({ ...d, accounts: d.accounts.map((x) => (x.id === id ? { ...x, ...a } : x)) })),
    removeAccount: (id) =>
      patch((d) => {
        if (d.accounts.length <= 1) return d;
        const fallback = d.accounts.find((a) => a.id !== id)!.id;
        return {
          ...d,
          accounts: d.accounts.filter((a) => a.id !== id),
          txns: d.txns.map((t) => ({
            ...t,
            account: t.account === id ? fallback : t.account,
            toAccount: t.toAccount === id ? fallback : t.toAccount,
          })),
        };
      }),

    addCategory: (c) => patch((d) => ({ ...d, categories: [...d.categories, { ...c, id: uid() }] })),
    updateCategory: (id, c) =>
      patch((d) => ({ ...d, categories: d.categories.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
    removeCategory: (id) =>
      patch((d) => ({
        ...d,
        categories: d.categories.filter((c) => c.id !== id),
        txns: d.txns.map((t) => (t.category === id ? { ...t, category: "other" } : t)),
      })),
    moveCategory: (id, dir) =>
      patch((d) => {
        const i = d.categories.findIndex((c) => c.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= d.categories.length) return d;
        const next = [...d.categories];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...d, categories: next };
      }),

    addGoal: (g) =>
      patch((d) => ({ ...d, goals: [...d.goals, { ...g, id: uid(), saved: 0, createdAt: Date.now() }] })),
    fundGoal: (id, amount) =>
      patch((d) => ({
        ...d,
        goals: d.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g)),
      })),
    removeGoal: (id) => patch((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) })),

    addRecurring: (r) => patch((d) => ({ ...d, recurring: [...d.recurring, { ...r, id: uid() }] })),
    toggleRecurring: (id) =>
      patch((d) => ({ ...d, recurring: d.recurring.map((r) => (r.id === id ? { ...r, active: !r.active } : r)) })),
    removeRecurring: (id) => patch((d) => ({ ...d, recurring: d.recurring.filter((r) => r.id !== id) })),

    addWish: (w) => patch((d) => ({ ...d, wishlist: [{ ...w, id: uid(), addedAt: Date.now() }, ...d.wishlist] })),
    resolveWish: (id, how) =>
      patch((d) => ({ ...d, wishlist: d.wishlist.map((w) => (w.id === id ? { ...w, resolved: how } : w)) })),
    removeWish: (id) => patch((d) => ({ ...d, wishlist: d.wishlist.filter((w) => w.id !== id) })),

    setSettings: (s) => patch((d) => ({ ...d, settings: { ...d.settings, ...s } })),
    replaceAll: (nd) => setData(migrate(nd)),
    reset: () =>
      setData({
        ...initial,
        settings: { ...defaultSettings, startMonth: monthKey(), startedAt: Date.now() },
      }),
  };

  return <LedgerCtx.Provider value={value}>{children}</LedgerCtx.Provider>;
}

export function useLedger() {
  const c = useContext(LedgerCtx);
  if (!c) throw new Error("useLedger outside provider");
  return c;
}

/* ================= balances ================= */

/** what is in one account right now */
export function balanceOf(data: Ledger, accountId: string) {
  const acc = data.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  let b = acc.opening;
  for (const t of data.txns) {
    if (t.type === "income" && t.account === accountId) b += t.amount;
    else if (t.type === "spend" && t.account === accountId) b -= t.amount;
    else if (t.type === "transfer") {
      if (t.account === accountId) b -= t.amount;
      if (t.toAccount === accountId) b += t.amount;
    }
  }
  return b;
}

export function totalBalance(data: Ledger) {
  return data.accounts.reduce((a, acc) => a + balanceOf(data, acc.id), 0);
}

export function txnsFor(data: Ledger, month: string) {
  return data.txns.filter((t) => t.date.startsWith(month));
}

export function txnsOfAccount(data: Ledger, accountId: string) {
  return data.txns.filter(
    (t) => t.account === accountId || t.toAccount === accountId
  );
}

/** signed effect of a transaction on one account */
export function effectOn(t: Txn, accountId: string) {
  if (t.type === "income" && t.account === accountId) return t.amount;
  if (t.type === "spend" && t.account === accountId) return -t.amount;
  if (t.type === "transfer") {
    if (t.toAccount === accountId) return t.amount;
    if (t.account === accountId) return -t.amount;
  }
  return 0;
}

export function sum(list: { amount: number }[]) {
  return list.reduce((a, b) => a + b.amount, 0);
}

/* ================= month summary ================= */

export interface MonthSummary {
  spent: number;
  earned: number;
  net: number;
  limit: number;
  leftOfLimit: number;
  pctOfLimit: number;
  daysTotal: number;
  dayOfMonth: number;
  daysLeft: number;
  perDayLeft: number;
  byCategory: { id: string; total: number; pct: number }[];
  byDay: number[];
  needTotal: number;
  wantTotal: number;
  topMerchants: { name: string; total: number; count: number }[];
  noSpendDays: number;
  streak: number;
}

export function monthSummary(data: Ledger, month: string): MonthSummary {
  const list = txnsFor(data, month);
  const spends = list.filter((t) => t.type === "spend");
  const spent = sum(spends);
  const earned = sum(list.filter((t) => t.type === "income"));

  const limit = data.limits[month]?.monthlyLimit ?? 0;
  const leftOfLimit = limit > 0 ? limit - spent : 0;
  const pctOfLimit = limit > 0 ? (spent / limit) * 100 : 0;

  const daysTotal = daysInMonth(month);
  const now = new Date();
  const isCurrent = monthKey(now) === month;
  const isPast = month < monthKey(now);
  const dayOfMonth = isCurrent ? now.getDate() : isPast ? daysTotal : 1;
  const daysLeft = isCurrent ? daysTotal - dayOfMonth + 1 : isPast ? 0 : daysTotal;

  const catTotals = new Map<string, number>();
  for (const t of spends) {
    const id = t.category ?? "other";
    catTotals.set(id, (catTotals.get(id) ?? 0) + t.amount);
  }
  const byCategory = [...catTotals.entries()]
    .map(([id, total]) => ({ id, total, pct: spent > 0 ? (total / spent) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  const byDay: number[] = Array(daysTotal).fill(0);
  for (const t of spends) {
    const d = Number(t.date.slice(8, 10));
    if (d >= 1 && d <= daysTotal) byDay[d - 1] += t.amount;
  }

  const noSpendDays = byDay.slice(0, dayOfMonth).filter((v) => v === 0).length;
  let streak = 0;
  for (let i = dayOfMonth - 1; i >= 0; i--) {
    if (byDay[i] === 0) streak++;
    else break;
  }

  const merch = new Map<string, { total: number; count: number }>();
  for (const t of spends) {
    const k = t.merchant.trim();
    if (!k) continue;
    const cur = merch.get(k) ?? { total: 0, count: 0 };
    merch.set(k, { total: cur.total + t.amount, count: cur.count + 1 });
  }

  return {
    spent,
    earned,
    net: earned - spent,
    limit,
    leftOfLimit,
    pctOfLimit,
    daysTotal,
    dayOfMonth,
    daysLeft,
    perDayLeft: limit > 0 && daysLeft > 0 ? Math.max(0, leftOfLimit) / daysLeft : 0,
    byCategory,
    byDay,
    needTotal: sum(spends.filter((t) => t.kind === "need")),
    wantTotal: sum(spends.filter((t) => t.kind === "want")),
    topMerchants: [...merch.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    noSpendDays,
    streak,
  };
}

export function lastMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => monthKey(new Date(y, m - 1 - (n - 1 - i), 1)));
}
