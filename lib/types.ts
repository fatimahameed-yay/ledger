export type Kind = "need" | "want";
export type TxType = "spend" | "income" | "transfer";

export interface Account {
  id: string;
  name: string;
  icon: string;
  tint: string;
  opening: number;      // what was already in it when you started
  saving: boolean;      // true = a savings pot, false = day-to-day
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  tint: string;
}

export interface Txn {
  id: string;
  date: string;         // YYYY-MM-DD
  type: TxType;
  amount: number;
  account: string;      // spend/transfer: money leaves here. income: money lands here.
  toAccount?: string;   // transfer only
  category?: string;    // spend only
  merchant: string;     // shop, or who paid you
  note: string;
  kind?: Kind;
  createdAt: number;
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
  account: string;
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

/** optional, per month — leave the limit at 0 and nothing is enforced */
export interface MonthLimit {
  monthlyLimit: number;
  envelopes: Record<string, number>;
}

export interface Settings {
  name: string;
  currency: string;
  onboarded: boolean;
  startMonth: string;   // nothing before this counts
  pauseDays: number;
  startedAt: number;
}

export interface Ledger {
  version: number;
  settings: Settings;
  accounts: Account[];
  categories: Category[];
  txns: Txn[];
  limits: Record<string, MonthLimit>;
  recurring: Recurring[];
  goals: Goal[];
  wishlist: WishItem[];
}
