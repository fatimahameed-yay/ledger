"use client";

import { useMemo, useState } from "react";
import { useLedger, expensesFor, sum } from "@/lib/store";
import { catOf } from "@/lib/categories";
import { money, prettyDate } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { MonthSwitch, Sheet, Empty, Field, Dot } from "@/components/UI";
import type { Expense, Category } from "@/lib/types";

export default function LogPage() {
  const { ready, data, month, setMonth, removeExpense, updateExpense } = useLedger();
  const cur = data.settings.currency;

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"date" | "amount">("date");
  const [editing, setEditing] = useState<Expense | null>(null);

  const list = useMemo(() => {
    let l = expensesFor(data, month);
    if (filter === "want" || filter === "need") l = l.filter((e) => e.kind === filter);
    else if (filter !== "all") l = l.filter((e) => e.category === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(
        (e) =>
          e.merchant.toLowerCase().includes(s) ||
          e.note.toLowerCase().includes(s) ||
          catOf(data.categories, e.category).label.toLowerCase().includes(s)
      );
    }
    return [...l].sort((a, b) =>
      sort === "amount" ? b.amount - a.amount : a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt
    );
  }, [data, month, q, filter, sort]);

  const grouped = useMemo(() => {
    if (sort === "amount") return null;
    const g: { date: string; items: Expense[] }[] = [];
    for (const e of list) {
      const last = g[g.length - 1];
      if (last && last.date === e.date) last.items.push(e);
      else g.push({ date: e.date, items: [e] });
    }
    return g;
  }, [list, sort]);

  const usedCats = useMemo(
    () => data.categories.filter((c) => expensesFor(data, month).some((e) => e.category === c.id)),
    [data, month]
  );

  if (!ready) return <div style={{ height: "60vh" }} />;

  return (
    <div className="fade-up">
      <header className="page-head">
        <h1 className="display">Entries</h1>
        <div style={{ marginTop: 16 }}>
          <MonthSwitch month={month} setMonth={setMonth} />
        </div>
      </header>

      <div className="card card-tight">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="label">{list.length} shown</span>
          <span className="amount amount-md">{money(sum(list), cur)}</span>
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 14 }}>
        <span style={{ position: "absolute", left: 13, top: 13, color: "var(--ink-faint)" }}>
          <Icon name="search" size={17} />
        </span>
        <input
          className="input"
          style={{ paddingLeft: 40 }}
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="scroll-x" style={{ marginTop: 12 }}>
        <button className="chip" data-on={filter === "all"} onClick={() => setFilter("all")}>All</button>
        <button className="chip" data-on={filter === "need"} onClick={() => setFilter("need")}>Needs</button>
        <button className="chip" data-on={filter === "want"} onClick={() => setFilter("want")}>Wants</button>
        {usedCats.map((c) => (
          <button key={c.id} className="chip" data-on={filter === c.id} onClick={() => setFilter(c.id)}>
            <Icon name={c.icon} size={14} style={{ color: c.tint }} /> {c.label}
          </button>
        ))}
      </div>

      <div className="segment" style={{ marginTop: 12 }}>
        <button data-on={sort === "date"} onClick={() => setSort("date")}>Date</button>
        <button data-on={sort === "amount"} onClick={() => setSort("amount")}>Amount</button>
      </div>

      <div style={{ marginTop: 16 }}>
        {list.length === 0 ? (
          <div className="card"><Empty icon="list" title="Nothing here" /></div>
        ) : grouped ? (
          grouped.map((g) => (
            <div key={g.date} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 6px 8px" }}>
                <span className="label">{prettyDate(g.date)}</span>
                <span className="label">{money(sum(g.items), cur)}</span>
              </div>
              <div className="card card-tight">
                {g.items.map((e) => (
                  <Row key={e.id} e={e} cur={cur} cats={data.categories} onTap={() => setEditing(e)} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="card card-tight">
            {list.map((e) => (
              <Row key={e.id} e={e} cur={cur} cats={data.categories} showDate onTap={() => setEditing(e)} />
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit">
        {editing && (
          <EditForm
            e={editing}
            cur={cur}
            cats={data.categories}
            onSave={(patch) => {
              updateExpense(editing.id, patch);
              setEditing(null);
            }}
            onDelete={() => {
              removeExpense(editing.id);
              setEditing(null);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function Row({
  e, cur, cats, showDate, onTap,
}: {
  e: Expense; cur: string; cats: Category[]; showDate?: boolean; onTap: () => void;
}) {
  const k = catOf(cats, e.category);
  return (
    <div className="row" onClick={onTap} style={{ cursor: "pointer" }}>
      <Dot icon={k.icon} tint={k.tint} />
      <div className="row-main">
        <div className="row-title">{e.merchant || k.label}</div>
        <div className="row-sub">
          {showDate ? `${prettyDate(e.date)} · ` : ""}{k.label}{e.mood ? ` · ${e.mood}` : ""}
        </div>
      </div>
      <span className="amount" style={{ fontSize: 18 }}>{money(e.amount, cur)}</span>
    </div>
  );
}

function EditForm({
  e, cur, cats, onSave, onDelete,
}: {
  e: Expense;
  cur: string;
  cats: Category[];
  onSave: (p: Partial<Expense>) => void;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState(String(e.amount));
  const [merchant, setMerchant] = useState(e.merchant);
  const [note, setNote] = useState(e.note);
  const [category, setCategory] = useState(e.category);
  const [date, setDate] = useState(e.date);
  const [kind, setKind] = useState(e.kind);

  return (
    <div>
      <Field label={`Amount (${cur})`}>
        <input className="input" inputMode="decimal" value={amount} onChange={(ev) => setAmount(ev.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <Field label="Where">
        <input className="input" value={merchant} onChange={(ev) => setMerchant(ev.target.value)} />
      </Field>
      <Field label="Date">
        <input className="input" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} />
      </Field>
      <Field label="Category">
        <div className="chips">
          {cats.map((c) => (
            <button key={c.id} className="chip" data-on={category === c.id} onClick={() => setCategory(c.id)}>
              <Icon name={c.icon} size={14} style={{ color: c.tint }} /> {c.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Type">
        <div className="segment">
          <button data-on={kind === "need"} onClick={() => setKind("need")}>Need</button>
          <button data-on={kind === "want"} onClick={() => setKind("want")}>Want</button>
        </div>
      </Field>
      <Field label="Note">
        <textarea className="textarea" value={note} onChange={(ev) => setNote(ev.target.value)} />
      </Field>

      <button
        className="btn btn-primary"
        onClick={() => onSave({ amount: Number(amount) || 0, merchant, note, category, date, kind })}
      >
        Save
      </button>
      <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10, color: "var(--alert)" }} onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
