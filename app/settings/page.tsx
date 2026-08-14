"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [rate, setRate] = useState("");

  const [accounts, setAccounts] = useState<any[]>([]);
  const [acctTab, setAcctTab] = useState("expense");
  const [newAcctName, setNewAcctName] = useState("");

  const [general, setGeneral] = useState<any>(null);
  const [currency, setCurrency] = useState("$");
  const [location, setLocation] = useState("");
  const [charityDefaultPct, setCharityDefaultPct] = useState("10");
  const [savedMsg, setSavedMsg] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const load = () => fetch("/api/settings/taxprofiles").then((r) => r.json()).then(setProfiles);
  const loadAccounts = () => fetch("/api/categories").then((r) => r.json()).then(setAccounts);
  useEffect(() => {
    load();
    loadAccounts();
    fetch("/api/settings/general").then((r) => r.json()).then((d) => {
      setGeneral(d);
      setCurrency(d.currency || "$");
      setLocation(d.location || "");
      setCharityDefaultPct(String(d.charityDefaultPct ?? 10));
    });
    try { setLastBackup(localStorage.getItem("lastBackupAt")); } catch {}
  }, []);

  const daysSinceBackup = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000) : 0;

  const addAccount = async () => {
    const name = newAcctName.trim();
    if (!name) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: acctTab }),
    });
    setNewAcctName("");
    loadAccounts();
  };
  const removeAccount = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    loadAccounts();
  };

  const addProfile = async () => {
    if (!label.trim() || !rate) return;
    await fetch("/api/settings/taxprofiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, rate: parseFloat(rate) }),
    });
    setLabel(""); setRate("");
    load();
  };

  const removeProfile = async (id: string) => {
    await fetch(`/api/settings/taxprofiles/${id}`, { method: "DELETE" });
    load();
  };

  const saveGeneral = async () => {
    await fetch("/api/settings/general", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency, location, charityDefaultPct: parseFloat(charityDefaultPct) || 10 }),
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1800);
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Settings</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>General</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8370" }}>Currency symbol</label>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 80, display: "block" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8370" }}>Location (optional)</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Monsey, NY" style={{ width: 200, display: "block" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8370" }}>Default charity rate (%)</label>
            <input type="number" step="0.1" value={charityDefaultPct} onChange={(e) => setCharityDefaultPct(e.target.value)} style={{ width: 90, display: "block" }} />
          </div>
          <button className="btn" onClick={saveGeneral}>{savedMsg ? "Saved ✓" : "Save"}</button>
        </div>
        <div style={{ fontSize: 11, color: "#B0A88E", marginTop: 8 }}>Note: display currently shows $ throughout the app regardless of this setting — this saves your preference for future use.</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Accounts</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {["expense", "income"].map((t) => (
            <button key={t} className={acctTab === t ? "btn" : "btn-outline"} onClick={() => setAcctTab(t)} style={{ padding: "5px 14px", fontSize: 12, textTransform: "capitalize" }}>{t} accounts</button>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {accounts.filter((a) => a.type === acctTab).map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FBF9F2", border: "1px solid #D8D0BC", borderRadius: 16, padding: "5px 10px 5px 14px", fontSize: 13 }}>
              {a.name}
              <button onClick={() => removeAccount(a.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
            </div>
          ))}
          {accounts.filter((a) => a.type === acctTab).length === 0 && <div style={{ color: "#8A8370", fontSize: 13 }}>No {acctTab} accounts yet.</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newAcctName} onChange={(e) => setNewAcctName(e.target.value)} placeholder={`New ${acctTab} account, e.g. Groceries`} style={{ flex: 1, minWidth: 160 }} onKeyDown={(e) => e.key === "Enter" && addAccount()} />
          <button className="btn" onClick={addAccount}>Add</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Charity / Maaser</div>
        <div style={{ fontSize: 13, color: "#5B5540", marginBottom: 10 }}>Track what you owe against what you've given.</div>
        <Link href="/charity" className="btn-outline" style={{ textDecoration: "none", display: "inline-block" }}>Open Charity tracker</Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Sales tax profiles</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. NY" style={{ flex: 1, minWidth: 140 }} />
          <input type="number" step="0.001" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate %" style={{ width: 110 }} />
          <button className="btn" onClick={addProfile}>Add</button>
        </div>
        {profiles.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
            <span>{p.label}</span>
            <span>
              <span className="num">{p.rate}%</span>
              <button onClick={() => removeProfile(p.id)} style={{ border: "none", background: "none", color: "#B0A88E", marginLeft: 10 }}>✕</button>
            </span>
          </div>
        ))}
        {profiles.length === 0 && <div style={{ color: "#8A8370" }}>No tax profiles yet.</div>}
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>More</div>
        <div style={{ display: "grid", gap: 8 }}>
          <Link href="/tags" className="btn-outline" style={{ textDecoration: "none", textAlign: "center" }}>Manage Tags</Link>
          <Link href="/trash" className="btn-outline" style={{ textDecoration: "none", textAlign: "center" }}>Trash (deleted transactions)</Link>
          <a href="/api/export" className="btn-outline" style={{ textDecoration: "none", textAlign: "center" }} onClick={() => { try { localStorage.setItem("lastBackupAt", new Date().toISOString()); } catch {} }}>Export all transactions (CSV)</a>
        </div>
        {lastBackup && (
          <div style={{ fontSize: 11.5, color: daysSinceBackup > 30 ? "#9C4221" : "#8A8370", marginTop: 10 }}>
            Last backed up {daysSinceBackup === 0 ? "today" : `${daysSinceBackup} day${daysSinceBackup !== 1 ? "s" : ""} ago`}
            {daysSinceBackup > 30 && " — consider exporting a fresh copy"}
          </div>
        )}
        {!lastBackup && <div style={{ fontSize: 11.5, color: "#8A8370", marginTop: 10 }}>No backup recorded yet on this device.</div>}
      </div>
    </main>
  );
}
