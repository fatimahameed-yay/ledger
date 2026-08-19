"use client";

import { useMemo, useState } from "react";
import { useLedger, computeStats } from "@/lib/store";
import { catOf } from "@/lib/categories";
import { money, monthShort, shiftMonth } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { MonthSwitch, Sheet, Bar, Field, Empty, Dot, IconBtn } from "@/components/UI";

const num = (v: string) => Number(v.replace(/[^0-9.]/g, "")) || 0;

export default function PlanPage() {
  const {
    ready, data, month, setMonth, plan, savePlan,
    addRecurring, removeRecurring, toggleRecurring,
  } = useLedger();
  const cur = data.settings.currency;
  const stats = useMemo(() => computeStats(data, month), [data, month]);

  const [billSheet, setBillSheet] = useState(false);
  const [envSheet, setEnvSheet] = useState(false);

  if (!ready) return <div style={{ height: "60vh" }} />;

  const prev = shiftMonth(month, -1);
  const prevPlan = data.plans[prev];
  const recurring = [...data.recurring].sort((a, b) => a.day - b.day);
  const caps = Object.entries(plan.envelopes).filter(([, v]) => v > 0);

  const slices = [
    { label: "Savings", value: stats.toSavings, color: "linear-gradient(90deg,#6b7442,#8d9a5b)" },
    { label: "Fixed", value: stats.fixed, color: "linear-gradient(90deg,#c9b8a3,#e4d9c9)" },
    { label: "To spend", value: stats.spendable, color: "linear-gradient(90deg,#c9a3bb,#e3c4d7)" },
  ];

  return (
    <div className="fade-up">
      <header className="page-head">
        <h1 className="display">Plan</h1>
        <div style={{ marginTop: 16 }}>
          <MonthSwitch month={month} setMonth={setMonth} />
        </div>
      </header>

      {/* ---- income ---- */}
      <section className="hero">
        <span className="label">Income</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
          <span className="amount" style={{ fontSize: 24, color: "var(--ink-soft)" }}>{cur}</span>
          <input
            className="input-amount"
            style={{ flex: 1, textAlign: "left", fontSize: 40, padding: "4px 0 10px" }}
            inputMode="decimal"
            placeholder="0"
            value={plan.income ? plan.income.toLocaleString("en-US") : ""}
            onChange={(e) => savePlan({ income: num(e.target.value) })}
          />
        </div>

        {stats.income > 0 && (
          <>
            <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", marginTop: 16, gap: 2 }}>
              {slices.map((s) => (
                <div key={s.label} style={{ flex: Math.max(s.value, 0.001), background: s.color }} />
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              {slices.map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i style={{ width: 9, height: 9, borderRadius: 999, background: s.color, display: "inline-block" }} />
                    {s.label}
                  </span>
                  <span className="num">
                    {money(s.value, cur)}
                    <span className="faint" style={{ fontSize: 11.5, marginLeft: 6 }}>
                      {Math.round((s.value / stats.income) * 100)}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {prevPlan && prevPlan.income > 0 && plan.income === 0 && (
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 14 }} onClick={() => savePlan({ ...prevPlan })}>
            <Icon name="refresh" size={14} /> Copy {monthShort(prev)}
          </button>
        )}
      </section>

      {/* ---- savings ---- */}
      <h2 className="section">Savings</h2>
      <div className="card">
        <div className="segment" style={{ marginBottom: 16 }}>
          <button data-on={plan.savingsMode === "percent"} onClick={() => savePlan({ savingsMode: "percent" })}>
            Percent
          </button>
          <button data-on={plan.savingsMode === "amount"} onClick={() => savePlan({ savingsMode: "amount" })}>
            Fixed amount
          </button>
        </div>

        {plan.savingsMode === "percent" ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="label">{plan.savingsPct}% of income</span>
              <span className="amount amount-md" style={{ color: "var(--olive-700)" }}>
                {money(stats.toSavings, cur)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={plan.savingsPct}
              onChange={(e) => savePlan({ savingsPct: Number(e.target.value) })}
              style={{ width: "100%", marginTop: 12 }}
            />
            <div className="chips">
              {[10, 20, 25, 30, 50].map((p) => (
                <button key={p} className="chip" data-on={plan.savingsPct === p} onClick={() => savePlan({ savingsPct: p })}>
                  {p}%
                </button>
              ))}
            </div>
          </>
        ) : (
          <Field label={`Exact amount (${cur})`}>
            <input
              className="input"
              inputMode="decimal"
              placeholder="0"
              value={plan.savingsAmount || ""}
              onChange={(e) => savePlan({ savingsAmount: num(e.target.value) })}
            />
          </Field>
        )}
      </div>

      {/* ---- fixed ---- */}
      <h2 className="section">Fixed</h2>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span className="label">{plan.fixedTotal > 0 ? "Manual total" : "From list"}</span>
          <span className="amount amount-md">{money(stats.fixed, cur)}</span>
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

        <hr className="divider" />
        <Field label={`Or one flat total (${cur})`}>
          <input
            className="input"
            inputMode="decimal"
            placeholder="leave empty to use the list"
            value={plan.fixedTotal || ""}
            onChange={(e) => savePlan({ fixedTotal: num(e.target.value) })}
          />
        </Field>
        <p className="faint" style={{ fontSize: 11.5, margin: 0 }}>Taken off the top — don&apos;t log these as entries.</p>
      </div>

      {/* ---- spendable ---- */}
      <h2 className="section">Budget</h2>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="label">{stats.spendableIsManual ? "Set by you" : "Whatever is left"}</span>
          <span className="amount amount-md" style={{ color: "var(--olive-900)" }}>{money(stats.spendable, cur)}</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label={`Override the monthly limit (${cur})`}>
            <input
              className="input"
              inputMode="decimal"
              placeholder={`empty = ${money(Math.max(0, stats.income - stats.toSavings - stats.fixed), cur)}`}
              value={plan.spendableOverride || ""}
              onChange={(e) => savePlan({ spendableOverride: num(e.target.value) })}
            />
          </Field>
        </div>
        <p className="faint" style={{ fontSize: 11.5, margin: 0 }}>
          {money(Math.round(stats.dailyAllowance), cur)} a day across {stats.daysTotal} days.
        </p>
      </div>

      {/* ---- category caps ---- */}
      <h2 className="section">Limits</h2>
      <div className="card">
        {caps.length === 0 ? (
          <Empty icon="flag" title="No category limits" />
        ) : (
          caps.map(([id, cap]) => {
            const k = catOf(data.categories, id);
            const spent = stats.byCategory.find((c) => c.id === id)?.total ?? 0;
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
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setEnvSheet(true)}>
          Set limits
        </button>
      </div>

      {/* ---- sheets ---- */}
      <Sheet open={billSheet} onClose={() => setBillSheet(false)} title="Recurring">
        <RecurringForm
          cur={cur}
          categories={data.categories}
          onAdd={(r) => {
            addRecurring(r);
            setBillSheet(false);
          }}
        />
      </Sheet>

      <Sheet open={envSheet} onClose={() => setEnvSheet(false)} title="Limits">
        {data.categories.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
            <Icon name={c.icon} size={17} style={{ color: c.tint }} />
            <span style={{ flex: 1, fontSize: 14 }}>{c.label}</span>
            <input
              className="input"
              style={{ width: 116, padding: "9px 12px", textAlign: "right" }}
              inputMode="decimal"
              placeholder={cur}
              value={plan.envelopes[c.id] || ""}
              onChange={(e) => savePlan({ envelopes: { ...plan.envelopes, [c.id]: num(e.target.value) } })}
            />
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setEnvSheet(false)}>Done</button>
      </Sheet>
    </div>
  );
}

function RecurringForm({
  cur,
  categories,
  onAdd,
}: {
  cur: string;
  categories: { id: string; label: string; icon: string; tint: string }[];
  onAdd: (r: { name: string; amount: number; day: number; category: string; active: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [category, setCategory] = useState(categories[0]?.id ?? "other");

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
            active: true,
          })
        }
      >
        Add
      </button>
    </div>
  );
}
