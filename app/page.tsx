"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLedger, computeStats, computeAccounts, expensesFor } from "@/lib/store";
import { money, monthKey, prettyDate, monthShort } from "@/lib/format";
import { cat } from "@/lib/categories";
import { Ring, MonthSwitch, Bar, Empty } from "@/components/UI";

const MANTRAS = [
  "Quiet luxury is a well-kept balance.",
  "Nothing bought in a hurry ever felt like enough.",
  "The prettiest number is the one you kept.",
  "Spend on the life you actually live.",
  "Small, boring, consistent. That is the whole secret.",
  "You can afford anything — not everything.",
  "A calm account is a calm mind.",
  "Buy less, choose well, make it last.",
];

// keeps a long rupee figure inside the ring
function fit(text: string) {
  const n = text.length;
  if (n <= 8) return 50;
  if (n <= 10) return 42;
  if (n <= 12) return 35;
  return 30;
}

export default function Home() {
  const { ready, data, month, setMonth } = useLedger();
  const stats = useMemo(() => computeStats(data, month), [data, month]);
  const acc = useMemo(() => computeAccounts(data, month), [data, month]);
  const cur = data.settings.currency;
  const isCurrent = month === monthKey(new Date());

  const recent = useMemo(
    () => [...expensesFor(data, month)].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt)).slice(0, 5),
    [data, month]
  );

  const mantra = MANTRAS[new Date().getDate() % MANTRAS.length];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = data.settings.name.trim();

  if (!ready) return <div style={{ height: "60vh" }} />;

  const setUp = stats.income > 0;
  const paceOver = stats.pace > 0;
  const heroFigure = money(Math.round(isCurrent ? stats.safeToday : stats.left), cur);
  const maxDay = Math.max(...stats.byDay, 1);

  return (
    <div className="fade-up">
      <header className="page-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <p className="eyebrow">{greet}{name ? `, ${name}` : ""}</p>
            <h1 className="display">Your month,<br />in soft focus.</h1>
          </div>
          <Link href="/settings" aria-label="Settings" style={{ marginTop: 4, color: "var(--ink-faint)" }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.72 15a1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.72h.08A1.6 1.6 0 0 0 10.5 3.25V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9v.08a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></svg>
          </Link>
        </div>
        <div style={{ marginTop: 16 }}>
          <MonthSwitch month={month} setMonth={setMonth} />
        </div>
      </header>

      {!setUp ? (
        <div className="hero" style={{ textAlign: "center" }}>
          <p className="label">First things first</p>
          <h2 className="section" style={{ margin: "8px 0 6px", fontSize: 27 }}>
            Tell me what came in
          </h2>
          <p className="sub" style={{ maxWidth: 300, margin: "0 auto 18px" }}>
            Add your salary for {monthShort(month)}, choose how much slips into savings, and
            I&apos;ll work out exactly what you can spend each day.
          </p>
          <Link href="/plan" className="btn btn-primary" style={{ width: "auto", padding: "14px 28px" }}>
            Set up {monthShort(month)}
          </Link>
        </div>
      ) : (
        <>
          {/* ---------- hero ---------- */}
          <section className="hero" style={{ display: "grid", placeItems: "center", gap: 4 }}>
            <Ring pct={stats.pctUsed} size={196} stroke={14}>
              <div style={{ padding: "0 12px" }}>
                <p className="label" style={{ marginBottom: 4 }}>
                  {isCurrent ? "Safe to spend today" : "Left over"}
                </p>
                <p
                  className="amount"
                  style={{ margin: 0, color: "var(--olive-900)", fontSize: fit(heroFigure), lineHeight: 1 }}
                >
                  {heroFigure}
                </p>
                <p className="faint" style={{ fontSize: 12, margin: "6px 0 0" }}>
                  {money(Math.round(stats.left), cur, true)} left · {stats.daysLeft} day{stats.daysLeft === 1 ? "" : "s"}
                </p>
              </div>
            </Ring>

            <div style={{ marginTop: 14 }}>
              {stats.left < 0 ? (
                <span className="pill pill-alert">Over budget by {money(Math.round(-stats.left), cur)}</span>
              ) : paceOver ? (
                <span className="pill pill-warn">
                  {money(Math.round(stats.pace), cur)} ahead of pace — ease off gently
                </span>
              ) : (
                <span className="pill pill-ok">
                  {money(Math.round(-stats.pace), cur)} under pace — you&apos;re doing beautifully
                </span>
              )}
            </div>
          </section>

          {/* ---------- accounts ---------- */}
          <h2 className="section">Where your money sits</h2>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <span className="label">In your current account</span>
                <p
                  className="amount amount-lg"
                  style={{ margin: "6px 0 0", color: acc.currentLeft < 0 ? "var(--alert)" : "var(--olive-900)" }}
                >
                  {money(acc.currentLeft, cur)}
                </p>
              </div>
              <span className="dot" style={{ background: "rgba(141,154,91,0.14)" }}>🏦</span>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", height: 9, borderRadius: 999, overflow: "hidden", gap: 2, background: "rgba(75,82,48,0.09)" }}>
                <div style={{ flex: Math.max(stats.spent, 0.001), background: "linear-gradient(90deg,#c9a3bb,#e3c4d7)" }} />
                <div style={{ flex: Math.max(acc.currentLeft, 0.001), background: "linear-gradient(90deg,#8d9a5b,#b3bd8e)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span className="faint" style={{ fontSize: 11.5 }}>
                  {money(stats.spent, cur)} spent
                </span>
                <span className="faint" style={{ fontSize: 11.5 }}>
                  {money(stats.spendable, cur)} spendable
                </span>
              </div>
            </div>

            <p className="sub" style={{ marginBottom: 0 }}>
              {acc.currentLeft < 0
                ? <>You&apos;re {money(-acc.currentLeft, cur)} past this month&apos;s limit — anything more comes out of savings.</>
                : <>That&apos;s {money(Math.round(stats.safeToday), cur)} a day for the {stats.daysLeft} day{stats.daysLeft === 1 ? "" : "s"} left.</>}
            </p>

            <hr className="divider" />

            <div className="row">
              <span className="dot" style={{ background: "rgba(107,116,66,0.14)" }}>🪷</span>
              <div className="row-main">
                <div className="row-title">In savings</div>
                <div className="row-sub">
                  {money(acc.savingsThisMonth, cur)} moved across this month
                  {acc.inGoals > 0 ? ` · ${money(acc.inGoals, cur)} earmarked for goals` : ""}
                </div>
              </div>
              <span className="amount amount-md" style={{ color: "var(--olive-700)" }}>
                {money(acc.savingsPot, cur)}
              </span>
            </div>

            <div className="row">
              <span className="dot" style={{ background: "rgba(201,184,163,0.22)" }}>📄</span>
              <div className="row-main">
                <div className="row-title">Bills & fixed costs</div>
                <div className="row-sub">taken off the top, before you spend a thing</div>
              </div>
              <span className="amount amount-md">{money(acc.fixed, cur)}</span>
            </div>

            <div className="row">
              <span className="dot" style={{ background: "rgba(201,163,187,0.2)" }}>💳</span>
              <div className="row-main">
                <div className="row-title">Spent this month</div>
                <div className="row-sub">
                  {stats.income > 0 ? `${Math.round((stats.spent / stats.income) * 100)}% of everything you were paid` : ""}
                </div>
              </div>
              <span className="amount amount-md">{money(stats.spent, cur)}</span>
            </div>
          </div>

          {/* ---------- quick stats ---------- */}
          <div className="grid-2" style={{ marginTop: 14 }}>
            <div className="stat">
              <span className="label">Daily allowance</span>
              <p className="amount amount-md" style={{ margin: 0 }}>{money(Math.round(stats.dailyAllowance), cur)}</p>
              <p className="faint" style={{ fontSize: 11.5, margin: "4px 0 0" }}>
                planned, across {stats.daysTotal} days
              </p>
            </div>
            <div className="stat">
              <span className="label">Wants so far</span>
              <p className="amount amount-md" style={{ margin: 0, color: "var(--blush-700)" }}>
                {money(stats.wantTotal, cur)}
              </p>
              <p className="faint" style={{ fontSize: 11.5, margin: "4px 0 0" }}>
                {money(stats.needTotal, cur)} went on needs
              </p>
            </div>
            <div className="stat">
              <span className="label">Landing at</span>
              <p className="amount amount-md" style={{ margin: 0, color: stats.projected > stats.spendable ? "var(--alert)" : "var(--ink)" }}>
                {money(Math.round(stats.projected), cur)}
              </p>
              <p className="faint" style={{ fontSize: 11.5, margin: "4px 0 0" }}>at this rhythm</p>
            </div>
            <div className="stat">
              <span className="label">No-spend days</span>
              <p className="amount amount-md" style={{ margin: 0 }}>{stats.noSpendDays}</p>
              <p className="faint" style={{ fontSize: 11.5, margin: "4px 0 0" }}>
                {stats.streak > 0 ? `${stats.streak}-day streak ✧` : "start one today"}
              </p>
            </div>
          </div>

          {/* ---------- daily rhythm ---------- */}
          <h2 className="section">Daily rhythm</h2>
          <div className="card">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 78 }}>
              {stats.byDay.map((v, i) => {
                const future = isCurrent && i + 1 > stats.dayOfMonth;
                const over = v > stats.dailyAllowance && stats.dailyAllowance > 0;
                return (
                  <div
                    key={i}
                    title={`Day ${i + 1}: ${money(v, cur)}`}
                    style={{
                      flex: 1,
                      height: `${Math.max(v > 0 ? 6 : 2, (v / maxDay) * 100)}%`,
                      borderRadius: 999,
                      opacity: future ? 0.25 : 1,
                      background: v === 0
                        ? "rgba(75,82,48,0.10)"
                        : over
                        ? "linear-gradient(180deg, #c9a3bb, #bf7a72)"
                        : "linear-gradient(180deg, #b3bd8e, #8d9a5b)",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <span className="faint" style={{ fontSize: 11 }}>1 {monthShort(month)}</span>
              <span className="faint" style={{ fontSize: 11 }}>
                daily allowance {money(Math.round(stats.dailyAllowance), cur)}
              </span>
              <span className="faint" style={{ fontSize: 11 }}>{stats.daysTotal}</span>
            </div>
          </div>

          {/* ---------- where it went ---------- */}
          <h2 className="section">Where it went</h2>
          <div className="card">
            {stats.byCategory.length === 0 ? (
              <Empty emoji="🕊️" title="Nothing logged yet" line="A blank month is a beautiful place to start." />
            ) : (
              stats.byCategory.slice(0, 6).map((c) => {
                const k = cat(c.id);
                return (
                  <div key={c.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                      <span>{k.emoji} {k.label}</span>
                      <span className="num muted">{money(c.total, cur)} <span className="faint" style={{ fontSize: 11.5 }}>{Math.round(c.pct)}%</span></span>
                    </div>
                    <Bar pct={c.pct} color={`linear-gradient(90deg, ${k.tint}, ${k.tint}88)`} />
                  </div>
                );
              })
            )}
            {stats.byCategory.length > 0 && (
              <Link href="/glow" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}>
                See the full picture →
              </Link>
            )}
          </div>

          {/* ---------- recent ---------- */}
          <h2 className="section">Lately</h2>
          <div className="card">
            {recent.length === 0 ? (
              <Empty emoji="✨" title="No entries yet" line="Tap the centre button to add your first." />
            ) : (
              <>
                {recent.map((e) => {
                  const k = cat(e.category);
                  return (
                    <div className="row" key={e.id}>
                      <span className="dot" style={{ background: `${k.tint}22` }}>{k.emoji}</span>
                      <div className="row-main">
                        <div className="row-title">{e.merchant || k.label}</div>
                        <div className="row-sub">{prettyDate(e.date)} · {k.label}{e.kind === "want" ? " · want" : ""}</div>
                      </div>
                      <span className="amount amount-md" style={{ fontSize: 18 }}>{money(e.amount, cur)}</span>
                    </div>
                  );
                })}
                <Link href="/log" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
                  All entries →
                </Link>
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: 14, textAlign: "center" }}>
            <p className="quote" style={{ margin: 0 }}>&ldquo;{mantra}&rdquo;</p>
          </div>
        </>
      )}
    </div>
  );
}
