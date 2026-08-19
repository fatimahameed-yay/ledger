"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLedger, balanceOf, txnsOfAccount, effectOn } from "@/lib/store";
import { money, prettyDate, monthKey, monthLabel } from "@/lib/format";
import { catOf } from "@/lib/categories";
import { Icon } from "@/lib/icons";
import { Bar, Dot, Empty, Field, Ring, Sheet, IconBtn } from "@/components/UI";
import { PICKER_ICONS } from "@/lib/icons";

export default function AccountView({ id }: { id: string }) {
  const { ready, data, updateAccount, addGoal, fundGoal, removeGoal } = useLedger();
  const cur = data.settings.currency;
  const [openSheet, setOpenSheet] = useState(false);
  const [opening, setOpening] = useState("");
  const [goalSheet, setGoalSheet] = useState(false);
  const [fund, setFund] = useState<string | null>(null);
  const [fundAmt, setFundAmt] = useState("");
  const [dir, setDir] = useState<1 | -1>(1);

  const acc = data.accounts.find((a) => a.id === id);
  const list = useMemo(
    () =>
      acc
        ? [...txnsOfAccount(data, acc.id)].sort((a, b) =>
            a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt
          )
        : [],
    [data, acc]
  );

  if (!ready) return <div style={{ height: "60vh" }} />;
  if (!acc) {
    return (
      <div className="fade-up" style={{ paddingTop: 40 }}>
        <Empty icon="search" title="Account not found" />
        <Link href="/" className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }}>Home</Link>
      </div>
    );
  }

  const bal = balanceOf(data, acc.id);
  const thisMonth = monthKey(new Date());
  const monthTx = list.filter((t) => t.date.startsWith(thisMonth));
  const inThis = monthTx.reduce((a, t) => a + Math.max(0, effectOn(t, acc.id)), 0);
  const outThis = monthTx.reduce((a, t) => a + Math.max(0, -effectOn(t, acc.id)), 0);

  const goalTotal = data.goals.reduce((a, g) => a + g.saved, 0);

  return (
    <div className="fade-up">
      <header className="page-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Link href="/" className="icon-btn" aria-label="Back"><Icon name="left" size={16} /></Link>
          <span className="label">{acc.name}</span>
          <IconBtn icon="pencil" label="Opening balance" onClick={() => { setOpening(String(acc.opening || "")); setOpenSheet(true); }} />
        </div>
      </header>

      <section className="hero" style={{ textAlign: "center" }}>
        <span className="acct-ic" style={{ background: `${acc.tint}1f`, color: acc.tint, margin: "0 auto 12px" }}>
          <Icon name={acc.icon} size={20} />
        </span>
        <span className="label">Balance</span>
        <p className="amount amount-xl" style={{ margin: "6px 0 0", color: bal < 0 ? "var(--alert)" : "var(--olive-900)" }}>
          {money(bal, cur)}
        </p>
      </section>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="stat">
          <span className="label">In · {monthLabel(thisMonth).split(" ")[0]}</span>
          <p className="amount amount-md" style={{ margin: 0, color: "var(--olive-700)" }}>+{money(inThis, cur)}</p>
        </div>
        <div className="stat">
          <span className="label">Out · {monthLabel(thisMonth).split(" ")[0]}</span>
          <p className="amount amount-md" style={{ margin: 0, color: "var(--blush-700)" }}>−{money(outThis, cur)}</p>
        </div>
      </div>

      {/* goals live inside a savings account */}
      {acc.saving && (
        <>
          <h2 className="section">Goals</h2>
          <div className="card">
            {data.goals.length === 0 ? (
              <Empty icon="target" title="No goals yet" />
            ) : (
              data.goals.map((g) => {
                const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
                return (
                  <div key={g.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Ring pct={pct} size={54} stroke={7} tone="calm">
                        <Icon name={g.icon} size={17} style={{ color: "var(--olive-700)" }} />
                      </Ring>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15 }}>{g.name}</span>
                          <IconBtn icon="close" label="Remove" onClick={() => removeGoal(g.id)} />
                        </div>
                        <p className="amount" style={{ fontSize: 17, margin: "2px 0 6px" }}>
                          {money(g.saved, cur)}
                          <span className="faint" style={{ fontSize: 12, fontFamily: "var(--sans)" }}> / {money(g.target, cur)}</span>
                        </p>
                        <Bar pct={pct} color="linear-gradient(90deg,#c9a3bb,#b3bd8e)" />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setFund(g.id); setFundAmt(""); setDir(1); }}>
                        <Icon name="plus" size={13} /> Add
                      </button>
                      {g.saved > 0 && (
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setFund(g.id); setFundAmt(""); setDir(-1); }}>
                          <Icon name="minus" size={13} /> Take out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {goalTotal > 0 && (
              <p className="faint" style={{ fontSize: 11.5, margin: "4px 0 0" }}>
                {money(goalTotal, cur)} of this balance is spoken for.
              </p>
            )}
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => setGoalSheet(true)}>
              <Icon name="plus" size={14} /> New goal
            </button>
          </div>
        </>
      )}

      <h2 className="section">Activity</h2>
      <div className="card card-tight">
        {list.length === 0 ? (
          <Empty icon="list" title="Nothing here yet" />
        ) : (
          list.slice(0, 40).map((t) => {
            const eff = effectOn(t, acc.id);
            const k = t.type === "spend" ? catOf(data.categories, t.category ?? "other") : null;
            const other = data.accounts.find((a) => a.id === (t.account === acc.id ? t.toAccount : t.account));
            return (
              <div className="row" key={t.id}>
                <Dot
                  icon={k ? k.icon : t.type === "income" ? "down" : "refresh"}
                  tint={k ? k.tint : t.type === "income" ? "#6b7442" : "#9aa6a0"}
                />
                <div className="row-main">
                  <div className="row-title">
                    {t.type === "spend"
                      ? t.merchant || k!.label
                      : t.type === "income"
                      ? t.merchant || "Money in"
                      : eff > 0
                      ? `From ${other?.name ?? ""}`
                      : `To ${other?.name ?? ""}`}
                  </div>
                  <div className="row-sub">{prettyDate(t.date)}</div>
                </div>
                <span
                  className="amount"
                  style={{ fontSize: 17, color: eff > 0 ? "var(--olive-700)" : "var(--ink)" }}
                >
                  {eff > 0 ? "+" : "−"}{money(Math.abs(eff), cur)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* opening balance */}
      <Sheet open={openSheet} onClose={() => setOpenSheet(false)} title="Starting balance">
        <p className="sub" style={{ marginTop: 0 }}>
          What was in {acc.name} before you started tracking.
        </p>
        <Field label={`Amount (${cur})`}>
          <input
            className="input"
            inputMode="decimal"
            autoFocus
            value={opening}
            onChange={(e) => setOpening(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </Field>
        <button
          className="btn btn-primary"
          onClick={() => {
            updateAccount(acc.id, { opening: Number(opening) || 0 });
            setOpenSheet(false);
          }}
        >
          Save
        </button>
      </Sheet>

      {/* new goal */}
      <Sheet open={goalSheet} onClose={() => setGoalSheet(false)} title="New goal">
        <GoalForm
          cur={cur}
          onAdd={(g) => { addGoal(g); setGoalSheet(false); }}
        />
      </Sheet>

      {/* fund goal */}
      <Sheet open={!!fund} onClose={() => setFund(null)} title={dir === 1 ? "Add to goal" : "Take out"}>
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
    </div>
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
