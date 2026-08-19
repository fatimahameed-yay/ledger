export interface Category {
  id: string;
  label: string;
  emoji: string;
  tint: string;   // aura colour
}

export const CATEGORIES: Category[] = [
  { id: "grocery",  label: "Groceries",     emoji: "🥬", tint: "#8d9a5b" },
  { id: "dining",   label: "Food & Coffee", emoji: "☕️", tint: "#c9a27f" },
  { id: "pilates",  label: "Pilates & Gym", emoji: "🧘‍♀️", tint: "#a8b47e" },
  { id: "beauty",   label: "Beauty & Skin", emoji: "🧴", tint: "#dcaecd" },
  { id: "fashion",  label: "Wardrobe",      emoji: "🤍", tint: "#c9a3bb" },
  { id: "home",     label: "Home & Decor",  emoji: "🕯️", tint: "#b7a68f" },
  { id: "transport",label: "Transport",     emoji: "🚕", tint: "#9aa6a0" },
  { id: "bills",    label: "Bills & Rent",  emoji: "📄", tint: "#8f9caa" },
  { id: "health",   label: "Health",        emoji: "🌿", tint: "#7f9c86" },
  { id: "social",   label: "Going Out",     emoji: "🥂", tint: "#d6a9a0" },
  { id: "travel",   label: "Travel",        emoji: "✈️", tint: "#a3b3c9" },
  { id: "gifts",    label: "Gifts",         emoji: "🎀", tint: "#e0b6c6" },
  { id: "subs",     label: "Subscriptions", emoji: "📱", tint: "#a9a0bd" },
  { id: "other",    label: "Other",         emoji: "✨", tint: "#b5b0a6" },
];

export const catMap: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export function cat(id: string): Category {
  return catMap[id] ?? CATEGORIES[CATEGORIES.length - 1];
}
