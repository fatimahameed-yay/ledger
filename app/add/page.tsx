"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLedger, computeStats } from "@/lib/store";
import { CATEGORIES, cat } from "@/lib/categories";
import { money, todayISO } from "@/lib/format";
import { Field } from "@/components/UI";
import type { Method, Kind } from "@/lib/types";

const METHODS: { id: Method; label: string; emoji: string }[] = [
  { id: "current", label: "Current account", emoji: "🏦" },
  { id: "card", label: "Card", emoji: "💳" },
  { id: "cash", label: "Cash", emoji: "👛" },
  { id: "savings", label: "From savings", emoji: "🪷" },
];

const MOODS = ["needed it", "worth it", "a treat", "impulse", "regret", "celebration"];

export default function AddPage() {
  const router = useRouter();
  const { ready, data, addExpense, month } = useLedger();
  const cur = data.settings.currency;
  const stats = useMemo(() => computeStats(data, month), [data, month]);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("dining");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<Method>("current");
  const [kind, setKind] = useState<Kind>("want");
  const [mood, setMood] = useState("");
  const [saved, setSaved] = useState(false);

  const value = Number(amount) || 0;
  const afterLeft = stats.left - (method === "savings" ? 0 : value);

  const recentMerchants = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of data.expenses) {
      const m = e.merchant.trim();
      if (m && !seen.has(m.toLowerCase())) seen.set(m.toLowerCase(), m);
      if (seen.size >= 6) break;
    }
    return [...seen.values()];
  }, [data.expenses]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value <= 0) return;
    addExpense({ date, amount: value, category, merchant: merchant.trim(), note: note.trim(), method, kind, mood });
    setSaved(true);
    setTimeout(() => router.push("/log"), 550);
  }

  if (!ready) return <div style={{ height: "60vh" }} />;

  if (saved) {
    return (
      <div className="fade-up" style={{ display: "grid", placeItems: "center", minHeight: "70vh", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 46, marginBottom: 12 }}>✓</div>
          <h1 className="display" style={{ fontSize: 32 }}>Noted.</h1>
          <p className="sub">{money(value, cur)} · {cat(category).label}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="fade-up" onSubmit={submit}>
      <header className="page-head">
        <p className="eyebrow">New entry</p>
        <h1 className="display">What did you<br />spend on?</h1>
      </header>

      {/* amount */}
      <section className="hero" style={{ textAlign: "center", paddingBottom: 18 }}>
        <p className="label">Amount</p>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
          <span className="amount" style={{ fontSize: 28, color: "var(--ink-soft)" }}>{cur}</span>
          <input
            className="input-amount"
            style={{ width: "min(230px, 62vw)" }}
            inputMode="decimal"
            placeholder="0"
            value={amount}
            autoFocus
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>
        {value > 0 && stats.income > 0 && (
          <p className="faint" style={{ fontSize: 12, margin: "12px 0 0" }}>
            {method === "savings"
              ? "Comes out of savings — won't touch this month's budget"
              : <>Leaves you {money(afterLeft, cur)} for the rest of {stats.daysLeft} day{stats.daysLeft === 1 ? "" : "s"}</>}
          </p>
        )}
      </section>

      <div className="card" style={{ marginTop: 14 }}>
        <Field label="Category">
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip"
                data-on={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Where / what did you get">
          <input
            className="input"
            placeholder="Matcha at Blank Street, Reformer class…"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
          {recentMerchants.length > 0 && !merchant && (
            <div className="chips" style={{ marginTop: 8 }}>
              {recentMerchants.map((m) => (
                <button key={m} type="button" className="chip btn-sm" onClick={() => setMerchant(m)}>
                  ↺ {m}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Date">
          <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="Paid from">
          <div className="chips">
            {METHODS.map((m) => (
              <button key={m.id} type="button" className="chip" data-on={method === m.id} onClick={() => setMethod(m.id)}>
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Need or want?">
          <div className="segment">
            <button type="button" data-on={kind === "need"} onClick={() => setKind("need")}>Need</button>
            <button type="button" data-on={kind === "want"} onClick={() => setKind("want")}>Want</button>
          </div>
        </Field>

        <Field label="How did it feel? (optional)">
          <div className="chips">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                data-on={mood === m}
                onClick={() => setMood(mood === m ? "" : m)}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Notes (optional)">
          <textarea
            className="textarea"
            placeholder="Split with Ayesha · monthly restock · birthday gift for mum"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 18 }} disabled={value <= 0}>
        Add entry
      </button>
      <p className="faint" style={{ fontSize: 11.5, textAlign: "center", marginTop: 12 }}>
        Everything stays on this device.
      </p>
    </form>
  );
}
