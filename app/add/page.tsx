"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLedger, balanceOf } from "@/lib/store";
import { catOf } from "@/lib/categories";
import { money, todayISO } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { Field } from "@/components/UI";
import type { TxType, Kind } from "@/lib/types";

export default function AddPage() {
  const router = useRouter();
  const { ready, data, addTxn } = useLedger();
  const cur = data.settings.currency;

  const [type, setType] = useState<TxType>("spend");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [account, setAccount] = useState(data.accounts[0]?.id ?? "current");
  const [toAccount, setToAccount] = useState(data.accounts[1]?.id ?? "savings");
  const [category, setCategory] = useState(data.categories[0]?.id ?? "other");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<Kind>("want");
  const [done, setDone] = useState(false);

  const value = Number(amount) || 0;

  const recentMerchants = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of data.txns) {
      if (t.type !== type) continue;
      const m = t.merchant.trim();
      if (m && !seen.has(m.toLowerCase())) seen.set(m.toLowerCase(), m);
      if (seen.size >= 6) break;
    }
    return [...seen.values()];
  }, [data.txns, type]);

  if (!ready) return <div style={{ height: "60vh" }} />;

  const from = data.accounts.find((a) => a.id === account);
  const balAfter = from ? balanceOf(data, from.id) - (type === "income" ? -value : value) : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value <= 0) return;
    if (type === "transfer" && account === toAccount) return;
    addTxn({
      date,
      type,
      amount: value,
      account,
      toAccount: type === "transfer" ? toAccount : undefined,
      category: type === "spend" ? category : undefined,
      merchant: merchant.trim(),
      note: note.trim(),
      kind: type === "spend" ? kind : undefined,
    });
    setDone(true);
    setTimeout(() => router.push("/"), 500);
  }

  if (done) {
    return (
      <div className="fade-up" style={{ display: "grid", placeItems: "center", minHeight: "70vh", textAlign: "center" }}>
        <div>
          <span className="empty-ic" style={{ width: 56, height: 56, margin: "0 auto 14px" }}>
            <Icon name="check" size={26} />
          </span>
          <p className="amount amount-lg" style={{ margin: 0 }}>
            {type === "income" ? "+" : type === "spend" ? "−" : ""}{money(value, cur)}
          </p>
        </div>
      </div>
    );
  }

  const VERB = { spend: "Spent", income: "Received", transfer: "Moved" } as const;

  return (
    <form className="fade-up" onSubmit={submit}>
      <header className="page-head">
        <h1 className="display">Add</h1>
      </header>

      <div className="segment">
        <button type="button" data-on={type === "spend"} onClick={() => setType("spend")}>Spent</button>
        <button type="button" data-on={type === "income"} onClick={() => setType("income")}>Received</button>
        <button type="button" data-on={type === "transfer"} onClick={() => setType("transfer")}>Moved</button>
      </div>

      <section className="hero" style={{ textAlign: "center", marginTop: 14, paddingBottom: 18 }}>
        <span className="label">{VERB[type]}</span>
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
        {value > 0 && type !== "transfer" && from && (
          <p className="faint" style={{ fontSize: 12, margin: "12px 0 0" }}>
            {from.name} becomes {money(balAfter, cur)}
          </p>
        )}
      </section>

      <div className="card" style={{ marginTop: 14 }}>
        <Field label={type === "income" ? "Into" : type === "transfer" ? "From" : "Paid from"}>
          <div className="chips">
            {data.accounts.map((a) => (
              <button key={a.id} type="button" className="chip" data-on={account === a.id} onClick={() => setAccount(a.id)}>
                <Icon name={a.icon} size={14} style={{ color: a.tint }} /> {a.name}
              </button>
            ))}
          </div>
        </Field>

        {type === "transfer" && (
          <Field label="To">
            <div className="chips">
              {data.accounts
                .filter((a) => a.id !== account)
                .map((a) => (
                  <button key={a.id} type="button" className="chip" data-on={toAccount === a.id} onClick={() => setToAccount(a.id)}>
                    <Icon name={a.icon} size={14} style={{ color: a.tint }} /> {a.name}
                  </button>
                ))}
            </div>
          </Field>
        )}

        {type === "spend" && (
          <Field label="Category">
            <div className="chips">
              {data.categories.map((c) => (
                <button key={c.id} type="button" className="chip" data-on={category === c.id} onClick={() => setCategory(c.id)}>
                  <Icon name={c.icon} size={14} style={{ color: c.tint }} /> {c.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {type !== "transfer" && (
          <Field label={type === "income" ? "From who" : "Where"}>
            <input
              className="input"
              placeholder={type === "income" ? "Salary" : "Shop or item"}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
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
        )}

        <Field label="Date">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        {type === "spend" && (
          <Field label="Type">
            <div className="segment">
              <button type="button" data-on={kind === "need"} onClick={() => setKind("need")}>Need</button>
              <button type="button" data-on={kind === "want"} onClick={() => setKind("want")}>Want</button>
            </div>
          </Field>
        )}

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
