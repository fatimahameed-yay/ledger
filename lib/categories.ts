import type { Category } from "./types";

/** Seeded on first run. Everything here is editable in Settings. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "grocery",   label: "Groceries",  icon: "basket",  tint: "#8d9a5b" },
  { id: "dining",    label: "Eating out", icon: "cup",     tint: "#c9a27f" },
  { id: "pilates",   label: "Pilates",    icon: "figure",  tint: "#a8b47e" },
  { id: "beauty",    label: "Beauty",     icon: "droplet", tint: "#dcaecd" },
  { id: "fashion",   label: "Clothes",    icon: "hanger",  tint: "#c9a3bb" },
  { id: "home",      label: "Home",       icon: "house",   tint: "#b7a68f" },
  { id: "transport", label: "Transport",  icon: "car",     tint: "#9aa6a0" },
  { id: "bills",     label: "Bills",      icon: "doc",     tint: "#8f9caa" },
  { id: "health",    label: "Health",     icon: "leaf",    tint: "#7f9c86" },
  { id: "social",    label: "Going out",  icon: "glass",   tint: "#d6a9a0" },
  { id: "travel",    label: "Travel",     icon: "plane",   tint: "#a3b3c9" },
  { id: "gifts",     label: "Gifts",      icon: "gift",    tint: "#e0b6c6" },
  { id: "subs",      label: "Subs",       icon: "phone",   tint: "#a9a0bd" },
  { id: "other",     label: "Other",      icon: "sparkle", tint: "#b5b0a6" },
];

export const FALLBACK: Category = {
  id: "other", label: "Other", icon: "sparkle", tint: "#b5b0a6",
};

/** Colours offered when creating or editing a category. */
export const TINTS = [
  "#8d9a5b", "#a8b47e", "#7f9c86", "#9aa6a0",
  "#c9a27f", "#b7a68f", "#c9b8a3", "#b5b0a6",
  "#c9a3bb", "#dcaecd", "#e0b6c6", "#d6a9a0",
  "#a3b3c9", "#8f9caa", "#a9a0bd", "#a86f92",
];

export function catOf(list: Category[], id: string): Category {
  return list.find((c) => c.id === id) ?? FALLBACK;
}
