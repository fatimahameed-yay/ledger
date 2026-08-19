"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLedger, computeStats, computeAccounts, expensesFor } from "@/lib/store";
import { money, monthKey, prettyDate, monthShort } from "@/lib/format";
import { catOf } from "@/lib/categories";
import { Icon } from "@/lib/icons";
import { Ring, MonthSwitch, Bar, Dot, Empty } from "@/components/UI";

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
    () =>
      [...expensesFor(data, month)]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
        .slice(0, 5),
    [data, month]
  );

  if (!ready) return <div style={{ height: "60vh" }} />;

  const name = data.settings.name.trim();
  const setUp = stats.spendable > 0;
  const heroFigure = money(Math.round(isCurrent ? stats.safeToday : stats.left), cur);
  const maxDay = Math.max(...stats.byDay, 1);

  return (
    <div className="fade-up">
      <header className="page-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            {name && <p className="eyebrow">{name}</p>}
            <h1 className="display">This month</h1>
          </div>
          <Link href="/settings" aria-label="Settings" className="icon-btn" style={{ marginTop: 6 }}>
            <Icon name="gear" size={16} />
          </Link>
        </div>
        <div style={{ marginTop: 16 }}>
          <MonthSwitch month={month} setMonth={setMonth} />
        </div>
      </header>

      {!setUp ? (
        <div className="hero" style={{ textAlign: "center" }}>
          <p className="amount amount-lg" style={{ margin: "4px 0 8px" }}>Set your budget</p>
          <p className="sub" style={{ marginBottom: 20 }}>Income, savings, limits — all yours to choose.</p>
          <Link href="/plan" className="btn btn-primary" style={{ width: "auto", padding: "14px 26px" }}>
            Open {monthShort(month)}
          </Link>
        </div>
      ) : (
        <>
          <section className="hero" style={{ display: "grid", placeItems: "center" }}>
            <Ring pct={stats.pctUsed} size={196} stroke={14}>
              <div style={{ padding: "0 12px" }}>
                <p className="label" style={{ marginBottom: 4 }}>{isCurrent ? "Safe today" : "Left"}</p>
                <p className="amount" style={{ margin: 0, color: "var(--olive-900)", fontSize: fit(heroFigure), lineHeight: 1 }}>
                  {heroFigure}
                </p>
                <p className="faint" style={{ fontSize: 12, margin: "6px 0 0" }}>
                  {stats.daysLeft} day{stats.daysLeft === 1 ? "" : "s"} left
                </p>
              </div>
            </Ring>

            <div style={{ marginTop: 12 }}>
              {stats.left < 0 ? (
                <span className="pill pill-alert">
                  <Icon name="up" size={12} /> {money(Math.round(-stats.left), cur)} over
                </span>
              ) : stats.pace > 0 ? (
                <span className="pill pill-warn">
                  <Icon name="up" size={12} /> {money(Math.round(stats.pace), cur)} ahead of pace
                </span>
              ) : (
                <span className="pill pill-ok">
                  <Icon name="down" size={12} /> {money(Math.round(-stats.pace), cur)} under pace
                </span>
              )}
            </div>
          </section>

          {/* ---- accounts ---- */}
          <h2 className="section">Balances</h2>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <span className="label">Current</span>
                <p
                  className="amount amount-lg"
                  style={{ margin: "6px 0 0", color: acc.currentLeft < 0 ? "var(--alert)" : "var(--olive-900)" }}
                >
                  {money(acc.currentLeft, cur)}
                </p>
              </div>
              <Dot icon="bank" tint="#8d9a5b" />
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", height: 9, borderRadius: 999, overflow: "hidden", gap: 2, background: "rgba(75,82,48,0.09)" }}>
                <div style={{ flex: Math.max(stats.spent, 0.001), background: "linear-gradient(90deg,#c9a3bb,#e3c4d7)" }} />
                <div style={{ flex: Math.max(acc.currentLeft, 0.001), background: "linear-gradient(90deg,#8d9a5b,#b3bd8e)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span className="faint" style={{ fontSize: 11.5 }}>{money(stats.spent, cur)} spent</span>
                <span className="faint" style={{ fontSize: 11.5 }}>{money(stats.spendable, cur)} budget</span>
              </div>
            </div>

            <hr className="divider" />

            <div className="row">
              <Dot icon="lotus" tint="#6b7442" />
              <div className="row-main">
                <div className="row-title">Savings</div>
                <div className="row-sub">+{money(acc.savingsThisMonth, cur)} this month</div>
              </div>
              <span className="amount amount-md" style={{ color: "var(--olive-700)" }}>
                {money(acc.savingsPot, cur)}
              </span>
            </div>

            <div className="row">
              <Dot icon="doc" tint="#8f9caa" />
              <div className="row-main">
                <div className="row-title">Fixed</div>
                <div className="row-sub">bills & recurring</div>
              </div>
              <span className="amount amount-md">{money(acc.fixed, cur)}</span>
            </div>

            <div className="row">
              <Dot icon="card" tint="#c9a3bb" />
              <div className="row-main">
                <div className="row-title">Spent</div>
                <div className="row-sub">
                  {stats.income > 0 ? `${Math.round((stats.spent / stats.income) * 100)}% of income` : "this month"}
                </div>
              </div>
              <span className="amount amount-md">{money(stats.spent, cur)}</span>
            </div>
          </div>

          {/* ---- quick stats ---- */}
          <div className="grid-2" style={{ marginTop: 14 }}>
            <Stat label="Per day" value={money(Math.round(stats.dailyAllowance), cur)} note={`${stats.daysTotal} days`} />
            <Stat
              label="Wants"
              value={money(stats.wantTotal, cur)}
              note={`${money(stats.needTotal, cur)} needs`}
              tone="var(--blush-700)"
            />
            <Stat
              label="Projected"
              value={money(Math.round(stats.projected), cur)}
              note="at this rate"
              tone={stats.projected > stats.spendable ? "var(--alert)" : undefined}
            />
            <Stat
              label="No-spend"
              value={String(stats.noSpendDays)}
              note={stats.streak > 0 ? `${stats.streak}-day streak` : "days"}
            />
          </div>

          {/* ---- daily rhythm ---- */}
          <h2 className="section">Daily</h2>
          <div className="card">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 74 }}>
              {stats.byDay.map((v, i) => {
                const future = isCurrent && i + 1 > stats.dayOfMonth;
                const over = v > stats.dailyAllowance && stats.dailyAllowance > 0;
                return (
                  <div
                    key={i}
                    title={`${i + 1}: ${money(v, cur)}`}
                    style={{
                      flex: 1,
                      height: `${Math.max(v > 0 ? 6 : 2, (v / maxDay) * 100)}%`,
                      borderRadius: 999,
                      opacity: future ? 0.25 : 1,
                      background:
                        v === 0
                          ? "rgba(75,82,48,0.10)"
                          : over
                          ? "linear-gradient(180deg,#c9a3bb,#bf7a72)"
                          : "linear-gradient(180deg,#b3bd8e,#8d9a5b)",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <span className="faint" style={{ fontSize: 11 }}>1</span>
              <span className="faint" style={{ fontSize: 11 }}>
                limit {money(Math.round(stats.dailyAllowance), cur)}
              </span>
              <span className="faint" style={{ fontSize: 11 }}>{stats.daysTotal}</span>
            </div>
          </div>

          {/* ---- categories ---- */}
          <h2 className="section">Categories</h2>
          <div className="card">
            {stats.byCategory.length === 0 ? (
              <Empty icon="chart" title="Nothing logged yet" />
            ) : (
              stats.byCategory.slice(0, 6).map((c) => {
                const k = catOf(data.categories, c.id);
                return (
                  <div key={c.id} style={{ marginBottom: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14, alignItems: "center", gap: 8 }}>
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
              })
            )}
          </div>

          {/* ---- recent ---- */}
          <h2 className="section">Recent</h2>
          <div className="card">
            {recent.length === 0 ? (
              <Empty icon="list" title="No entries yet" />
            ) : (
              <>
                {recent.map((e) => {
                  const k = catOf(data.categories, e.category);
                  return (
                    <div className="row" key={e.id}>
                      <Dot icon={k.icon} tint={k.tint} />
                      <div className="row-main">
                        <div className="row-title">{e.merchant || k.label}</div>
                        <div className="row-sub">{prettyDate(e.date)} · {k.label}</div>
                      </div>
                      <span className="amount" style={{ fontSize: 18 }}>{money(e.amount, cur)}</span>
                    </div>
                  );
                })}
                <Link href="/log" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
                  All entries
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <p className="amount amount-md" style={{ margin: 0, color: tone }}>{value}</p>
      {note && <p className="faint" style={{ fontSize: 11.5, margin: "4px 0 0" }}>{note}</p>}
    </div>
  );
}
