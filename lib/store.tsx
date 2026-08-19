"use client";

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from "react";
import type { Ledger, Expense, Goal, Recurring, WishItem, MonthPlan } from "./types";
import { monthKey, todayISO, uid, daysInMonth, shiftMonth } from "./format";

const KEY = "ledger.v1";

const emptyPlan = (): MonthPlan => ({
  income: 0, savingsPct: 20, fixedTotal: 0, envelopes: {},
});

const initial: Ledger = {
  version: 1,
  settings: { name: "", currency: "Rs", startedAt: Date.now() },
  plans: {},
  expenses: [],
  goals: [],
  recurring: [],
  wishlist: [],
  savingsLog: [],
};

interface Ctx {
  ready: boolean;
  data: Ledger;
  month: string;
  setMonth: (m: string) => void;
  plan: MonthPlan;
  savePlan: (p: Partial<MonthPlan>) => void;
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, e: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "saved">) => void;
  fundGoal: (id: string, amount: number) => void;
  removeGoal: (id: string) => void;
  addRecurring: (r: Omit<Recurring, "id">) => void;
  toggleRecurring: (id: string) => void;
  removeRecurring: (id: string) => void;
  addWish: (w: Omit<WishItem, "id" | "addedAt">) => void;
  resolveWish: (id: string, how: "bought" | "passed") => void;
  removeWish: (id: string) => void;
  setSettings: (s: Partial<Ledger["settings"]>) => void;
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
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...initial, ...parsed, settings: { ...initial.settings, ...parsed.settings } });
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }, [data, ready]);

  const patch = useCallback((fn: (d: Ledger) => Ledger) => setData((d) => fn(d)), []);

  const plan = data.plans[month] ?? emptyPlan();

  const value: Ctx = {
    ready, data, month, setMonth, plan,
    savePlan: (p) =>
      patch((d) => ({ ...d, plans: { ...d.plans, [month]: { ...(d.plans[month] ?? emptyPlan()), ...p } } })),
    addExpense: (e) =>
      patch((d) => ({ ...d, expenses: [{ ...e, id: uid(), createdAt: Date.now() }, ...d.expenses] })),
    updateExpense: (id, e) =>
      patch((d) => ({ ...d, expenses: d.expenses.map((x) => (x.id === id ? { ...x, ...e } : x)) })),
    removeExpense: (id) =>
      patch((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) })),
    addGoal: (g) =>
      patch((d) => ({ ...d, goals: [...d.goals, { ...g, id: uid(), saved: 0, createdAt: Date.now() }] })),
    fundGoal: (id, amount) =>
      patch((d) => ({
        ...d,
        goals: d.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g)),
        savingsLog: [{ id: uid(), date: todayISO(), amount, goalId: id }, ...d.savingsLog],
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
    replaceAll: (nd) => setData(nd),
    reset: () => setData({ ...initial, settings: { ...initial.settings, startedAt: Date.now() } }),
  };

  return <LedgerCtx.Provider value={value}>{children}</LedgerCtx.Provider>;
}

export function useLedger() {
  const c = useContext(LedgerCtx);
  if (!c) throw new Error("useLedger outside provider");
  return c;
}

/* ---------------- derived selectors ---------------- */

export function expensesFor(data: Ledger, month: string) {
  return data.expenses.filter((e) => e.date.startsWith(month));
}

export function sum(list: { amount: number }[]) {
  return list.reduce((a, b) => a + b.amount, 0);
}

export interface MonthStats {
  income: number;
  toSavings: number;
  fixed: number;
  spendable: number;
  spent: number;
  left: number;
  pctUsed: number;
  daysTotal: number;
  dayOfMonth: number;
  daysLeft: number;
  idealPace: number;
  pace: number;
  dailyAllowance: number;
  safeToday: number;
  projected: number;
  byCategory: { id: string; total: number; pct: number }[];
  byDay: number[];
  noSpendDays: number;
  streak: number;
  topMerchants: { name: string; total: number; count: number }[];
  needTotal: number;
  wantTotal: number;
}

export function computeStats(data: Ledger, month: string): MonthStats {
  const plan = data.plans[month] ?? emptyPlan();
  const list = expensesFor(data, month);
  const spent = sum(list.filter((e) => e.method !== "savings"));
  const income = plan.income;
  const toSavings = Math.round(income * (plan.savingsPct / 100));
  const recurringTotal = data.recurring.filter((r) => r.active).reduce((a, b) => a + b.amount, 0);
  const fixed = plan.fixedTotal > 0 ? plan.fixedTotal : recurringTotal;
  const spendable = Math.max(0, income - toSavings - fixed);
  const left = spendable - spent;
  const pctUsed = spendable > 0 ? (spent / spendable) * 100 : 0;

  const daysTotal = daysInMonth(month);
  const now = new Date();
  const isCurrent = monthKey(now) === month;
  const isPast = month < monthKey(now);
  const dayOfMonth = isCurrent ? now.getDate() : isPast ? daysTotal : 1;
  const daysLeft = isCurrent ? daysTotal - dayOfMonth + 1 : isPast ? 0 : daysTotal;

  const dailyAllowance = spendable / daysTotal;
  const idealPace = dailyAllowance * dayOfMonth;
  const safeToday = daysLeft > 0 ? Math.max(0, left) / daysLeft : 0;
  const projected = dayOfMonth > 0 ? (spent / dayOfMonth) * daysTotal : 0;

  const catTotals = new Map<string, number>();
  for (const e of list) {
    if (e.method === "savings") continue;
    catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount);
  }
  const byCategory = [...catTotals.entries()]
    .map(([id, total]) => ({ id, total, pct: spent > 0 ? (total / spent) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  const byDay: number[] = Array(daysTotal).fill(0);
  for (const e of list) {
    if (e.method === "savings") continue;
    const d = Number(e.date.slice(8, 10));
    if (d >= 1 && d <= daysTotal) byDay[d - 1] += e.amount;
  }

  const elapsed = byDay.slice(0, dayOfMonth);
  const noSpendDays = elapsed.filter((v) => v === 0).length;

  let streak = 0;
  for (let i = dayOfMonth - 1; i >= 0; i--) {
    if (byDay[i] === 0) streak++;
    else break;
  }

  const merch = new Map<string, { total: number; count: number }>();
  for (const e of list) {
    if (e.method === "savings" || !e.merchant.trim()) continue;
    const k = e.merchant.trim();
    const cur = merch.get(k) ?? { total: 0, count: 0 };
    merch.set(k, { total: cur.total + e.amount, count: cur.count + 1 });
  }
  const topMerchants = [...merch.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const needTotal = sum(list.filter((e) => e.kind === "need" && e.method !== "savings"));
  const wantTotal = sum(list.filter((e) => e.kind === "want" && e.method !== "savings"));

  return {
    income, toSavings, fixed, spendable, spent, left, pctUsed,
    daysTotal, dayOfMonth, daysLeft, idealPace, pace: spent - idealPace,
    dailyAllowance, safeToday, projected, byCategory, byDay,
    noSpendDays, streak, topMerchants, needTotal, wantTotal,
  };
}

/* ---- account balances: what's in current vs savings ---- */

export interface Accounts {
  income: number;
  fixed: number;
  spendable: number;
  spentThisMonth: number;
  currentLeft: number;        // still sitting in the current account for spending
  savingsThisMonth: number;   // moved across on payday
  savingsPot: number;         // every month's savings, less anything taken back out
  savingsWithdrawn: number;   // all-time spending marked "from savings"
  inGoals: number;            // earmarked inside the pot
  unassigned: number;         // pot money not attached to a goal
}

export function computeAccounts(data: Ledger, month: string): Accounts {
  const s = computeStats(data, month);

  const savedAllTime = Object.values(data.plans).reduce(
    (a, p) => a + Math.round((p.income ?? 0) * ((p.savingsPct ?? 0) / 100)),
    0
  );
  const savingsWithdrawn = sum(data.expenses.filter((e) => e.method === "savings"));
  const savingsPot = savedAllTime - savingsWithdrawn;
  const inGoals = data.goals.reduce((a, g) => a + g.saved, 0);

  return {
    income: s.income,
    fixed: s.fixed,
    spendable: s.spendable,
    spentThisMonth: s.spent,
    currentLeft: s.left,
    savingsThisMonth: s.toSavings,
    savingsPot,
    savingsWithdrawn,
    inGoals,
    unassigned: savingsPot - inGoals,
  };
}

export function lastMonths(month: string, n: number) {
  return Array.from({ length: n }, (_, i) => shiftMonth(month, -(n - 1 - i)));
}
