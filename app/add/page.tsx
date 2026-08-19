"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLedger, computeStats } from "@/lib/store";
import { catOf } from "@/lib/categories";
import { money, todayISO } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { Field } from "@/components/UI";
import type { Method, Kind } from "@/lib/types";

const METHOD_META: Record<Method, { label: string; icon: string }> = {
  current: { label: "Current", icon: "bank" },
  card: { label: "Card", icon: "card" },
  cash: { label: "Cash", icon: "wallet" },
  savings: { label: "Savings", icon: "lotus" },
};

const MOODS = ["needed", "worth it", "a treat", "impulse", "regret"];

export default function AddPage() {
  const router = useRouter();
  const { ready, data, addExpense, month } = useLedger();
  const cur = data.settings.currency;
  const stats = useMemo(() => computeStats(data, month), [data, month]);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState(data.categories[0]?.id ?? "other");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<Method>(data.settings.methods[0] ?? "current");
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
    setTimeout(() => router.push("/log"), 500);
  }

  if (!ready) return <div style={{ height: "60vh" }} />;

  if (saved) {
    return (
      <div className="fade-up" style={{ display: "grid", placeItems: "center", minHeight: "70vh", textAlign: "center" }}>
        <div>
          <span className="empty-ic" style={{ width: 56, height: 56, margin: "0 auto 14px" }}>
            <Icon name="check" size={26} />
          </span>
          <p className="amount amount-lg" style={{ margin: 0 }}>{money(value, cur)}</p>
          <p className="sub">{catOf(data.categories, category).label}</p>
        </div>
      </div>
    );
  }

  const methods = data.settings.methods.length ? data.settings.methods : (["current"] as Method[]);

  return (
    <form className="fade-up" onSubmit={submit}>
      <header className="page-head">
        <h1 className="display">New entry</h1>
      </header>

      <section className="hero" style={{ textAlign: "center", paddingBottom: 18 }}>
        <span className="label">Amount</span>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginTop: 6 }}>
          <span className="amount" style={{ fontSize: 26, color: "var(--ink-soft)" }}>{cur}</span>
          <input
            className="input-amount"
            style={{ width: "min(180px, 46vw)" }}
            inputMode="decimal"
            placeholder="0"
            value={amount}
            autoFocus
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>
        {value > 0 && stats.spendable > 0 && (
          <p className="faint" style={{ fontSize: 12, margin: "12px 0 0" }}>
            {method === "savings" ? "From savings" : `${money(afterLeft, cur)} left after this`}
          </p>
        )}
      </section>

      <div className="card" style={{ marginTop: 14 }}>
        <Field label="Category">
          <div className="chips">
            {data.categories.map((c) => (
              <button key={c.id} type="button" className="chip" data-on={category === c.id} onClick={() => setCategory(c.id)}>
                <Icon name={c.icon} size={14} style={{ color: c.tint }} /> {c.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Where">
          <input className="input" placeholder="Shop or item" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
          {recentMerchants.length > 0 && !merchant && (
            <div className="chips" style={{ marginTop: 8 }}>
              {recentMerchants.map((m) => (
                <button key={m} type="button" className="chip btn-sm" onClick={() => setMerchant(m)}>
                  {m}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Date">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="Paid from">
          <div className="chips">
            {methods.map((m) => (
              <button key={m} type="button" className="chip" data-on={method === m} onClick={() => setMethod(m)}>
                <Icon name={METHOD_META[m].icon} size={14} /> {METHOD_META[m].label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Type">
          <div className="segment">
            <button type="button" data-on={kind === "need"} onClick={() => setKind("need")}>Need</button>
            <button type="button" data-on={kind === "want"} onClick={() => setKind("want")}>Want</button>
          </div>
        </Field>

        <Field label="Feeling">
          <div className="chips">
            {MOODS.map((m) => (
              <button key={m} type="button" className="chip" data-on={mood === m} onClick={() => setMood(mood === m ? "" : m)}>
                {m}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Note">
          <textarea className="textarea" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 18 }} disabled={value <= 0}>
        Save
      </button>
    </form>
  );
}
