"use client";

import { useMemo, useState } from "react";
import { useLedger, txnsFor } from "@/lib/store";
import { catOf } from "@/lib/categories";
import { money, prettyDate } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { MonthSwitch, Sheet, Empty, Field } from "@/components/UI";
import { TxRow } from "../page";
import type { Txn } from "@/lib/types";

export default function ActivityPage() {
  const { ready, data, month, setMonth, removeTxn, updateTxn } = useLedger();
  const cur = data.settings.currency;

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Txn | null>(null);

  const list = useMemo(() => {
    let l = txnsFor(data, month);
    if (filter === "spend" || filter === "income" || filter === "transfer") l = l.filter((t) => t.type === filter);
    else if (filter !== "all") l = l.filter((t) => t.category === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(
        (t) =>
          t.merchant.toLowerCase().includes(s) ||
          t.note.toLowerCase().includes(s) ||
          (t.category ? catOf(data.categories, t.category).label.toLowerCase().includes(s) : false)
      );
    }
    return [...l].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }, [data, month, q, filter]);

  const grouped = useMemo(() => {
    const g: { date: string; items: Txn[] }[] = [];
    for (const t of list) {
      const last = g[g.length - 1];
      if (last && last.date === t.date) last.items.push(t);
      else g.push({ date: t.date, items: [t] });
    }
    return g;
  }, [list]);

  if (!ready) return <div style={{ height: "60vh" }} />;

  const spent = list.filter((t) => t.type === "spend").reduce((a, t) => a + t.amount, 0);
  const inSum = list.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const usedCats = data.categories.filter((c) => txnsFor(data, month).some((t) => t.category === c.id));

  return (
    <div className="fade-up">
      <header className="page-head">
        <h1 className="display">Activity</h1>
        <div style={{ marginTop: 16 }}>
          <MonthSwitch month={month} setMonth={setMonth} />
        </div>
      </header>

      <div className="card card-tight">
        <div className="grid-2">
          <div>
            <span className="label">Out</span>
            <p className="amount amount-md" style={{ margin: "2px 0 0", color: "var(--blush-700)" }}>{money(spent, cur)}</p>
          </div>
          <div>
            <span className="label">In</span>
            <p className="amount amount-md" style={{ margin: "2px 0 0", color: "var(--olive-700)" }}>{money(inSum, cur)}</p>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 14 }}>
        <span style={{ position: "absolute", left: 13, top: 13, color: "var(--ink-faint)" }}>
          <Icon name="search" size={17} />
        </span>
        <input className="input" style={{ paddingLeft: 40 }} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="scroll-x" style={{ marginTop: 12 }}>
        <button className="chip" data-on={filter === "all"} onClick={() => setFilter("all")}>All</button>
        <button className="chip" data-on={filter === "spend"} onClick={() => setFilter("spend")}>Out</button>
        <button className="chip" data-on={filter === "income"} onClick={() => setFilter("income")}>In</button>
        <button className="chip" data-on={filter === "transfer"} onClick={() => setFilter("transfer")}>Moved</button>
        {usedCats.map((c) => (
          <button key={c.id} className="chip" data-on={filter === c.id} onClick={() => setFilter(c.id)}>
            <Icon name={c.icon} size={14} style={{ color: c.tint }} /> {c.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {list.length === 0 ? (
          <div className="card"><Empty icon="list" title="Nothing here" /></div>
        ) : (
          grouped.map((g) => (
            <div key={g.date} style={{ marginBottom: 14 }}>
              <div style={{ padding: "0 6px 8px" }}>
                <span className="label">{prettyDate(g.date)}</span>
              </div>
              <div className="card card-tight">
                {g.items.map((t) => (
                  <TxRow
                    key={t.id}
                    t={t}
                    cur={cur}
                    cats={data.categories}
                    accounts={data.accounts}
                    onTap={() => setEditing(t)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit">
        {editing && (
          <EditForm
            t={editing}
            cur={cur}
            cats={data.categories}
            onSave={(p) => { updateTxn(editing.id, p); setEditing(null); }}
            onDelete={() => { removeTxn(editing.id); setEditing(null); }}
          />
        )}
      </Sheet>
    </div>
  );
}

function EditForm({
  t, cur, cats, onSave, onDelete,
}: {
  t: Txn;
  cur: string;
  cats: { id: string; label: string; icon: string; tint: string }[];
  onSave: (p: Partial<Txn>) => void;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState(String(t.amount));
  const [merchant, setMerchant] = useState(t.merchant);
  const [note, setNote] = useState(t.note);
  const [category, setCategory] = useState(t.category ?? "other");
  const [date, setDate] = useState(t.date);

  return (
    <div>
      <Field label={`Amount (${cur})`}>
        <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      {t.type !== "transfer" && (
        <Field label={t.type === "income" ? "From who" : "Where"}>
          <input className="input" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
        </Field>
      )}
      <Field label="Date">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {t.type === "spend" && (
        <Field label="Category">
          <div className="chips">
            {cats.map((c) => (
              <button key={c.id} className="chip" data-on={category === c.id} onClick={() => setCategory(c.id)}>
                <Icon name={c.icon} size={14} style={{ color: c.tint }} /> {c.label}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Note">
        <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      <button
        className="btn btn-primary"
        onClick={() =>
          onSave({
            amount: Number(amount) || 0,
            merchant,
            note,
            date,
            ...(t.type === "spend" ? { category } : {}),
          })
        }
      >
        Save
      </button>
      <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10, color: "var(--alert)" }} onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
