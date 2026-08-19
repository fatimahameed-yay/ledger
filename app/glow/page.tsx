"use client";

import { useMemo, useState } from "react";
import { useLedger, computeStats, expensesFor, sum, lastMonths } from "@/lib/store";
import { catOf } from "@/lib/categories";
import { money, monthShort, shiftMonth } from "@/lib/format";
import { Icon, PICKER_ICONS } from "@/lib/icons";
import { Ring, Sheet, Bar, Field, Empty, Dot, IconBtn } from "@/components/UI";

type Tab = "insights" | "goals" | "pause";

export default function GlowPage() {
  const { ready } = useLedger();
  const [tab, setTab] = useState<Tab>("insights");

  if (!ready) return <div style={{ height: "60vh" }} />;

  return (
    <div className="fade-up">
      <header className="page-head">
        <h1 className="display">Insights</h1>
      </header>

      <div className="segment">
        <button data-on={tab === "insights"} onClick={() => setTab("insights")}>Trends</button>
        <button data-on={tab === "goals"} onClick={() => setTab("goals")}>Goals</button>
        <button data-on={tab === "pause"} onClick={() => setTab("pause")}>Pause</button>
      </div>

      <div style={{ marginTop: 18 }}>
        {tab === "insights" && <Insights />}
        {tab === "goals" && <Goals />}
        {tab === "pause" && <Pause />}
      </div>
    </div>
  );
}

/* ==================== TRENDS ==================== */
function Insights() {
  const { data, month } = useLedger();
  const cur = data.settings.currency;
  const stats = useMemo(() => computeStats(data, month), [data, month]);
  const prev = shiftMonth(month, -1);
  const prevStats = useMemo(() => computeStats(data, prev), [data, prev]);

  const trail = useMemo(
    () =>
      lastMonths(month, 6).map((m) => ({
        m,
        total: sum(expensesFor(data, m).filter((e) => e.method !== "savings")),
      })),
    [data, month]
  );
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
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
  const FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const biggest = useMemo(
    () => [...expensesFor(data, month)].filter((e) => e.method !== "savings").sort((a, b) => b.amount - a.amount)[0],
    [data, month]
  );

  const delta = stats.spent - prevStats.spent;
  const topCat = stats.byCategory[0];

  if (stats.spent === 0 && stats.income === 0) {
    return <div className="card"><Empty icon="chart" title="Nothing to read yet" /></div>;
  }

  return (
    <>
      <div className="hero">
        <span className="label">Spent</span>
        <p className="amount amount-xl" style={{ margin: "6px 0 0" }}>{money(stats.spent, cur)}</p>
        {prevStats.spent > 0 && (
          <p style={{ fontSize: 13.5, margin: "10px 0 0", color: delta > 0 ? "var(--alert)" : "var(--ok)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name={delta > 0 ? "up" : "down"} size={14} />
            {money(Math.abs(delta), cur)} vs {monthShort(prev)}
          </p>
        )}
      </div>

      <h2 className="section">Needs & wants</h2>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Ring pct={stats.spent > 0 ? (stats.needTotal / stats.spent) * 100 : 0} size={106} stroke={10} tone="calm">
          <div>
            <p className="amount" style={{ fontSize: 23, margin: 0 }}>
              {stats.spent > 0 ? Math.round((stats.needTotal / stats.spent) * 100) : 0}%
            </p>
            <p className="label" style={{ fontSize: 9 }}>needs</p>
          </div>
        </Ring>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
              <span>Needs</span><span className="num">{money(stats.needTotal, cur)}</span>
            </div>
            <Bar pct={stats.spent ? (stats.needTotal / stats.spent) * 100 : 0} color="linear-gradient(90deg,#8d9a5b,#b3bd8e)" />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
              <span>Wants</span><span className="num">{money(stats.wantTotal, cur)}</span>
            </div>
            <Bar pct={stats.spent ? (stats.wantTotal / stats.spent) * 100 : 0} color="linear-gradient(90deg,#c9a3bb,#e3c4d7)" />
          </div>
        </div>
      </div>

      <h2 className="section">Six months</h2>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 108 }}>
          {trail.map((t) => (
            <div key={t.m} style={{ flex: 1, display: "grid", gap: 6, justifyItems: "center" }}>
              <span className="faint num" style={{ fontSize: 10 }}>{t.total > 0 ? money(t.total, cur, true) : ""}</span>
              <div
                style={{
                  width: "100%",
                  height: Math.max(4, (t.total / trailMax) * 72),
                  borderRadius: 8,
                  background: t.m === month ? "linear-gradient(180deg,#c9a3bb,#8d9a5b)" : "linear-gradient(180deg,#dfe4cd,#c9b8a3)",
                }}
              />
              <span className="faint" style={{ fontSize: 10 }}>{monthShort(t.m)}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="section">By day</h2>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 82 }}>
          {weekday.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "grid", gap: 6, justifyItems: "center" }}>
              <div
                style={{
                  width: "100%",
                  height: Math.max(4, (v / wMax) * 56),
                  borderRadius: 8,
                  background: i === worstDay ? "linear-gradient(180deg,#c9a3bb,#a86f92)" : "linear-gradient(180deg,#dfe4cd,#b3bd8e)",
                }}
              />
              <span className="faint" style={{ fontSize: 10 }}>{DAYS[i]}</span>
            </div>
          ))}
        </div>
        {wMax > 1 && (
          <p className="faint" style={{ fontSize: 12, margin: "12px 0 0" }}>
            {FULL[worstDay]} costs you most.
          </p>
        )}
      </div>

      {stats.topMerchants.length > 0 && (
        <>
          <h2 className="section">Places</h2>
          <div className="card card-tight">
            {stats.topMerchants.map((m) => (
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

      <h2 className="section">Notes</h2>
      <div className="card">
        {topCat && (
          <Note
            icon={catOf(data.categories, topCat.id).icon}
            title={`${catOf(data.categories, topCat.id).label} leads`}
            body={`${money(topCat.total, cur)} · ${Math.round(topCat.pct)}% of spending`}
          />
        )}
        {biggest && (
          <Note
            icon="diamond"
            title="Biggest buy"
            body={`${money(biggest.amount, cur)} · ${biggest.merchant || catOf(data.categories, biggest.category).label}`}
          />
        )}
        {stats.streak > 0 && <Note icon="moon" title={`${stats.streak}-day no-spend streak`} body="Keep it going." />}
        {stats.projected > stats.spendable && stats.spendable > 0 && (
          <Note
            icon="flag"
            title="Running over"
            body={`Heading for ${money(Math.round(stats.projected), cur)}. Cap the day at ${money(Math.round(stats.safeToday), cur)}.`}
          />
        )}
      </div>
    </>
  );
}

function Note({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="row">
      <Dot icon={icon} />
      <div className="row-main">
        <div className="row-title">{title}</div>
        <div className="row-sub">{body}</div>
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
  const [dir, setDir] = useState<1 | -1>(1);

  const totalSaved = data.goals.reduce((a, g) => a + g.saved, 0);

  return (
    <>
      <div className="hero">
        <span className="label">In goals</span>
        <p className="amount amount-xl" style={{ margin: "6px 0 0", color: "var(--olive-900)" }}>
          {money(totalSaved, cur)}
        </p>
      </div>

      <div style={{ marginTop: 14 }}>
        {data.goals.length === 0 ? (
          <div className="card"><Empty icon="target" title="No goals yet" /></div>
        ) : (
          data.goals.map((g) => {
            const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
            const monthsLeft = g.deadline
              ? Math.max(0, Math.round((new Date(g.deadline).getTime() - Date.now()) / 2.63e9))
              : null;
            const perMonth = monthsLeft && monthsLeft > 0 ? (g.target - g.saved) / monthsLeft : null;
            return (
              <div className="card" key={g.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Ring pct={pct} size={70} stroke={8} tone="calm">
                    <Icon name={g.icon} size={22} style={{ color: "var(--olive-700)" }} />
                  </Ring>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 16 }}>{g.name}</span>
                      <IconBtn icon="close" label="Remove" onClick={() => removeGoal(g.id)} />
                    </div>
                    <p className="amount" style={{ fontSize: 20, margin: "4px 0 6px" }}>
                      {money(g.saved, cur)}
                      <span className="faint" style={{ fontSize: 12.5, fontFamily: "var(--sans)" }}> / {money(g.target, cur)}</span>
                    </p>
                    <Bar pct={pct} color={pct >= 100 ? "linear-gradient(90deg,#8d9a5b,#b3bd8e)" : "linear-gradient(90deg,#c9a3bb,#b3bd8e)"} />
                  </div>
                </div>

                <p className="faint" style={{ fontSize: 12, margin: "12px 0 0" }}>
                  {pct >= 100
                    ? "Done."
                    : perMonth
                    ? `${money(Math.round(perMonth), cur)} a month to finish on time.`
                    : `${money(g.target - g.saved, cur)} to go.`}
                </p>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setFund(g.id); setFundAmt(""); setDir(1); }}>
                    <Icon name="plus" size={14} /> Add
                  </button>
                  {g.saved > 0 && (
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setFund(g.id); setFundAmt(""); setDir(-1); }}>
                      <Icon name="minus" size={14} /> Take out
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

      <Sheet open={sheet} onClose={() => setSheet(false)} title="New goal">
        <GoalForm cur={cur} onAdd={(g) => { addGoal(g); setSheet(false); }} />
      </Sheet>

      <Sheet open={!!fund} onClose={() => setFund(null)} title={dir === 1 ? "Add" : "Take out"}>
        <Field label={`Amount (${cur})`}>
          <input className="input" inputMode="decimal" autoFocus value={fundAmt} onChange={(e) => setFundAmt(e.target.value.replace(/[^0-9.]/g, ""))} />
        </Field>
        <button
          className="btn btn-primary"
          disabled={!Number(fundAmt)}
          onClick={() => {
            if (fund) fundGoal(fund, dir * (Number(fundAmt) || 0));
            setFund(null);
          }}
        >
          {dir === 1 ? "Add" : "Take out"}
        </button>
      </Sheet>
    </>
  );
}

function GoalForm({
  cur,
  onAdd,
}: {
  cur: string;
  onAdd: (g: { name: string; icon: string; target: number; deadline?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState("target");
  const [deadline, setDeadline] = useState("");

  return (
    <div>
      <Field label="Name">
        <input className="input" autoFocus placeholder="Emergency fund" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`Target (${cur})`}>
        <input className="input" inputMode="decimal" placeholder="0" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <Field label="Deadline">
        <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>
      <Field label="Icon">
        <div className="icon-grid">
          {PICKER_ICONS.map((n) => (
            <button key={n} className="icon-pick" data-on={icon === n} onClick={() => setIcon(n)} aria-label={n}>
              <Icon name={n} size={19} />
            </button>
          ))}
        </div>
      </Field>
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !Number(target)}
        onClick={() => onAdd({ name: name.trim(), icon, target: Number(target) || 0, deadline: deadline || undefined })}
      >
        Create
      </button>
    </div>
  );
}

/* ==================== PAUSE ==================== */
function Pause() {
  const { data, addWish, resolveWish, removeWish } = useLedger();
  const cur = data.settings.currency;
  const days = data.settings.pauseDays;
  const [sheet, setSheet] = useState(false);

  const open = data.wishlist.filter((w) => !w.resolved);
  const passed = data.wishlist.filter((w) => w.resolved === "passed");
  const savedByPassing = passed.reduce((a, w) => a + w.amount, 0);

  return (
    <>
      <div className="hero">
        <span className="label">Not bought</span>
        <p className="amount amount-xl" style={{ margin: "6px 0 0", color: "var(--olive-900)" }}>
          {money(savedByPassing, cur)}
        </p>
        <p className="sub" style={{ marginBottom: 0 }}>Wait {days} days, then decide.</p>
      </div>

      <div style={{ marginTop: 14 }}>
        {open.length === 0 ? (
          <div className="card"><Empty icon="clock" title="Nothing paused" /></div>
        ) : (
          open.map((w) => {
            const waited = Math.floor((Date.now() - w.addedAt) / 86400000);
            const ready = waited >= days;
            return (
              <div className="card" key={w.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16 }}>{w.name}</div>
                    <p className="amount amount-md" style={{ margin: "4px 0 0" }}>{money(w.amount, cur)}</p>
                  </div>
                  <IconBtn icon="close" label="Remove" onClick={() => removeWish(w.id)} />
                </div>

                <div style={{ marginTop: 14 }}>
                  <Bar pct={(Math.min(waited, days) / days) * 100} color="linear-gradient(90deg,#c9a3bb,#b3bd8e)" />
                  <p className="faint" style={{ fontSize: 12, margin: "8px 0 0" }}>
                    {ready ? "Time's up — still want it?" : `Day ${waited} of ${days}`}
                  </p>
                </div>

                {ready && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => resolveWish(w.id, "passed")}>
                      Skip it
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => resolveWish(w.id, "bought")}>
                      Buy it
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
          <h2 className="section">Skipped</h2>
          <div className="card card-tight">
            {passed.map((w) => (
              <div className="row" key={w.id}>
                <Dot icon="check" tint="#8d9a5b" size={34} />
                <div className="row-main">
                  <div className="row-title" style={{ opacity: 0.65 }}>{w.name}</div>
                  <div className="row-sub">kept {money(w.amount, cur)}</div>
                </div>
                <IconBtn icon="close" label="Remove" onClick={() => removeWish(w.id)} />
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setSheet(true)}>
        Pause something
      </button>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Pause">
        <WishForm cur={cur} onAdd={(w) => { addWish(w); setSheet(false); }} />
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
      <Field label="What">
        <input className="input" autoFocus placeholder="The coat" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`Price (${cur})`}>
        <input className="input" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <Field label="Link">
        <input className="input" placeholder="Optional" value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !Number(amount)}
        onClick={() => onAdd({ name: name.trim(), amount: Number(amount) || 0, url: url || undefined })}
      >
        Start
      </button>
    </div>
  );
}
