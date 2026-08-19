"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useLedger } from "@/lib/store";
import { CURRENCIES, money } from "@/lib/format";
import { cat } from "@/lib/categories";
import { Field, Sheet } from "@/components/UI";

export default function SettingsPage() {
  const { ready, data, setSettings, replaceAll, reset } = useLedger();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState("");

  if (!ready) return <div style={{ height: "60vh" }} />;

  function download(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    download(`aura-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
    setMsg("Backup saved.");
  }

  function exportCSV() {
    const head = ["date", "amount", "currency", "category", "where", "notes", "paid from", "need/want", "mood"];
    const rows = [...data.expenses]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((e) =>
        [e.date, e.amount, data.settings.currency, cat(e.category).label, e.merchant, e.note, e.method, e.kind, e.mood ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    download(`aura-expenses-${new Date().toISOString().slice(0, 10)}.csv`, [head.join(","), ...rows].join("\n"), "text/csv");
    setMsg("Spreadsheet saved.");
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
        setMsg("That file didn't look right.");
      }
    };
    r.readAsText(file);
  }

  const totalLogged = data.expenses.length;
  const allTime = data.expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="fade-up">
      <header className="page-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">Yours</p>
            <h1 className="display">Settings.</h1>
          </div>
          <Link href="/" className="chip">← Home</Link>
        </div>
      </header>

      <div className="card">
        <Field label="What should I call you">
          <input
            className="input"
            placeholder="Your name"
            value={data.settings.name}
            onChange={(e) => setSettings({ name: e.target.value })}
          />
        </Field>

        <Field label="Currency">
          <div className="chips">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                className="chip"
                data-on={data.settings.currency === c}
                onClick={() => setSettings({ currency: c })}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <h2 className="section">Your record</h2>
      <div className="grid-2">
        <div className="stat">
          <span className="label">Entries logged</span>
          <p className="amount amount-md" style={{ margin: 0 }}>{totalLogged}</p>
        </div>
        <div className="stat">
          <span className="label">Tracked all-time</span>
          <p className="amount amount-md" style={{ margin: 0 }}>{money(allTime, data.settings.currency, true)}</p>
        </div>
      </div>

      <h2 className="section">Backup</h2>
      <div className="card">
        <p className="sub" style={{ marginTop: 0 }}>
          Everything lives in this browser only — nothing is uploaded anywhere. Take a backup now and then, especially
          before clearing your browser data.
        </p>
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={exportJSON}>⬇ Download backup (.json)</button>
          <button className="btn btn-ghost" onClick={exportCSV}>⬇ Export spreadsheet (.csv)</button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>⬆ Restore from backup</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])}
          />
        </div>
        {msg && <p className="faint" style={{ fontSize: 12.5, marginBottom: 0, marginTop: 12 }}>{msg}</p>}
      </div>

      <h2 className="section">Add to your home screen</h2>
      <div className="card">
        <p className="sub" style={{ marginTop: 0 }}>
          <strong style={{ fontWeight: 500 }}>iPhone —</strong> open this page in Safari, tap Share, then
          &ldquo;Add to Home Screen&rdquo;.
          <br />
          <br />
          <strong style={{ fontWeight: 500 }}>Android —</strong> open in Chrome, tap the ⋮ menu, then
          &ldquo;Install app&rdquo;.
        </p>
        <p className="faint" style={{ fontSize: 12, marginBottom: 0 }}>
          It then opens full-screen, like any other app — and works offline.
        </p>
      </div>

      <h2 className="section">Start over</h2>
      <div className="card">
        <button className="btn btn-ghost" style={{ width: "100%", color: "var(--alert)" }} onClick={() => setConfirmReset(true)}>
          Erase everything
        </button>
      </div>

      <p className="faint" style={{ fontSize: 11.5, textAlign: "center", marginTop: 26 }}>
        Aura · made to be kind about money
      </p>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Erase everything?">
        <p className="sub" style={{ marginTop: 0 }}>
          Every entry, plan, goal and note goes. This can&apos;t be undone — download a backup first if you&apos;re unsure.
        </p>
        <button
          className="btn btn-primary"
          style={{ background: "linear-gradient(120deg,#bf7a72,#c9a3bb)" }}
          onClick={() => {
            reset();
            setConfirmReset(false);
            setMsg("All clear.");
          }}
        >
          Yes, erase it all
        </button>
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setConfirmReset(false)}>
          Keep my data
        </button>
      </Sheet>
    </div>
  );
}
