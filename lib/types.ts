export type Method = "current" | "cash" | "card" | "savings";
export type Kind = "need" | "want";

export interface Expense {
  id: string;
  date: string;        // YYYY-MM-DD
  amount: number;
  category: string;    // category id
  merchant: string;    // where / what I ordered
  note: string;        // description
  method: Method;
  kind: Kind;
  mood?: string;       // how it felt
  createdAt: number;
}

export interface MonthPlan {
  income: number;
  savingsPct: number;   // % of income moved to savings
  fixedTotal: number;   // manual override for bills, 0 = use recurring list
  envelopes: Record<string, number>; // categoryId -> monthly cap
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  target: number;
  saved: number;
  deadline?: string;
  createdAt: number;
}

export interface Recurring {
  id: string;
  name: string;
  amount: number;
  day: number;         // day of month
  category: string;
  active: boolean;
}

export interface WishItem {
  id: string;
  name: string;
  amount: number;
  url?: string;
  addedAt: number;     // 30-day pause rule
  resolved?: "bought" | "passed";
}

export interface Settings {
  name: string;
  currency: string;
  startedAt: number;
}

export interface Ledger {
  version: number;
  settings: Settings;
  plans: Record<string, MonthPlan>;   // "YYYY-MM" -> plan
  expenses: Expense[];
  goals: Goal[];
  recurring: Recurring[];
  wishlist: WishItem[];
  savingsLog: { id: string; date: string; amount: number; goalId?: string; note?: string }[];
}
