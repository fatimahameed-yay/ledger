"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useLedger } from "@/lib/store";
import { CURRENCIES, money } from "@/lib/format";
import { catOf, TINTS } from "@/lib/categories";
import { Icon, PICKER_ICONS } from "@/lib/icons";
import { Field, Sheet, IconBtn, Empty } from "@/components/UI";
import type { Category, Method } from "@/lib/types";

const METHOD_META: Record<Method, { label: string; icon: string }> = {
  current: { label: "Current", icon: "bank" },
  card: { label: "Card", icon: "card" },
  cash: { label: "Cash", icon: "wallet" },
  savings: { label: "Savings", icon: "lotus" },
};
const ALL_METHODS: Method[] = ["current", "card", "cash", "savings"];

export default function SettingsPage() {
  const {
    ready, data, setSettings, replaceAll, reset,
    addCategory, updateCategory, removeCategory, moveCategory,
  } = useLedger();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [customCur, setCustomCur] = useState("");
  const [msg, setMsg] = useState("");

  if (!ready) return <div style={{ height: "60vh" }} />;

  const s = data.settings;

  function download(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const head = ["date", "amount", "currency", "category", "where", "note", "from", "type", "feeling"];
    const rows = [...data.expenses]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((e) =>
        [e.date, e.amount, s.currency, catOf(data.categories, e.category).label, e.merchant, e.note, e.method, e.kind, e.mood ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    download(`aura-${new Date().toISOString().slice(0, 10)}.csv`, [head.join(","), ...rows].join("\n"), "text/csv");
    setMsg("Saved.");
  }

  function importJSON(file: File) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result));
        if (!parsed || !Array.isArray(parsed.expenses)) throw new Error("bad file");
        replaceAll(parsed);
        setMsg("Restored.");
      } catch {
        setMsg("That file didn't work.");
      }
    };
    r.readAsText(file);
  }

  function toggleMethod(m: Method) {
    const has = s.methods.includes(m);
    if (has && s.methods.length === 1) return;
    setSettings({ methods: has ? s.methods.filter((x) => x !== m) : [...s.methods, m] });
  }

  return (
    <div className="fade-up">
      <header className="page-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="display">Settings</h1>
          <Link href="/" className="icon-btn" aria-label="Home"><Icon name="left" size={16} /></Link>
        </div>
      </header>

      {/* ---- you ---- */}
      <div className="card">
        <Field label="Name">
          <input className="input" placeholder="Optional" value={s.name} onChange={(e) => setSettings({ name: e.target.value })} />
        </Field>

        <Field label="Currency">
          <div className="chips">
            {CURRENCIES.map((c) => (
              <button key={c} className="chip" data-on={s.currency === c} onClick={() => setSettings({ currency: c })}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Or type your own"
              value={customCur}
              onChange={(e) => setCustomCur(e.target.value.slice(0, 4))}
            />
            <button
              className="btn btn-ghost btn-sm"
              disabled={!customCur.trim()}
              onClick={() => { setSettings({ currency: customCur.trim() }); setCustomCur(""); }}
            >
              Use
            </button>
          </div>
        </Field>

        <Field label="Accounts you use">
          <div className="chips">
            {ALL_METHODS.map((m) => (
              <button key={m} className="chip" data-on={s.methods.includes(m)} onClick={() => toggleMethod(m)}>
                <Icon name={METHOD_META[m].icon} size={14} /> {METHOD_META[m].label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* ---- defaults ---- */}
      <h2 className="section">Defaults</h2>
      <div className="card">
        <p className="faint" style={{ fontSize: 12, marginTop: 0 }}>Applied to each new month. Change any month on the Plan tab.</p>

        <Field label="Savings">
          <div className="segment">
            <button data-on={s.savingsMode === "percent"} onClick={() => setSettings({ savingsMode: "percent" })}>Percent</button>
            <button data-on={s.savingsMode === "amount"} onClick={() => setSettings({ savingsMode: "amount" })}>Fixed</button>
          </div>
        </Field>

        {s.savingsMode === "percent" ? (
          <Field label={`${s.savingsPct}% of income`}>
            <input
              type="range"
              min={0}
              max={90}
              value={s.savingsPct}
              onChange={(e) => setSettings({ savingsPct: Number(e.target.value) })}
              style={{ width: "100%" }}
            />
          </Field>
        ) : (
          <Field label={`Amount (${s.currency})`}>
            <input
              className="input"
              inputMode="decimal"
              placeholder="0"
              value={s.savingsAmount || ""}
              onChange={(e) => setSettings({ savingsAmount: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
            />
          </Field>
        )}

        <Field label="Pause list waiting time">
          <div className="chips">
            {[7, 14, 30, 60, 90].map((d) => (
              <button key={d} className="chip" data-on={s.pauseDays === d} onClick={() => setSettings({ pauseDays: d })}>
                {d} days
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* ---- categories ---- */}
      <h2 className="section">Categories</h2>
      <div className="card card-tight">
        {data.categories.length === 0 ? (
          <Empty icon="basket" title="No categories" />
        ) : (
          data.categories.map((c, i) => (
            <div className="row" key={c.id}>
              <span className="dot" style={{ background: `${c.tint}20`, color: c.tint }}>
                <Icon name={c.icon} size={18} />
              </span>
              <div className="row-main">
                <div className="row-title">{c.label}</div>
              </div>
              <IconBtn icon="up" label="Move up" onClick={() => moveCategory(c.id, -1)} />
              <IconBtn icon="down" label="Move down" onClick={() => moveCategory(c.id, 1)} />
              <IconBtn icon="pencil" label="Edit" onClick={() => setEditing(c)} />
              {c.id !== "other" && <IconBtn icon="trash" label="Delete" danger onClick={() => removeCategory(c.id)} />}
            </div>
          ))
        )}
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => setEditing("new")}>
          <Icon name="plus" size={14} /> New category
        </button>
      </div>

      {/* ---- data ---- */}
      <h2 className="section">Data</h2>
      <div className="card">
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div className="stat">
            <span className="label">Entries</span>
            <p className="amount amount-md" style={{ margin: 0 }}>{data.expenses.length}</p>
          </div>
          <div className="stat">
            <span className="label">All time</span>
            <p className="amount amount-md" style={{ margin: 0 }}>
              {money(data.expenses.reduce((a, e) => a + e.amount, 0), s.currency, true)}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              download(`aura-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
              setMsg("Saved.");
            }}
          >
            <Icon name="download" size={15} /> Backup
          </button>
          <button className="btn btn-ghost" onClick={exportCSV}>
            <Icon name="table" size={15} /> Export CSV
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={15} /> Restore
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
        </div>
        {msg && <p className="faint" style={{ fontSize: 12.5, margin: "12px 0 0" }}>{msg}</p>}
        <p className="faint" style={{ fontSize: 11.5, margin: "12px 0 0" }}>
          Stored on this device only. Back up before clearing your browser.
        </p>
      </div>

      <h2 className="section">Home screen</h2>
      <div className="card">
        <p className="sub" style={{ margin: 0 }}>iPhone — Share, then Add to Home Screen.</p>
        <p className="sub">Android — menu, then Install app.</p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <button className="btn btn-ghost" style={{ width: "100%", color: "var(--alert)" }} onClick={() => setConfirmReset(true)}>
          Erase everything
        </button>
      </div>

      <p className="faint" style={{ fontSize: 11.5, textAlign: "center", marginTop: 24 }}>Aura</p>

      {/* ---- category editor ---- */}
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : "Edit category"}>
        {editing && (
          <CategoryForm
            initial={editing === "new" ? null : editing}
            onSave={(c) => {
              if (editing === "new") addCategory(c);
              else updateCategory(editing.id, c);
              setEditing(null);
            }}
          />
        )}
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Erase everything?">
        <p className="sub" style={{ marginTop: 0 }}>This cannot be undone.</p>
        <button
          className="btn btn-primary"
          style={{ background: "linear-gradient(120deg,#bf7a72,#c9a3bb)" }}
          onClick={() => { reset(); setConfirmReset(false); setMsg("Cleared."); }}
        >
          Erase
        </button>
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setConfirmReset(false)}>
          Cancel
        </button>
      </Sheet>
    </div>
  );
}

function CategoryForm({
  initial,
  onSave,
}: {
  initial: Category | null;
  onSave: (c: { label: string; icon: string; tint: string }) => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "sparkle");
  const [tint, setTint] = useState(initial?.tint ?? TINTS[0]);

  return (
    <div>
      <Field label="Name">
        <input className="input" autoFocus placeholder="Skincare" value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>

      <Field label="Icon">
        <div className="icon-grid">
          {PICKER_ICONS.map((n) => (
            <button key={n} className="icon-pick" data-on={icon === n} onClick={() => setIcon(n)} aria-label={n}>
              <Icon name={n} size={19} style={icon === n ? { color: tint } : undefined} />
            </button>
          ))}
        </div>
      </Field>

      <Field label="Colour">
        <div className="chips">
          {TINTS.map((t) => (
            <button
              key={t}
              className="swatch"
              data-on={tint === t}
              style={{ background: t }}
              onClick={() => setTint(t)}
              aria-label={t}
            />
          ))}
        </div>
      </Field>

      <button className="btn btn-primary" disabled={!label.trim()} onClick={() => onSave({ label: label.trim(), icon, tint })}>
        Save
      </button>
    </div>
  );
}
