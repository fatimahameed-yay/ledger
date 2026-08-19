export type Method = "current" | "cash" | "card" | "savings";
export type Kind = "need" | "want";
export type SavingsMode = "percent" | "amount";

export interface Category {
  id: string;
  label: string;
  icon: string;   // name from lib/icons
  tint: string;   // hex
}

export interface Expense {
  id: string;
  date: string;        // YYYY-MM-DD
  amount: number;
  category: string;
  merchant: string;
  note: string;
  method: Method;
  kind: Kind;
  mood?: string;
  createdAt: number;
}

export interface MonthPlan {
  income: number;
  savingsMode: SavingsMode;
  savingsPct: number;
  savingsAmount: number;
  fixedTotal: number;        // 0 → use the recurring list
  spendableOverride: number; // 0 → derive from income − savings − fixed
  envelopes: Record<string, number>;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  target: number;
  saved: number;
  deadline?: string;
  createdAt: number;
}

export interface Recurring {
  id: string;
  name: string;
  amount: number;
  day: number;
  category: string;
  active: boolean;
}

export interface WishItem {
  id: string;
  name: string;
  amount: number;
  url?: string;
  addedAt: number;
  resolved?: "bought" | "passed";
}

export interface Settings {
  name: string;
  currency: string;
  savingsMode: SavingsMode;   // default applied to a new month
  savingsPct: number;
  savingsAmount: number;
  pauseDays: number;          // how long the pause list holds something
  methods: Method[];          // which accounts you actually use
  startedAt: number;
}

export interface Ledger {
  version: number;
  settings: Settings;
  categories: Category[];
  plans: Record<string, MonthPlan>;
  expenses: Expense[];
  goals: Goal[];
  recurring: Recurring[];
  wishlist: WishItem[];
  savingsLog: { id: string; date: string; amount: number; goalId?: string; note?: string }[];
}
