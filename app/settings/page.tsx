"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useLedger, balanceOf } from "@/lib/store";
import { CURRENCIES, money } from "@/lib/format";
import { catOf, TINTS } from "@/lib/categories";
import { Icon, PICKER_ICONS } from "@/lib/icons";
import { Field, Sheet, IconBtn, Empty } from "@/components/UI";
import type { Category, Account } from "@/lib/types";

export default function SettingsPage() {
  const {
    ready, data, setSettings, replaceAll, reset,
    addCategory, updateCategory, removeCategory, moveCategory,
    addAccount, updateAccount, removeAccount,
  } = useLedger();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editCat, setEditCat] = useState<Category | "new" | null>(null);
  const [editAcc, setEditAcc] = useState<Account | "new" | null>(null);
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
    const head = ["date", "type", "amount", "currency", "account", "to", "category", "where", "note", "need/want"];
    const rows = [...data.txns]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((t) =>
        [
          t.date, t.type, t.amount, s.currency,
          data.accounts.find((a) => a.id === t.account)?.name ?? "",
          data.accounts.find((a) => a.id === t.toAccount)?.name ?? "",
          t.category ? catOf(data.categories, t.category).label : "",
          t.merchant, t.note, t.kind ?? "",
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      );
    download(`aura-${new Date().toISOString().slice(0, 10)}.csv`, [head.join(","), ...rows].join("\n"), "text/csv");
    setMsg("Saved.");
  }

  function importJSON(file: File) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result));
        if (!parsed) throw new Error("bad");
        replaceAll(parsed);
        setMsg("Restored.");
      } catch {
        setMsg("That file didn't work.");
      }
    };
    r.readAsText(file);
  }

  return (
    <div className="fade-up">
      <header className="page-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="display">Settings</h1>
          <Link href="/" className="icon-btn" aria-label="Home"><Icon name="left" size={16} /></Link>
        </div>
      </header>

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
              placeholder="Or your own"
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

        <Field label="Pause list wait">
          <div className="chips">
            {[7, 14, 30, 60, 90].map((d) => (
              <button key={d} className="chip" data-on={s.pauseDays === d} onClick={() => setSettings({ pauseDays: d })}>
                {d} days
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* ---- accounts ---- */}
      <h2 className="section">Accounts</h2>
      <div className="card card-tight">
        {data.accounts.map((a) => (
          <div className="row" key={a.id}>
            <span className="dot" style={{ background: `${a.tint}20`, color: a.tint }}>
              <Icon name={a.icon} size={18} />
            </span>
            <div className="row-main">
              <div className="row-title">{a.name}</div>
              <div className="row-sub">started at {money(a.opening, s.currency)}</div>
            </div>
            <span className="amount" style={{ fontSize: 17 }}>{money(balanceOf(data, a.id), s.currency)}</span>
            <IconBtn icon="pencil" label="Edit" onClick={() => setEditAcc(a)} />
            {data.accounts.length > 1 && (
              <IconBtn icon="trash" label="Delete" danger onClick={() => removeAccount(a.id)} />
            )}
          </div>
        ))}
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => setEditAcc("new")}>
          <Icon name="plus" size={14} /> New account
        </button>
      </div>

      {/* ---- categories ---- */}
      <h2 className="section">Categories</h2>
      <div className="card card-tight">
        {data.categories.length === 0 ? (
          <Empty icon="basket" title="No categories" />
        ) : (
          data.categories.map((c) => (
            <div className="row" key={c.id}>
              <span className="dot" style={{ background: `${c.tint}20`, color: c.tint }}>
                <Icon name={c.icon} size={18} />
              </span>
              <div className="row-main"><div className="row-title">{c.label}</div></div>
              <IconBtn icon="up" label="Up" onClick={() => moveCategory(c.id, -1)} />
              <IconBtn icon="down" label="Down" onClick={() => moveCategory(c.id, 1)} />
              <IconBtn icon="pencil" label="Edit" onClick={() => setEditCat(c)} />
              {c.id !== "other" && <IconBtn icon="trash" label="Delete" danger onClick={() => removeCategory(c.id)} />}
            </div>
          ))
        )}
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => setEditCat("new")}>
          <Icon name="plus" size={14} /> New category
        </button>
      </div>

      {/* ---- data ---- */}
      <h2 className="section">Data</h2>
      <div className="card">
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div className="stat">
            <span className="label">Entries</span>
            <p className="amount amount-md" style={{ margin: 0 }}>{data.txns.length}</p>
          </div>
          <div className="stat">
            <span className="label">Since</span>
            <p className="amount amount-md" style={{ margin: 0 }}>{s.startMonth}</p>
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
          Start over
        </button>
      </div>

      <p className="faint" style={{ fontSize: 11.5, textAlign: "center", marginTop: 24 }}>Aura</p>

      <Sheet open={!!editCat} onClose={() => setEditCat(null)} title={editCat === "new" ? "New category" : "Category"}>
        {editCat && (
          <CategoryForm
            initial={editCat === "new" ? null : editCat}
            onSave={(c) => {
              if (editCat === "new") addCategory(c);
              else updateCategory(editCat.id, c);
              setEditCat(null);
            }}
          />
        )}
      </Sheet>

      <Sheet open={!!editAcc} onClose={() => setEditAcc(null)} title={editAcc === "new" ? "New account" : "Account"}>
        {editAcc && (
          <AccountForm
            cur={s.currency}
            initial={editAcc === "new" ? null : editAcc}
            onSave={(a) => {
              if (editAcc === "new") addAccount(a);
              else updateAccount(editAcc.id, a);
              setEditAcc(null);
            }}
          />
        )}
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Start over?">
        <p className="sub" style={{ marginTop: 0 }}>Erases everything. Cannot be undone.</p>
        <button
          className="btn btn-primary"
          style={{ background: "linear-gradient(120deg,#bf7a72,#c9a3bb)" }}
          onClick={() => { reset(); setConfirmReset(false); }}
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
  initial, onSave,
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
            <button key={t} className="swatch" data-on={tint === t} style={{ background: t }} onClick={() => setTint(t)} aria-label={t} />
          ))}
        </div>
      </Field>
      <button className="btn btn-primary" disabled={!label.trim()} onClick={() => onSave({ label: label.trim(), icon, tint })}>
        Save
      </button>
    </div>
  );
}

function AccountForm({
  cur, initial, onSave,
}: {
  cur: string;
  initial: Account | null;
  onSave: (a: { name: string; icon: string; tint: string; opening: number; saving: boolean }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "bank");
  const [tint, setTint] = useState(initial?.tint ?? TINTS[0]);
  const [opening, setOpening] = useState(String(initial?.opening ?? ""));
  const [saving, setSaving] = useState(initial?.saving ?? false);

  return (
    <div>
      <Field label="Name">
        <input className="input" autoFocus placeholder="Current" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`Starting balance (${cur})`}>
        <input
          className="input"
          inputMode="decimal"
          placeholder="0"
          value={opening}
          onChange={(e) => setOpening(e.target.value.replace(/[^0-9.]/g, ""))}
        />
      </Field>
      <Field label="Kind">
        <div className="segment">
          <button data-on={!saving} onClick={() => setSaving(false)}>Spending</button>
          <button data-on={saving} onClick={() => setSaving(true)}>Savings</button>
        </div>
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
            <button key={t} className="swatch" data-on={tint === t} style={{ background: t }} onClick={() => setTint(t)} aria-label={t} />
          ))}
        </div>
      </Field>
      <button
        className="btn btn-primary"
        disabled={!name.trim()}
        onClick={() => onSave({ name: name.trim(), icon, tint, opening: Number(opening) || 0, saving })}
      >
        Save
      </button>
    </div>
  );
}
