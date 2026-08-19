"use client";

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from "react";
import type {
  Ledger, Expense, Goal, Recurring, WishItem, MonthPlan, Category, Settings,
} from "./types";
import { DEFAULT_CATEGORIES } from "./categories";
import { monthKey, todayISO, uid, daysInMonth, shiftMonth } from "./format";

const KEY = "ledger.v1";

const defaultSettings: Settings = {
  name: "",
  currency: "Rs",
  savingsMode: "percent",
  savingsPct: 20,
  savingsAmount: 0,
  pauseDays: 30,
  methods: ["current", "card", "cash", "savings"],
  startedAt: Date.now(),
};

const initial: Ledger = {
  version: 2,
  settings: defaultSettings,
  categories: DEFAULT_CATEGORIES,
  plans: {},
  expenses: [],
  goals: [],
  recurring: [],
  wishlist: [],
  savingsLog: [],
};

function planFrom(s: Settings): MonthPlan {
  return {
    income: 0,
    savingsMode: s.savingsMode,
    savingsPct: s.savingsPct,
    savingsAmount: s.savingsAmount,
    fixedTotal: 0,
    spendableOverride: 0,
    envelopes: {},
  };
}

/** older saved data is missing the newer fields — fill them in */
function migrate(raw: any): Ledger {
  const settings: Settings = { ...defaultSettings, ...(raw?.settings ?? {}) };
  const plans: Record<string, MonthPlan> = {};
  for (const [k, p] of Object.entries<any>(raw?.plans ?? {})) {
    plans[k] = {
      income: p.income ?? 0,
      savingsMode: p.savingsMode ?? "percent",
      savingsPct: p.savingsPct ?? settings.savingsPct,
      savingsAmount: p.savingsAmount ?? 0,
      fixedTotal: p.fixedTotal ?? 0,
      spendableOverride: p.spendableOverride ?? 0,
      envelopes: p.envelopes ?? {},
    };
  }
  return {
    ...initial,
    ...raw,
    version: 2,
    settings,
    plans,
    categories: raw?.categories?.length ? raw.categories : DEFAULT_CATEGORIES,
    goals: (raw?.goals ?? []).map((g: any) => ({ ...g, icon: g.icon ?? "target" })),
  };
}

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
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  moveCategory: (id: string, dir: -1 | 1) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "saved">) => void;
  updateGoal: (id: string, g: Partial<Goal>) => void;
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

  const plan = data.plans[month] ?? planFrom(data.settings);

  const value: Ctx = {
    ready, data, month, setMonth, plan,

    savePlan: (p) =>
      patch((d) => ({
        ...d,
        plans: { ...d.plans, [month]: { ...(d.plans[month] ?? planFrom(d.settings)), ...p } },
      })),

    addExpense: (e) =>
      patch((d) => ({ ...d, expenses: [{ ...e, id: uid(), createdAt: Date.now() }, ...d.expenses] })),
    updateExpense: (id, e) =>
      patch((d) => ({ ...d, expenses: d.expenses.map((x) => (x.id === id ? { ...x, ...e } : x)) })),
    removeExpense: (id) =>
      patch((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) })),

    addCategory: (c) =>
      patch((d) => ({ ...d, categories: [...d.categories, { ...c, id: uid() }] })),
    updateCategory: (id, c) =>
      patch((d) => ({ ...d, categories: d.categories.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
    removeCategory: (id) =>
      patch((d) => ({
        ...d,
        categories: d.categories.filter((c) => c.id !== id),
        // anything already logged keeps its history, moved to the catch-all
        expenses: d.expenses.map((e) => (e.category === id ? { ...e, category: "other" } : e)),
        recurring: d.recurring.map((r) => (r.category === id ? { ...r, category: "other" } : r)),
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
    updateGoal: (id, g) =>
      patch((d) => ({ ...d, goals: d.goals.map((x) => (x.id === id ? { ...x, ...g } : x)) })),
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
    replaceAll: (nd) => setData(migrate(nd)),
    reset: () => setData({ ...initial, settings: { ...defaultSettings, startedAt: Date.now() } }),
  };

  return <LedgerCtx.Provider value={value}>{children}</LedgerCtx.Provider>;
}

export function useLedger() {
  const c = useContext(LedgerCtx);
  if (!c) throw new Error("useLedger outside provider");
  return c;
}

/* ---------------- derived ---------------- */

export function expensesFor(data: Ledger, month: string) {
  return data.expenses.filter((e) => e.date.startsWith(month));
}

export function sum(list: { amount: number }[]) {
  return list.reduce((a, b) => a + b.amount, 0);
}

/** what you chose to put aside this month */
export function savingsFor(plan: MonthPlan) {
  return plan.savingsMode === "amount"
    ? Math.max(0, plan.savingsAmount)
    : Math.round(plan.income * (plan.savingsPct / 100));
}

export interface MonthStats {
  income: number;
  toSavings: number;
  fixed: number;
  spendable: number;
  spendableIsManual: boolean;
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
  const plan = data.plans[month] ?? planFrom(data.settings);
  const list = expensesFor(data, month);
  const spent = sum(list.filter((e) => e.method !== "savings"));

  const income = plan.income;
  const toSavings = savingsFor(plan);
  const recurringTotal = data.recurring.filter((r) => r.active).reduce((a, b) => a + b.amount, 0);
  const fixed = plan.fixedTotal > 0 ? plan.fixedTotal : recurringTotal;

  const spendableIsManual = plan.spendableOverride > 0;
  const spendable = spendableIsManual
    ? plan.spendableOverride
    : Math.max(0, income - toSavings - fixed);

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

  const noSpendDays = byDay.slice(0, dayOfMonth).filter((v) => v === 0).length;

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
    .slice(0, 5);

  return {
    income, toSavings, fixed, spendable, spendableIsManual, spent, left, pctUsed,
    daysTotal, dayOfMonth, daysLeft, idealPace, pace: spent - idealPace,
    dailyAllowance, safeToday, projected, byCategory, byDay,
    noSpendDays, streak, topMerchants,
    needTotal: sum(list.filter((e) => e.kind === "need" && e.method !== "savings")),
    wantTotal: sum(list.filter((e) => e.kind === "want" && e.method !== "savings")),
  };
}

export interface Accounts {
  income: number;
  fixed: number;
  spendable: number;
  spentThisMonth: number;
  currentLeft: number;
  savingsThisMonth: number;
  savingsPot: number;
  savingsWithdrawn: number;
  inGoals: number;
  unassigned: number;
}

export function computeAccounts(data: Ledger, month: string): Accounts {
  const s = computeStats(data, month);
  const savedAllTime = Object.values(data.plans).reduce((a, p) => a + savingsFor(p), 0);
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
