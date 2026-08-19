"use client";

import { useMemo, useState } from "react";
import { useLedger, monthSummary } from "@/lib/store";
import { catOf } from "@/lib/categories";
import { money } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { MonthSwitch, Sheet, Bar, Field, Empty, Dot, IconBtn } from "@/components/UI";

const num = (v: string) => Number(v.replace(/[^0-9.]/g, "")) || 0;

export default function PlanPage() {
  const {
    ready, data, month, setMonth, limit, saveLimit,
    addRecurring, removeRecurring, toggleRecurring,
    addWish, resolveWish, removeWish,
  } = useLedger();
  const cur = data.settings.currency;
  const sm = useMemo(() => monthSummary(data, month), [data, month]);

  const [billSheet, setBillSheet] = useState(false);
  const [capSheet, setCapSheet] = useState(false);
  const [wishSheet, setWishSheet] = useState(false);

  if (!ready) return <div style={{ height: "60vh" }} />;

  const recurring = [...data.recurring].sort((a, b) => a.day - b.day);
  const recurringTotal = recurring.filter((r) => r.active).reduce((a, r) => a + r.amount, 0);
  const caps = Object.entries(limit.envelopes).filter(([, v]) => v > 0);
  const pauseDays = data.settings.pauseDays;
  const openWishes = data.wishlist.filter((w) => !w.resolved);
  const passed = data.wishlist.filter((w) => w.resolved === "passed");

  return (
    <div className="fade-up">
      <header className="page-head">
        <h1 className="display">Plan</h1>
        <div style={{ marginTop: 16 }}>
          <MonthSwitch month={month} setMonth={setMonth} />
        </div>
      </header>

      {/* ---- monthly limit ---- */}
      <section className="hero">
        <span className="label">Monthly spending limit</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
          <span className="amount" style={{ fontSize: 22, color: "var(--ink-soft)" }}>{cur}</span>
          <input
            className="input-amount"
            style={{ flex: 1, textAlign: "left", fontSize: 36, padding: "4px 0 10px" }}
            inputMode="decimal"
            placeholder="none"
            value={limit.monthlyLimit ? limit.monthlyLimit.toLocaleString("en-US") : ""}
            onChange={(e) => saveLimit({ monthlyLimit: num(e.target.value) })}
          />
        </div>

        {limit.monthlyLimit > 0 && (
          <div style={{ marginTop: 12 }}>
            <Bar
              pct={sm.pctOfLimit}
              color={sm.pctOfLimit > 100 ? "linear-gradient(90deg,#bf7a72,#c9a3bb)" : "linear-gradient(90deg,#8d9a5b,#e3c4d7)"}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9 }}>
              <span className="faint" style={{ fontSize: 12 }}>{money(sm.spent, cur)} spent</span>
              <span className="faint" style={{ fontSize: 12 }}>
                {sm.leftOfLimit < 0 ? `${money(-sm.leftOfLimit, cur)} over` : `${money(sm.leftOfLimit, cur)} left`}
              </span>
            </div>
            {sm.daysLeft > 0 && sm.leftOfLimit > 0 && (
              <p className="faint" style={{ fontSize: 12, margin: "10px 0 0" }}>
                {money(Math.round(sm.perDayLeft), cur)} a day for {sm.daysLeft} day{sm.daysLeft === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        )}
        {limit.monthlyLimit === 0 && (
          <p className="sub" style={{ marginBottom: 0 }}>Optional. Leave blank to just track.</p>
        )}
      </section>

      {/* ---- recurring ---- */}
      <h2 className="section">Recurring</h2>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span className="label">Every month</span>
          <span className="amount amount-md">{money(recurringTotal, cur)}</span>
        </div>

        {recurring.length === 0 ? (
          <Empty icon="doc" title="Nothing recurring yet" />
        ) : (
          recurring.map((r) => {
            const k = catOf(data.categories, r.category);
            return (
              <div className="row" key={r.id} style={{ opacity: r.active ? 1 : 0.45 }}>
                <Dot icon={k.icon} tint={k.tint} size={34} />
                <div className="row-main">
                  <div className="row-title">{r.name}</div>
                  <div className="row-sub">day {r.day}</div>
                </div>
                <span className="amount" style={{ fontSize: 17 }}>{money(r.amount, cur)}</span>
                <IconBtn icon={r.active ? "pause" : "play"} label="Pause" onClick={() => toggleRecurring(r.id)} />
                <IconBtn icon="close" label="Remove" onClick={() => removeRecurring(r.id)} />
              </div>
            );
          })
        )}

        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => setBillSheet(true)}>
          <Icon name="plus" size={14} /> Add recurring
        </button>
        <p className="faint" style={{ fontSize: 11.5, margin: "12px 0 0" }}>
          A reminder list. Log each one on the Add tab when it actually leaves your account.
        </p>
      </div>

      {/* ---- category caps ---- */}
      <h2 className="section">Category limits</h2>
      <div className="card">
        {caps.length === 0 ? (
          <Empty icon="flag" title="No limits set" />
        ) : (
          caps.map(([id, cap]) => {
            const k = catOf(data.categories, id);
            const spent = sm.byCategory.find((c) => c.id === id)?.total ?? 0;
            const pct = (spent / cap) * 100;
            return (
              <div key={id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14, alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name={k.icon} size={15} style={{ color: k.tint }} />
                    {k.label}
                  </span>
                  <span className="num muted">
                    {money(spent, cur)} <span className="faint">/ {money(cap, cur)}</span>
                  </span>
                </div>
                <Bar
                  pct={pct}
                  color={pct > 100 ? "linear-gradient(90deg,#bf7a72,#c9a3bb)" : `linear-gradient(90deg, ${k.tint}, ${k.tint}88)`}
                />
              </div>
            );
          })
        )}
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setCapSheet(true)}>
          Set limits
        </button>
      </div>

      {/* ---- pause list ---- */}
      <h2 className="section">Pause list</h2>
      <div className="card">
        <p className="faint" style={{ fontSize: 12, marginTop: 0 }}>
          Wait {pauseDays} days before buying. {passed.length > 0 && `Skipped ${money(passed.reduce((a, w) => a + w.amount, 0), cur)} so far.`}
        </p>

        {openWishes.length === 0 ? (
          <Empty icon="clock" title="Nothing paused" />
        ) : (
          openWishes.map((w) => {
            const waited = Math.floor((Date.now() - w.addedAt) / 86400000);
            const ready = waited >= pauseDays;
            return (
              <div key={w.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 15 }}>{w.name}</span>
                  <span className="amount" style={{ fontSize: 17 }}>{money(w.amount, cur)}</span>
                  <IconBtn icon="close" label="Remove" onClick={() => removeWish(w.id)} />
                </div>
                <Bar pct={(Math.min(waited, pauseDays) / pauseDays) * 100} color="linear-gradient(90deg,#c9a3bb,#b3bd8e)" />
                <p className="faint" style={{ fontSize: 11.5, margin: "7px 0 0" }}>
                  {ready ? "Time's up" : `Day ${waited} of ${pauseDays}`}
                </p>
                {ready && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => resolveWish(w.id, "passed")}>Skip</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => resolveWish(w.id, "bought")}>Buy</button>
                  </div>
                )}
              </div>
            );
          })
        )}

        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setWishSheet(true)}>
          <Icon name="plus" size={14} /> Pause something
        </button>
      </div>

      {/* ---- sheets ---- */}
      <Sheet open={billSheet} onClose={() => setBillSheet(false)} title="Recurring">
        <RecurringForm
          cur={cur}
          categories={data.categories}
          accounts={data.accounts}
          onAdd={(r) => { addRecurring(r); setBillSheet(false); }}
        />
      </Sheet>

      <Sheet open={capSheet} onClose={() => setCapSheet(false)} title="Category limits">
        {data.categories.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
            <Icon name={c.icon} size={17} style={{ color: c.tint }} />
            <span style={{ flex: 1, fontSize: 14 }}>{c.label}</span>
            <input
              className="input"
              style={{ width: 116, padding: "9px 12px", textAlign: "right" }}
              inputMode="decimal"
              placeholder={cur}
              value={limit.envelopes[c.id] || ""}
              onChange={(e) => saveLimit({ envelopes: { ...limit.envelopes, [c.id]: num(e.target.value) } })}
            />
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setCapSheet(false)}>Done</button>
      </Sheet>

      <Sheet open={wishSheet} onClose={() => setWishSheet(false)} title="Pause">
        <WishForm cur={cur} onAdd={(w) => { addWish(w); setWishSheet(false); }} />
      </Sheet>
    </div>
  );
}

function RecurringForm({
  cur, categories, accounts, onAdd,
}: {
  cur: string;
  categories: { id: string; label: string; icon: string; tint: string }[];
  accounts: { id: string; name: string; icon: string; tint: string }[];
  onAdd: (r: { name: string; amount: number; day: number; category: string; account: string; active: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [category, setCategory] = useState(categories[0]?.id ?? "other");
  const [account, setAccount] = useState(accounts[0]?.id ?? "current");

  return (
    <div>
      <Field label="Name">
        <input className="input" autoFocus placeholder="Rent" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`Amount (${cur})`}>
        <input className="input" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <Field label="Day of month">
        <input className="input" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value.replace(/[^0-9]/g, ""))} />
      </Field>
      <Field label="Paid from">
        <div className="chips">
          {accounts.map((a) => (
            <button key={a.id} className="chip" data-on={account === a.id} onClick={() => setAccount(a.id)}>
              <Icon name={a.icon} size={14} style={{ color: a.tint }} /> {a.name}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Category">
        <div className="chips">
          {categories.map((c) => (
            <button key={c.id} className="chip" data-on={category === c.id} onClick={() => setCategory(c.id)}>
              <Icon name={c.icon} size={14} style={{ color: c.tint }} /> {c.label}
            </button>
          ))}
        </div>
      </Field>
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !Number(amount)}
        onClick={() =>
          onAdd({
            name: name.trim(),
            amount: Number(amount) || 0,
            day: Math.min(28, Math.max(1, Number(day) || 1)),
            category,
            account,
            active: true,
          })
        }
      >
        Add
      </button>
    </div>
  );
}

function WishForm({ cur, onAdd }: { cur: string; onAdd: (w: { name: string; amount: number; url?: string }) => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <div>
      <Field label="What">
        <input className="input" autoFocus placeholder="The coat" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`Price (${cur})`}>
        <input className="input" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !Number(amount)}
        onClick={() => onAdd({ name: name.trim(), amount: Number(amount) || 0 })}
      >
        Start
      </button>
    </div>
  );
}
