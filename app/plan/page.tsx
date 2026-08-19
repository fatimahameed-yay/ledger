"use client";

import { useMemo, useState } from "react";
import { useLedger, computeStats } from "@/lib/store";
import { CATEGORIES, cat } from "@/lib/categories";
import { money, monthLabel, shiftMonth, monthShort } from "@/lib/format";
import { MonthSwitch, Sheet, Bar, Field, Empty } from "@/components/UI";

export default function PlanPage() {
  const {
    ready, data, month, setMonth, plan, savePlan,
    addRecurring, removeRecurring, toggleRecurring,
  } = useLedger();
  const cur = data.settings.currency;
  const stats = useMemo(() => computeStats(data, month), [data, month]);

  const [incomeSheet, setIncomeSheet] = useState(false);
  const [billSheet, setBillSheet] = useState(false);
  const [envSheet, setEnvSheet] = useState(false);

  if (!ready) return <div style={{ height: "60vh" }} />;

  const prev = shiftMonth(month, -1);
  const prevPlan = data.plans[prev];
  const recurring = [...data.recurring].sort((a, b) => a.day - b.day);
  const activeBills = recurring.filter((r) => r.active);
  const usingRecurring = plan.fixedTotal === 0;

  const slices = [
    { label: "Savings", value: stats.toSavings, color: "linear-gradient(90deg,#6b7442,#8d9a5b)" },
    { label: "Fixed & bills", value: stats.fixed, color: "linear-gradient(90deg,#c9b8a3,#e4d9c9)" },
    { label: "Yours to spend", value: stats.spendable, color: "linear-gradient(90deg,#c9a3bb,#e3c4d7)" },
  ];
  const totalAllocated = slices.reduce((a, s) => a + s.value, 0);

  return (
    <div className="fade-up">
      <header className="page-head">
        <p className="eyebrow">The plan</p>
        <h1 className="display">Give every<br />note a job.</h1>
        <div style={{ marginTop: 16 }}>
          <MonthSwitch month={month} setMonth={setMonth} />
        </div>
      </header>

      {/* ---------- income ---------- */}
      <section className="hero">
        <p className="label">Paid this month</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <p className="amount amount-xl" style={{ margin: "4px 0 0", color: "var(--olive-900)" }}>
            {money(stats.income, cur)}
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => setIncomeSheet(true)}>
            {stats.income > 0 ? "Edit" : "Add"}
          </button>
        </div>

        {stats.income > 0 ? (
          <>
            <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", marginTop: 20, gap: 2 }}>
              {slices.map((s) => (
                <div key={s.label} style={{ flex: Math.max(s.value, 0.001), background: s.color }} />
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              {slices.map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i style={{ width: 9, height: 9, borderRadius: 999, background: s.color, display: "inline-block" }} />
                    {s.label}
                  </span>
                  <span className="num">
                    {money(s.value, cur)}
                    <span className="faint" style={{ fontSize: 11.5, marginLeft: 6 }}>
                      {totalAllocated > 0 ? Math.round((s.value / stats.income) * 100) : 0}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <p className="faint" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
              That&apos;s {money(Math.round(stats.dailyAllowance), cur)} a day for {stats.daysTotal} days.
            </p>
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.7)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span className="label">Still in current account</span>
              <span className="amount amount-md" style={{ color: stats.left < 0 ? "var(--alert)" : "var(--olive-900)" }}>
                {money(stats.left, cur)}
              </span>
            </div>
          </>
        ) : (
          <p className="sub" style={{ marginTop: 10 }}>
            Add your salary and I&apos;ll split it into savings, bills, and a daily allowance you can actually keep to.
          </p>
        )}
      </section>

      {stats.income === 0 && prevPlan && prevPlan.income > 0 && (
        <button
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 12 }}
          onClick={() => savePlan({ ...prevPlan })}
        >
          ↺ Copy {monthLabel(prev)} plan ({money(prevPlan.income, cur)})
        </button>
      )}

      {/* ---------- savings split ---------- */}
      <h2 className="section">Savings first</h2>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="label">Pay yourself</span>
          <span className="amount amount-md" style={{ color: "var(--olive-700)" }}>
            {money(stats.toSavings, cur)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={60}
          step={1}
          value={plan.savingsPct}
          onChange={(e) => savePlan({ savingsPct: Number(e.target.value) })}
          style={{ width: "100%", marginTop: 14, accentColor: "#8d9a5b" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="faint" style={{ fontSize: 11 }}>0%</span>
          <span style={{ fontSize: 13 }}>{plan.savingsPct}% of income</span>
          <span className="faint" style={{ fontSize: 11 }}>60%</span>
        </div>
        <div className="chips" style={{ marginTop: 14 }}>
          {[10, 20, 30, 40, 50].map((p) => (
            <button key={p} className="chip" data-on={plan.savingsPct === p} onClick={() => savePlan({ savingsPct: p })}>
              {p}%
            </button>
          ))}
        </div>
        <p className="faint" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>
          Move this out on payday, before anything else. What&apos;s left in the current account is what you actually have.
        </p>
      </div>

      {/* ---------- fixed costs ---------- */}
      <h2 className="section">Fixed & recurring</h2>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="label">{usingRecurring ? "From your list" : "Manual total"}</span>
          <span className="amount amount-md">{money(stats.fixed, cur)}</span>
        </div>

        {recurring.length === 0 ? (
          <Empty emoji="📄" title="No recurring costs yet" line="Rent, pilates membership, phone, subscriptions…" />
        ) : (
          recurring.map((r) => {
            const k = cat(r.category);
            return (
              <div className="row" key={r.id}>
                <span className="dot" style={{ background: `${k.tint}22`, opacity: r.active ? 1 : 0.4 }}>{k.emoji}</span>
                <div className="row-main" style={{ opacity: r.active ? 1 : 0.45 }}>
                  <div className="row-title">{r.name}</div>
                  <div className="row-sub">the {ordinal(r.day)} · {k.label}</div>
                </div>
                <span className="amount" style={{ fontSize: 17, opacity: r.active ? 1 : 0.45 }}>{money(r.amount, cur)}</span>
                <button className="chip btn-sm" onClick={() => toggleRecurring(r.id)} title="Pause">
                  {r.active ? "⏸" : "▶"}
                </button>
                <button className="chip btn-sm" onClick={() => removeRecurring(r.id)} title="Remove">✕</button>
              </div>
            );
          })
        )}

        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 14 }} onClick={() => setBillSheet(true)}>
          + Add a recurring cost
        </button>
        <p className="faint" style={{ fontSize: 11.5, margin: "12px 0 0", lineHeight: 1.55 }}>
          These come off the top automatically — don&apos;t log them again as entries, or they&apos;ll count twice.
        </p>

        <hr className="divider" />
        <Field label="Or override with one flat number">
          <input
            className="input"
            inputMode="decimal"
            placeholder={`e.g. ${activeBills.length ? Math.round(stats.fixed) : 800}`}
            value={plan.fixedTotal || ""}
            onChange={(e) => savePlan({ fixedTotal: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
          />
        </Field>
        <p className="faint" style={{ fontSize: 11.5, margin: 0 }}>
          Leave empty to keep using the list above.
        </p>
      </div>

      {/* ---------- envelopes ---------- */}
      <h2 className="section">Category limits</h2>
      <div className="card">
        <p className="sub" style={{ marginTop: 0 }}>
          Soft caps per category. You&apos;ll see a gentle nudge when one is nearly full — nothing is ever blocked.
        </p>
        {Object.keys(plan.envelopes).length === 0 ? (
          <Empty emoji="✉️" title="No limits set" line="Try one for dining or wardrobe — the two that always creep." />
        ) : (
          Object.entries(plan.envelopes)
            .filter(([, cap]) => cap > 0)
            .map(([id, cap]) => {
              const k = cat(id);
              const spent = stats.byCategory.find((c) => c.id === id)?.total ?? 0;
              const pct = (spent / cap) * 100;
              return (
                <div key={id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                    <span>{k.emoji} {k.label}</span>
                    <span className="num muted">
                      {money(spent, cur)} <span className="faint">/ {money(cap, cur)}</span>
                    </span>
                  </div>
                  <Bar
                    pct={pct}
                    color={pct > 100 ? "linear-gradient(90deg,#bf7a72,#c9a3bb)" : `linear-gradient(90deg, ${k.tint}, ${k.tint}88)`}
                  />
                  {pct > 100 && (
                    <p className="faint" style={{ fontSize: 11.5, margin: "6px 0 0", color: "var(--alert)" }}>
                      {money(spent - cap, cur)} over — worth a look.
                    </p>
                  )}
                </div>
              );
            })
        )}
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setEnvSheet(true)}>
          Set category limits
        </button>
      </div>

      {/* ---------- sheets ---------- */}
      <Sheet open={incomeSheet} onClose={() => setIncomeSheet(false)} title={`${monthShort(month)} income`}>
        <Field label={`Amount landing in your account (${cur})`}>
          <input
            className="input"
            inputMode="decimal"
            autoFocus
            placeholder="0"
            value={plan.income || ""}
            onChange={(e) => savePlan({ income: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
          />
        </Field>
        <p className="faint" style={{ fontSize: 12 }}>
          Include anything extra — freelance, a bonus, money from family. Whatever you actually received this month.
        </p>
        <button className="btn btn-primary" onClick={() => setIncomeSheet(false)}>Done</button>
      </Sheet>

      <Sheet open={billSheet} onClose={() => setBillSheet(false)} title="Recurring cost">
        <RecurringForm
          cur={cur}
          onAdd={(r) => {
            addRecurring(r);
            setBillSheet(false);
          }}
        />
      </Sheet>

      <Sheet open={envSheet} onClose={() => setEnvSheet(false)} title="Category limits">
        <p className="faint" style={{ fontSize: 12, marginTop: 0 }}>Leave blank for no limit.</p>
        {CATEGORIES.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
            <span style={{ flex: 1, fontSize: 14 }}>{c.emoji} {c.label}</span>
            <input
              className="input"
              style={{ width: 110, padding: "9px 12px", textAlign: "right" }}
              inputMode="decimal"
              placeholder={cur}
              value={plan.envelopes[c.id] || ""}
              onChange={(e) =>
                savePlan({
                  envelopes: {
                    ...plan.envelopes,
                    [c.id]: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0,
                  },
                })
              }
            />
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setEnvSheet(false)}>Done</button>
      </Sheet>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function RecurringForm({
  cur,
  onAdd,
}: {
  cur: string;
  onAdd: (r: { name: string; amount: number; day: number; category: string; active: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [category, setCategory] = useState("bills");

  return (
    <div>
      <Field label="What is it">
        <input className="input" autoFocus placeholder="Rent · Reformer membership · Spotify" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`Amount (${cur})`}>
        <input className="input" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <Field label="Charged on day">
        <input className="input" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value.replace(/[^0-9]/g, ""))} />
      </Field>
      <Field label="Category">
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c.id} className="chip" data-on={category === c.id} onClick={() => setCategory(c.id)}>
              {c.emoji} {c.label}
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
            active: true,
          })
        }
      >
        Add
      </button>
    </div>
  );
}
