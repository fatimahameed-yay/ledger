"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useLedger, balanceOf, totalBalance, monthSummary, txnsFor,
} from "@/lib/store";
import { money, monthKey, prettyDate, monthLabel } from "@/lib/format";
import { catOf } from "@/lib/categories";
import { Icon } from "@/lib/icons";
import { Bar, Dot, Empty, Field, MonthSwitch } from "@/components/UI";
import type { Txn } from "@/lib/types";

export default function Home() {
  const { ready, data, month, setMonth } = useLedger();
  const cur = data.settings.currency;

  const total = useMemo(() => (ready ? totalBalance(data) : 0), [data, ready]);
  const sm = useMemo(() => monthSummary(data, month), [data, month]);
  const recent = useMemo(
    () =>
      [...txnsFor(data, month)]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
        .slice(0, 6),
    [data, month]
  );

  if (!ready) return <div style={{ height: "60vh" }} />;
  if (!data.settings.onboarded) return <Onboarding />;

  const name = data.settings.name.trim();
  const isCurrent = month === monthKey(new Date());

  return (
    <div className="fade-up">
      <header className="page-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            {name && <p className="eyebrow">{name}</p>}
            <h1 className="display">Your money</h1>
          </div>
          <Link href="/settings" aria-label="Settings" className="icon-btn" style={{ marginTop: 6 }}>
            <Icon name="gear" size={16} />
          </Link>
        </div>
      </header>

      {/* ---------- total ---------- */}
      <section className="hero" style={{ textAlign: "center" }}>
        <span className="label">Total balance</span>
        <p className="amount amount-xl" style={{ margin: "8px 0 0", color: "var(--olive-900)" }}>
          {money(total, cur)}
        </p>
        <p className="faint" style={{ fontSize: 12, margin: "8px 0 0" }}>
          across {data.accounts.length} account{data.accounts.length === 1 ? "" : "s"}
        </p>
      </section>

      {/* ---------- accounts ---------- */}
      <div className="acct-grid">
        {data.accounts.map((a) => {
          const bal = balanceOf(data, a.id);
          return (
            <Link href={`/account/${a.id}`} key={a.id} className="acct">
              <span className="acct-ic" style={{ background: `${a.tint}1f`, color: a.tint }}>
                <Icon name={a.icon} size={18} />
              </span>
              <span className="acct-name">{a.name}</span>
              <span className="amount acct-amt" style={{ color: bal < 0 ? "var(--alert)" : "var(--ink)" }}>
                {money(bal, cur)}
              </span>
              <span className="acct-go"><Icon name="right" size={14} /></span>
            </Link>
          );
        })}
      </div>

      {/* ---------- this month ---------- */}
      <h2 className="section">{isCurrent ? "This month" : monthLabel(month)}</h2>
      <div style={{ marginBottom: 12 }}>
        <MonthSwitch month={month} setMonth={setMonth} />
      </div>

      <div className="card">
        <div className="grid-2" style={{ gap: 14 }}>
          <div>
            <span className="label">Spent</span>
            <p className="amount amount-lg" style={{ margin: "4px 0 0", color: "var(--blush-700)" }}>
              {money(sm.spent, cur)}
            </p>
          </div>
          <div>
            <span className="label">Came in</span>
            <p className="amount amount-lg" style={{ margin: "4px 0 0", color: "var(--olive-700)" }}>
              {money(sm.earned, cur)}
            </p>
          </div>
        </div>

        {sm.limit > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 13 }}>
              <span className="muted">Monthly limit</span>
              <span className="num muted">{money(sm.spent, cur)} / {money(sm.limit, cur)}</span>
            </div>
            <Bar
              pct={sm.pctOfLimit}
              color={sm.pctOfLimit > 100 ? "linear-gradient(90deg,#bf7a72,#c9a3bb)" : "linear-gradient(90deg,#8d9a5b,#e3c4d7)"}
            />
            <p className="faint" style={{ fontSize: 12, margin: "9px 0 0" }}>
              {sm.leftOfLimit < 0
                ? `${money(-sm.leftOfLimit, cur)} over`
                : isCurrent
                ? `${money(Math.round(sm.perDayLeft), cur)} a day for ${sm.daysLeft} day${sm.daysLeft === 1 ? "" : "s"}`
                : `${money(sm.leftOfLimit, cur)} unspent`}
            </p>
          </div>
        )}

        {sm.limit === 0 && (
          <Link href="/plan" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>
            Set a monthly limit
          </Link>
        )}
      </div>

      {/* ---------- where it goes ---------- */}
      <h2 className="section">Where it goes</h2>
      <div className="card">
        {sm.byCategory.length === 0 ? (
          <Empty icon="chart" title="Nothing spent yet" />
        ) : (
          <>
            {sm.byCategory.slice(0, 5).map((c) => {
              const k = catOf(data.categories, c.id);
              return (
                <div key={c.id} style={{ marginBottom: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14, alignItems: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Icon name={k.icon} size={15} style={{ color: k.tint }} />
                      {k.label}
                    </span>
                    <span className="num muted">
                      {money(c.total, cur)} <span className="faint" style={{ fontSize: 11.5 }}>{Math.round(c.pct)}%</span>
                    </span>
                  </div>
                  <Bar pct={c.pct} color={`linear-gradient(90deg, ${k.tint}, ${k.tint}88)`} />
                </div>
              );
            })}
            <Link href="/spending" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}>
              Full breakdown
            </Link>
          </>
        )}
      </div>

      {/* ---------- recent ---------- */}
      <h2 className="section">Recent</h2>
      <div className="card">
        {recent.length === 0 ? (
          <Empty icon="list" title="No activity yet" />
        ) : (
          <>
            {recent.map((t) => (
              <TxRow key={t.id} t={t} cur={cur} cats={data.categories} accounts={data.accounts} />
            ))}
            <Link href="/activity" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              All activity
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- shared row ---------- */
export function TxRow({
  t, cur, cats, accounts, onTap, showDate,
}: {
  t: Txn;
  cur: string;
  cats: { id: string; label: string; icon: string; tint: string }[];
  accounts: { id: string; name: string }[];
  onTap?: () => void;
  showDate?: boolean;
}) {
  const accName = (id?: string) => accounts.find((a) => a.id === id)?.name ?? "";

  if (t.type === "spend") {
    const k = catOf(cats, t.category ?? "other");
    return (
      <div className="row" onClick={onTap} style={onTap ? { cursor: "pointer" } : undefined}>
        <Dot icon={k.icon} tint={k.tint} />
        <div className="row-main">
          <div className="row-title">{t.merchant || k.label}</div>
          <div className="row-sub">
            {showDate ? `${prettyDate(t.date)} · ` : ""}{k.label} · {accName(t.account)}
          </div>
        </div>
        <span className="amount" style={{ fontSize: 18 }}>−{money(t.amount, cur)}</span>
      </div>
    );
  }

  if (t.type === "income") {
    return (
      <div className="row" onClick={onTap} style={onTap ? { cursor: "pointer" } : undefined}>
        <Dot icon="down" tint="#6b7442" />
        <div className="row-main">
          <div className="row-title">{t.merchant || "Money in"}</div>
          <div className="row-sub">
            {showDate ? `${prettyDate(t.date)} · ` : ""}into {accName(t.account)}
          </div>
        </div>
        <span className="amount" style={{ fontSize: 18, color: "var(--olive-700)" }}>
          +{money(t.amount, cur)}
        </span>
      </div>
    );
  }

  return (
    <div className="row" onClick={onTap} style={onTap ? { cursor: "pointer" } : undefined}>
      <Dot icon="refresh" tint="#9aa6a0" />
      <div className="row-main">
        <div className="row-title">Moved</div>
        <div className="row-sub">
          {showDate ? `${prettyDate(t.date)} · ` : ""}{accName(t.account)} → {accName(t.toAccount)}
        </div>
      </div>
      <span className="amount" style={{ fontSize: 18, color: "var(--ink-soft)" }}>{money(t.amount, cur)}</span>
    </div>
  );
}

/* ---------- first run ---------- */
function Onboarding() {
  const { data, setSettings, updateAccount } = useLedger();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("Rs");
  const [current, setCurrent] = useState("");
  const [savings, setSavings] = useState("");

  const num = (v: string) => Number(v.replace(/[^0-9.]/g, "")) || 0;
  const start = monthLabel(monthKey());

  function finish() {
    updateAccount("current", { opening: num(current) });
    updateAccount("savings", { opening: num(savings) });
    setSettings({
      name: name.trim(),
      currency,
      onboarded: true,
      startMonth: monthKey(),
    });
  }

  return (
    <div className="fade-up" style={{ paddingTop: 24 }}>
      <header className="page-head">
        <p className="eyebrow">Starting {start}</p>
        <h1 className="display">{step === 0 ? "Hello" : "What have you got?"}</h1>
      </header>

      {step === 0 ? (
        <>
          <div className="card">
            <Field label="Your name">
              <input className="input" placeholder="Optional" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Currency">
              <div className="chips">
                {["Rs", "₨", "PKR", "$", "£", "€", "₹", "AED"].map((c) => (
                  <button key={c} className="chip" data-on={currency === c} onClick={() => setCurrency(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setStep(1)}>
            Next
          </button>
        </>
      ) : (
        <>
          <div className="card">
            <p className="sub" style={{ marginTop: 0, marginBottom: 18 }}>
              Today&apos;s balances. Anything before {start} is ignored.
            </p>

            <Field label={`In your current account (${currency})`}>
              <input
                className="input"
                inputMode="decimal"
                autoFocus
                placeholder="0"
                value={current}
                onChange={(e) => setCurrent(e.target.value.replace(/[^0-9.]/g, ""))}
              />
            </Field>

            <Field label={`In savings (${currency})`}>
              <input
                className="input"
                inputMode="decimal"
                placeholder="0"
                value={savings}
                onChange={(e) => setSavings(e.target.value.replace(/[^0-9.]/g, ""))}
              />
            </Field>

            {(num(current) > 0 || num(savings) > 0) && (
              <div style={{ textAlign: "center", marginTop: 6 }}>
                <span className="label">Total</span>
                <p className="amount amount-lg" style={{ margin: "4px 0 0", color: "var(--olive-900)" }}>
                  {money(num(current) + num(savings), currency)}
                </p>
              </div>
            )}
          </div>

          <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={finish}>
            Start
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setStep(0)}>
            Back
          </button>
          <p className="faint" style={{ fontSize: 11.5, textAlign: "center", marginTop: 14 }}>
            You can change these any time in Settings.
          </p>
        </>
      )}
    </div>
  );
}
