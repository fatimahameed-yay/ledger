"use client";

import { useMemo } from "react";
import { useLedger, monthSummary, txnsFor, lastMonths, sum } from "@/lib/store";
import { catOf } from "@/lib/categories";
import { money, monthShort, shiftMonth } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { MonthSwitch, Bar, Ring, Empty } from "@/components/UI";

export default function SpendingPage() {
  const { ready, data, month, setMonth } = useLedger();
  const cur = data.settings.currency;
  const sm = useMemo(() => monthSummary(data, month), [data, month]);
  const prev = shiftMonth(month, -1);
  const prevSm = useMemo(() => monthSummary(data, prev), [data, prev]);

  const trail = useMemo(
    () =>
      lastMonths(month, 6).map((m) => ({
        m,
        total: sum(txnsFor(data, m).filter((t) => t.type === "spend")),
      })),
    [data, month]
  );
  const trailMax = Math.max(...trail.map((t) => t.total), 1);

  const weekday = useMemo(() => {
    const w = Array(7).fill(0);
    for (const t of txnsFor(data, month)) {
      if (t.type !== "spend") continue;
      w[new Date(t.date + "T00:00:00").getDay()] += t.amount;
    }
    return w;
  }, [data, month]);
  const wMax = Math.max(...weekday, 1);
  const worstDay = weekday.indexOf(wMax);
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
  const FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (!ready) return <div style={{ height: "60vh" }} />;

  const delta = sm.spent - prevSm.spent;
  const maxDay = Math.max(...sm.byDay, 1);

  return (
    <div className="fade-up">
      <header className="page-head">
        <h1 className="display">Spending</h1>
        <div style={{ marginTop: 16 }}>
          <MonthSwitch month={month} setMonth={setMonth} />
        </div>
      </header>

      <section className="hero" style={{ textAlign: "center" }}>
        <span className="label">Spent</span>
        <p className="amount amount-xl" style={{ margin: "6px 0 0" }}>{money(sm.spent, cur)}</p>
        {prevSm.spent > 0 && (
          <p
            style={{
              fontSize: 13, margin: "10px 0 0",
              color: delta > 0 ? "var(--alert)" : "var(--ok)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Icon name={delta > 0 ? "up" : "down"} size={13} />
            {money(Math.abs(delta), cur)} vs {monthShort(prev)}
          </p>
        )}
      </section>

      {sm.spent === 0 ? (
        <div className="card" style={{ marginTop: 14 }}>
          <Empty icon="chart" title="Nothing spent this month" />
        </div>
      ) : (
        <>
          <h2 className="section">Categories</h2>
          <div className="card">
            {sm.byCategory.map((c) => {
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
          </div>

          <h2 className="section">Needs & wants</h2>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Ring pct={(sm.needTotal / sm.spent) * 100} size={104} stroke={10} tone="calm">
              <div>
                <p className="amount" style={{ fontSize: 22, margin: 0 }}>{Math.round((sm.needTotal / sm.spent) * 100)}%</p>
                <p className="label" style={{ fontSize: 9 }}>needs</p>
              </div>
            </Ring>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
                  <span>Needs</span><span className="num">{money(sm.needTotal, cur)}</span>
                </div>
                <Bar pct={(sm.needTotal / sm.spent) * 100} color="linear-gradient(90deg,#8d9a5b,#b3bd8e)" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
                  <span>Wants</span><span className="num">{money(sm.wantTotal, cur)}</span>
                </div>
                <Bar pct={(sm.wantTotal / sm.spent) * 100} color="linear-gradient(90deg,#c9a3bb,#e3c4d7)" />
              </div>
            </div>
          </div>

          <h2 className="section">Day by day</h2>
          <div className="card">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 72 }}>
              {sm.byDay.map((v, i) => (
                <div
                  key={i}
                  title={`${i + 1}: ${money(v, cur)}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(v > 0 ? 6 : 2, (v / maxDay) * 100)}%`,
                    borderRadius: 999,
                    background: v === 0 ? "rgba(75,82,48,0.10)" : "linear-gradient(180deg,#b3bd8e,#8d9a5b)",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <span className="faint" style={{ fontSize: 11 }}>1</span>
              <span className="faint" style={{ fontSize: 11 }}>{sm.noSpendDays} no-spend days</span>
              <span className="faint" style={{ fontSize: 11 }}>{sm.daysTotal}</span>
            </div>
          </div>

          <h2 className="section">By weekday</h2>
          <div className="card">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
              {weekday.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "grid", gap: 6, justifyItems: "center" }}>
                  <div
                    style={{
                      width: "100%",
                      height: Math.max(4, (v / wMax) * 54),
                      borderRadius: 8,
                      background: i === worstDay ? "linear-gradient(180deg,#c9a3bb,#a86f92)" : "linear-gradient(180deg,#dfe4cd,#b3bd8e)",
                    }}
                  />
                  <span className="faint" style={{ fontSize: 10 }}>{DAYS[i]}</span>
                </div>
              ))}
            </div>
            {wMax > 1 && (
              <p className="faint" style={{ fontSize: 12, margin: "12px 0 0" }}>{FULL[worstDay]} costs you most.</p>
            )}
          </div>

          {sm.topMerchants.length > 0 && (
            <>
              <h2 className="section">Places</h2>
              <div className="card card-tight">
                {sm.topMerchants.map((m) => (
                  <div className="row" key={m.name}>
                    <div className="row-main">
                      <div className="row-title">{m.name}</div>
                      <div className="row-sub">{m.count}×</div>
                    </div>
                    <span className="amount" style={{ fontSize: 18 }}>{money(m.total, cur)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <h2 className="section">Six months</h2>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 106 }}>
          {trail.map((t) => (
            <div key={t.m} style={{ flex: 1, display: "grid", gap: 6, justifyItems: "center" }}>
              <span className="faint num" style={{ fontSize: 10 }}>{t.total > 0 ? money(t.total, cur, true) : ""}</span>
              <div
                style={{
                  width: "100%",
                  height: Math.max(4, (t.total / trailMax) * 70),
                  borderRadius: 8,
                  background: t.m === month ? "linear-gradient(180deg,#c9a3bb,#8d9a5b)" : "linear-gradient(180deg,#dfe4cd,#c9b8a3)",
                }}
              />
              <span className="faint" style={{ fontSize: 10 }}>{monthShort(t.m)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
