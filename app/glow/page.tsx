"use client";

import { useMemo, useState } from "react";
import { useLedger, computeStats, expensesFor, sum, lastMonths } from "@/lib/store";
import { CATEGORIES, cat } from "@/lib/categories";
import { money, monthShort, monthLabel, shiftMonth, monthKey } from "@/lib/format";
import { Ring, Sheet, Bar, Field, Empty } from "@/components/UI";

type Tab = "insights" | "goals" | "pause";

export default function GlowPage() {
  const { ready } = useLedger();
  const [tab, setTab] = useState<Tab>("insights");

  if (!ready) return <div style={{ height: "60vh" }} />;

  return (
    <div className="fade-up">
      <header className="page-head">
        <p className="eyebrow">The glow-up</p>
        <h1 className="display">Patterns,<br />goals, restraint.</h1>
      </header>

      <div className="segment">
        <button data-on={tab === "insights"} onClick={() => setTab("insights")}>Insights</button>
        <button data-on={tab === "goals"} onClick={() => setTab("goals")}>Goals</button>
        <button data-on={tab === "pause"} onClick={() => setTab("pause")}>Pause list</button>
      </div>

      <div style={{ marginTop: 18 }}>
        {tab === "insights" && <Insights />}
        {tab === "goals" && <Goals />}
        {tab === "pause" && <Pause />}
      </div>
    </div>
  );
}

/* ==================== INSIGHTS ==================== */
function Insights() {
  const { data, month } = useLedger();
  const cur = data.settings.currency;
  const stats = useMemo(() => computeStats(data, month), [data, month]);
  const prev = shiftMonth(month, -1);
  const prevStats = useMemo(() => computeStats(data, prev), [data, prev]);

  const trail = useMemo(() => {
    return lastMonths(month, 6).map((m) => ({
      m,
      total: sum(expensesFor(data, m).filter((e) => e.method !== "savings")),
      saved: (data.plans[m]?.income ?? 0) * ((data.plans[m]?.savingsPct ?? 0) / 100),
    }));
  }, [data, month]);
  const trailMax = Math.max(...trail.map((t) => t.total), 1);

  const weekday = useMemo(() => {
    const w = Array(7).fill(0);
    for (const e of expensesFor(data, month)) {
      if (e.method === "savings") continue;
      w[new Date(e.date + "T00:00:00").getDay()] += e.amount;
    }
    return w;
  }, [data, month]);
  const wMax = Math.max(...weekday, 1);
  const worstDay = weekday.indexOf(wMax);
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const biggest = useMemo(
    () => [...expensesFor(data, month)].filter((e) => e.method !== "savings").sort((a, b) => b.amount - a.amount)[0],
    [data, month]
  );

  const lifetimeSaved = useMemo(
    () =>
      Object.entries(data.plans).reduce(
        (a, [, p]) => a + (p.income ?? 0) * ((p.savingsPct ?? 0) / 100),
        0
      ),
    [data.plans]
  );

  const delta = stats.spent - prevStats.spent;
  const topCat = stats.byCategory[0];
  const trimTarget = topCat ? topCat.total * 0.2 * 12 : 0;

  if (stats.spent === 0 && stats.income === 0) {
    return (
      <div className="card">
        <Empty emoji="🔮" title="Nothing to read yet" line="Log a week of spending and the patterns start showing up here." />
      </div>
    );
  }

  return (
    <>
      {/* headline */}
      <div className="hero">
        <p className="label">{monthLabel(month)}</p>
        <p className="amount amount-xl" style={{ margin: "6px 0 0" }}>{money(stats.spent, cur)}</p>
        {prevStats.spent > 0 && (
          <p style={{ fontSize: 13.5, margin: "10px 0 0", color: delta > 0 ? "var(--alert)" : "var(--ok)" }}>
            {delta > 0 ? "▲" : "▼"} {money(Math.abs(delta), cur)} vs {monthShort(prev)}
            <span className="faint"> ({prevStats.spent > 0 ? Math.abs(Math.round((delta / prevStats.spent) * 100)) : 0}%)</span>
          </p>
        )}
      </div>

      {/* needs vs wants */}
      <h2 className="section">Needs vs wants</h2>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Ring pct={stats.spent > 0 ? (stats.needTotal / stats.spent) * 100 : 0} size={112} stroke={11} tone="calm">
          <div>
            <p className="amount" style={{ fontSize: 24, margin: 0 }}>
              {stats.spent > 0 ? Math.round((stats.needTotal / stats.spent) * 100) : 0}%
            </p>
            <p className="label" style={{ fontSize: 9 }}>needs</p>
          </div>
        </Ring>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
              <span>🌿 Needs</span><span className="num">{money(stats.needTotal, cur)}</span>
            </div>
            <Bar pct={stats.spent ? (stats.needTotal / stats.spent) * 100 : 0} color="linear-gradient(90deg,#8d9a5b,#b3bd8e)" />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
              <span>🎀 Wants</span><span className="num">{money(stats.wantTotal, cur)}</span>
            </div>
            <Bar pct={stats.spent ? (stats.wantTotal / stats.spent) * 100 : 0} color="linear-gradient(90deg,#c9a3bb,#e3c4d7)" />
          </div>
        </div>
      </div>

      {/* six month trail */}
      <h2 className="section">The last six months</h2>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>
          {trail.map((t) => (
            <div key={t.m} style={{ flex: 1, display: "grid", gap: 6, justifyItems: "center" }}>
              <span className="faint num" style={{ fontSize: 10 }}>
                {t.total > 0 ? money(t.total, cur, true) : ""}
              </span>
              <div
                style={{
                  width: "100%",
                  height: Math.max(4, (t.total / trailMax) * 74),
                  borderRadius: 8,
                  background: t.m === month
                    ? "linear-gradient(180deg,#c9a3bb,#8d9a5b)"
                    : "linear-gradient(180deg,#dfe4cd,#c9b8a3)",
                }}
              />
              <span className="faint" style={{ fontSize: 10 }}>{monthShort(t.m)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* weekday */}
      <h2 className="section">Your week</h2>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 84 }}>
          {weekday.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "grid", gap: 6, justifyItems: "center" }}>
              <div
                style={{
                  width: "100%",
                  height: Math.max(4, (v / wMax) * 58),
                  borderRadius: 8,
                  background: i === worstDay
                    ? "linear-gradient(180deg,#c9a3bb,#a86f92)"
                    : "linear-gradient(180deg,#dfe4cd,#b3bd8e)",
                }}
              />
              <span className="faint" style={{ fontSize: 10 }}>{DAYS[i][0]}</span>
            </div>
          ))}
        </div>
        {wMax > 1 && (
          <p className="sub" style={{ marginBottom: 0 }}>
            <strong style={{ fontWeight: 500 }}>{DAYS[worstDay]}</strong> is your most expensive day —
            {" "}{money(weekday[worstDay], cur)} so far this month.
          </p>
        )}
      </div>

      {/* places */}
      {stats.topMerchants.length > 0 && (
        <>
          <h2 className="section">Where you keep going back</h2>
          <div className="card card-tight">
            {stats.topMerchants.map((m) => (
              <div className="row" key={m.name}>
                <div className="row-main">
                  <div className="row-title">{m.name}</div>
                  <div className="row-sub">{m.count} visit{m.count === 1 ? "" : "s"} · avg {money(Math.round(m.total / m.count), cur)}</div>
                </div>
                <span className="amount" style={{ fontSize: 18 }}>{money(m.total, cur)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* nudges */}
      <h2 className="section">Gentle notes</h2>
      <div className="card">
        {topCat && (
          <Note
            emoji={cat(topCat.id).emoji}
            title={`${cat(topCat.id).label} is your biggest line`}
            body={`${money(topCat.total, cur)} this month — ${Math.round(topCat.pct)}% of everything. Trimming it by a fifth would put about ${money(Math.round(trimTarget), cur)} back in your pocket over a year.`}
          />
        )}
        {biggest && (
          <Note
            emoji="💎"
            title="Biggest single purchase"
            body={`${money(biggest.amount, cur)} — ${biggest.merchant || cat(biggest.category).label}. Worth it?`}
          />
        )}
        {stats.streak > 0 && (
          <Note emoji="🕊️" title={`${stats.streak} no-spend days in a row`} body="Genuinely the easiest money you'll ever save. Keep it quiet and keep it going." />
        )}
        {stats.projected > stats.spendable && stats.spendable > 0 && (
          <Note
            emoji="🫧"
            title="This pace runs over"
            body={`At today's rhythm you'd land around ${money(Math.round(stats.projected), cur)} — that's ${money(Math.round(stats.projected - stats.spendable), cur)} past your limit. Dropping to ${money(Math.round(stats.safeToday), cur)} a day fixes it.`}
          />
        )}
        {lifetimeSaved > 0 && (
          <Note
            emoji="🪷"
            title="Set aside since you started"
            body={`${money(Math.round(lifetimeSaved), cur)} across every month you've planned. That is a real number and it is yours.`}
          />
        )}
      </div>
    </>
  );
}

function Note({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <span className="dot">{emoji}</span>
      <div>
        <div style={{ fontSize: 14.5, marginBottom: 3 }}>{title}</div>
        <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.55 }}>{body}</div>
      </div>
    </div>
  );
}

/* ==================== GOALS ==================== */
function Goals() {
  const { data, addGoal, fundGoal, removeGoal } = useLedger();
  const cur = data.settings.currency;
  const [sheet, setSheet] = useState(false);
  const [fund, setFund] = useState<string | null>(null);
  const [fundAmt, setFundAmt] = useState("");
  const [fundDir, setFundDir] = useState<1 | -1>(1);

  const totalSaved = data.goals.reduce((a, g) => a + g.saved, 0);

  return (
    <>
      <div className="hero">
        <p className="label">Tucked away in goals</p>
        <p className="amount amount-xl" style={{ margin: "6px 0 0", color: "var(--olive-900)" }}>
          {money(totalSaved, cur)}
        </p>
        <p className="sub" style={{ marginBottom: 0 }}>
          {data.goals.length === 0
            ? "Name what you're saving for — it makes saying no much easier."
            : `Across ${data.goals.length} goal${data.goals.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      <div style={{ marginTop: 14 }}>
        {data.goals.length === 0 ? (
          <div className="card">
            <Empty emoji="🎯" title="No goals yet" line="A trip, an emergency fund, that one coat." />
          </div>
        ) : (
          data.goals.map((g) => {
            const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
            const done = pct >= 100;
            const monthsLeft = g.deadline
              ? Math.max(0, Math.round((new Date(g.deadline).getTime() - Date.now()) / 2.63e9))
              : null;
            const perMonth = monthsLeft && monthsLeft > 0 ? (g.target - g.saved) / monthsLeft : null;
            return (
              <div className="card" key={g.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Ring pct={pct} size={72} stroke={8} tone="calm">
                    <span style={{ fontSize: 22 }}>{g.emoji}</span>
                  </Ring>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{g.name}</span>
                      <button className="chip btn-sm" onClick={() => removeGoal(g.id)}>✕</button>
                    </div>
                    <p className="amount" style={{ fontSize: 21, margin: "4px 0 6px" }}>
                      {money(g.saved, cur)}
                      <span className="faint" style={{ fontSize: 12.5, fontFamily: "var(--sans)" }}> / {money(g.target, cur)}</span>
                    </p>
                    <Bar pct={pct} color={done ? "linear-gradient(90deg,#8d9a5b,#b3bd8e)" : "linear-gradient(90deg,#c9a3bb,#b3bd8e)"} />
                  </div>
                </div>

                <p className="faint" style={{ fontSize: 12, margin: "12px 0 0" }}>
                  {done
                    ? "Complete — go and enjoy it. 🤍"
                    : perMonth
                    ? `${money(Math.round(perMonth), cur)} a month to get there by ${new Date(g.deadline!).toLocaleDateString(undefined, { month: "short", year: "numeric" })}.`
                    : `${money(g.target - g.saved, cur)} to go.`}
                </p>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => { setFund(g.id); setFundAmt(""); setFundDir(1); }}
                  >
                    + Add money
                  </button>
                  {g.saved > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setFund(g.id); setFundAmt(""); setFundDir(-1); }}
                    >
                      − Take out
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setSheet(true)}>
        New goal
      </button>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="What are you saving for?">
        <GoalForm
          cur={cur}
          onAdd={(g) => {
            addGoal(g);
            setSheet(false);
          }}
        />
      </Sheet>

      <Sheet open={!!fund} onClose={() => setFund(null)} title={fundDir === 1 ? "Add to this goal" : "Take from this goal"}>
        <Field label={`Amount (${cur})`}>
          <input
            className="input"
            inputMode="decimal"
            autoFocus
            value={fundAmt}
            onChange={(e) => setFundAmt(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </Field>
        <button
          className="btn btn-primary"
          disabled={!Number(fundAmt)}
          onClick={() => {
            if (fund) fundGoal(fund, fundDir * (Number(fundAmt) || 0));
            setFund(null);
          }}
        >
          {fundDir === 1 ? "Add" : "Take out"}
        </button>
      </Sheet>
    </>
  );
}

const GOAL_EMOJI = ["🤍", "✈️", "🏡", "💍", "🪞", "🧘‍♀️", "🎓", "🚗", "🌊", "🎁", "💐", "🕯️"];

function GoalForm({
  cur,
  onAdd,
}: {
  cur: string;
  onAdd: (g: { name: string; emoji: string; target: number; deadline?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji] = useState("🤍");
  const [deadline, setDeadline] = useState("");

  return (
    <div>
      <Field label="Name it">
        <input className="input" autoFocus placeholder="Emergency fund · Amalfi · new sofa" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`Target (${cur})`}>
        <input className="input" inputMode="decimal" placeholder="0" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <Field label="By when (optional)">
        <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>
      <Field label="Pick a charm">
        <div className="chips">
          {GOAL_EMOJI.map((e) => (
            <button key={e} className="chip" data-on={emoji === e} onClick={() => setEmoji(e)} style={{ fontSize: 17 }}>
              {e}
            </button>
          ))}
        </div>
      </Field>
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !Number(target)}
        onClick={() => onAdd({ name: name.trim(), emoji, target: Number(target) || 0, deadline: deadline || undefined })}
      >
        Create goal
      </button>
    </div>
  );
}

/* ==================== PAUSE LIST ==================== */
function Pause() {
  const { data, addWish, resolveWish, removeWish } = useLedger();
  const cur = data.settings.currency;
  const [sheet, setSheet] = useState(false);

  const open = data.wishlist.filter((w) => !w.resolved);
  const passed = data.wishlist.filter((w) => w.resolved === "passed");
  const savedByPassing = passed.reduce((a, w) => a + w.amount, 0);

  return (
    <>
      <div className="hero">
        <p className="label">Saved by walking away</p>
        <p className="amount amount-xl" style={{ margin: "6px 0 0", color: "var(--olive-900)" }}>
          {money(savedByPassing, cur)}
        </p>
        <p className="sub" style={{ marginBottom: 0 }}>
          The thirty-day rule: write it down, wait a month. If you still want it, buy it properly — most things quietly lose their grip.
        </p>
      </div>

      <div style={{ marginTop: 14 }}>
        {open.length === 0 ? (
          <div className="card">
            <Empty emoji="🫧" title="Nothing on pause" line="Next time you nearly checkout — put it here instead." />
          </div>
        ) : (
          open.map((w) => {
            const days = Math.floor((Date.now() - w.addedAt) / 86400000);
            const ready = days >= 30;
            return (
              <div className="card" key={w.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16 }}>{w.name}</div>
                    <p className="amount amount-md" style={{ margin: "4px 0 0" }}>{money(w.amount, cur)}</p>
                  </div>
                  <button className="chip btn-sm" onClick={() => removeWish(w.id)}>✕</button>
                </div>

                <div style={{ marginTop: 14 }}>
                  <Bar pct={(Math.min(days, 30) / 30) * 100} color="linear-gradient(90deg,#c9a3bb,#b3bd8e)" />
                  <p className="faint" style={{ fontSize: 12, margin: "8px 0 0" }}>
                    {ready ? "Thirty days are up — do you still want it?" : `Day ${days} of 30 · ${30 - days} to go`}
                  </p>
                </div>

                {ready && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => resolveWish(w.id, "passed")}>
                      Let it go
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => resolveWish(w.id, "bought")}>
                      Still want it
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {passed.length > 0 && (
        <>
          <h2 className="section">Let go of</h2>
          <div className="card card-tight">
            {passed.map((w) => (
              <div className="row" key={w.id}>
                <span className="dot">🕊️</span>
                <div className="row-main">
                  <div className="row-title" style={{ textDecoration: "line-through", opacity: 0.6 }}>{w.name}</div>
                  <div className="row-sub">kept {money(w.amount, cur)}</div>
                </div>
                <button className="chip btn-sm" onClick={() => removeWish(w.id)}>✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setSheet(true)}>
        Pause something
      </button>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Put it on pause">
        <WishForm
          cur={cur}
          onAdd={(w) => {
            addWish(w);
            setSheet(false);
          }}
        />
      </Sheet>
    </>
  );
}

function WishForm({ cur, onAdd }: { cur: string; onAdd: (w: { name: string; amount: number; url?: string }) => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div>
      <Field label="What is it">
        <input className="input" autoFocus placeholder="The cashmere one…" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`Price (${cur})`}>
        <input className="input" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <Field label="Link (optional)">
        <input className="input" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !Number(amount)}
        onClick={() => onAdd({ name: name.trim(), amount: Number(amount) || 0, url: url || undefined })}
      >
        Start the 30 days
      </button>
    </div>
  );
}
