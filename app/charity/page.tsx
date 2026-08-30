"use client";
import { useEffect, useState } from "react";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";
import ConfirmSaveButton from "../components/ConfirmSaveButton";

export default function CharityPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [giveAmount, setGiveAmount] = useState("");
  const [giveKind, setGiveKind] = useState("cash");
  const [giveNote, setGiveNote] = useState("");
  const [owedAmount, setOwedAmount] = useState("");
  const [owedNote, setOwedNote] = useState("");
  const [showGive, setShowGive] = useState(false);
  const [showOwed, setShowOwed] = useState(false);
  const [summaryYear, setSummaryYear] = useState(String(new Date().getFullYear()));
  const [giveError, setGiveError] = useState("");
  const [owedError, setOwedError] = useState("");

  const load = () => fetch("/api/charity").then((r) => r.json()).then(setEntries);
  useEffect(() => { load(); }, []);

  const owed = entries.filter((e) => e.type === "owed").reduce((s, e) => s + e.amount, 0);
  const given = entries.filter((e) => e.type === "given").reduce((s, e) => s + e.amount, 0);
  const balance = owed - given;

  const years = Array.from(new Set(entries.map((e) => e.date.slice(0, 4)))).sort().reverse();
  const yearEntries = entries.filter((e) => e.date.slice(0, 4) === summaryYear && e.type === "given");
  const byKind: Record<string, number> = {};
  yearEntries.forEach((e) => { byKind[e.kind || "cash"] = (byKind[e.kind || "cash"] || 0) + e.amount; });
  const yearTotal = yearEntries.reduce((s, e) => s + e.amount, 0);

  const exportCsv = () => {
    const header = ["Date", "Type", "Kind", "Amount", "Note"];
    const rows = entries.map((e) => [e.date.slice(0, 10), e.type, e.kind || "", e.amount.toFixed(2), e.note || ""]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "charity.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const recordGift = async () => {
    setGiveError("");
    const amt = parseFloat(giveAmount);
    if (!amt) { setGiveError("Enter an amount."); return; }
    await fetch("/api/charity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "given", kind: giveKind, amount: amt, note: giveNote || null }),
    });
    setGiveAmount(""); setGiveKind("cash"); setGiveNote(""); setShowGive(false);
    load();
  };

  const recordObligation = async () => {
    setOwedError("");
    const amt = parseFloat(owedAmount);
    if (!amt) { setOwedError("Enter an amount."); return; }
    await fetch("/api/charity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "owed", amount: amt, note: owedNote || null }),
    });
    setOwedAmount(""); setOwedNote(""); setShowOwed(false);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/charity/${id}`, { method: "DELETE" });
    load();
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const startEdit = (e: any) => { setEditingId(e.id); setEditAmount(String(e.amount)); setEditNote(e.note || ""); };
  const saveEdit = async (id: string) => {
    await fetch(`/api/charity/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(editAmount) || 0, note: editNote || null }),
    });
    setEditingId(null);
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Charity / Maaser</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Tracks what you owe to charity (10% of income, or whatever you set aside) against what you've actually given.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#8A8370" }}>Still owed</div>
        <div className="num" style={{ fontSize: 30, fontWeight: 700, color: balance > 0 ? "#9C4221" : "#2F6B4F" }}>${balance.toFixed(2)}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
          <div><div style={{ fontSize: 11, color: "#8A8370" }}>Total set aside</div><div className="num">${owed.toFixed(2)}</div></div>
          <div><div style={{ fontSize: 11, color: "#8A8370" }}>Total given</div><div className="num">${given.toFixed(2)}</div></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn" onClick={() => setShowGive((s) => !s)}>{showGive ? "Cancel" : "Record a gift"}</button>
          <button className="btn-outline" onClick={() => setShowOwed((s) => !s)}>{showOwed ? "Cancel" : "Add to what's owed"}</button>
        </div>
        {showGive && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <input type="number" step="0.01" value={giveAmount} onChange={(e) => setGiveAmount(e.target.value)} placeholder="Amount / value given" style={{ width: 150 }} />
            <select value={giveKind} onChange={(e) => setGiveKind(e.target.value)} style={{ width: 140 }}>
              <option value="cash">Cash donation</option>
              <option value="time">Time / effort</option>
              <option value="other">Other in-kind</option>
            </select>
            <input value={giveNote} onChange={(e) => setGiveNote(e.target.value)} placeholder="Note (optional)" style={{ flex: 1, minWidth: 140 }} />
            <button className="btn" onClick={recordGift}>Save</button>
            {giveError && (
              <div style={{ width: "100%", fontSize: 12.5, color: "#9C4221", fontWeight: 500 }}>{giveError}</div>
            )}
          </div>
        )}
        {showOwed && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <input type="number" step="0.01" value={owedAmount} onChange={(e) => setOwedAmount(e.target.value)} placeholder="Amount to set aside" style={{ width: 160 }} />
            <input value={owedNote} onChange={(e) => setOwedNote(e.target.value)} placeholder="Note (optional)" style={{ flex: 1, minWidth: 140 }} />
            <button className="btn" onClick={recordObligation}>Save</button>
            {owedError && (
              <div style={{ width: "100%", fontSize: 12.5, color: "#9C4221", fontWeight: 500 }}>{owedError}</div>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Year-end summary</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {years.length > 0 ? (
              <select value={summaryYear} onChange={(e) => setSummaryYear(e.target.value)} style={{ width: 100 }}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            ) : (
              <input value={summaryYear} onChange={(e) => setSummaryYear(e.target.value)} style={{ width: 100 }} />
            )}
            <button className="btn-outline" onClick={exportCsv} style={{ padding: "6px 12px", fontSize: 12 }}>Export CSV</button>
          </div>
        </div>
        <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#2F6B4F" }}>${yearTotal.toFixed(2)} given in {summaryYear}</div>
        {Object.keys(byKind).length > 0 && (
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            {Object.entries(byKind).map(([kind, amt]) => (
              <div key={kind}>
                <div style={{ fontSize: 11, color: "#8A8370", textTransform: "capitalize" }}>{kind === "time" ? "Time/effort" : kind}</div>
                <div className="num" style={{ fontWeight: 600 }}>${amt.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ fontWeight: 600, padding: "14px 14px 0" }}>History</div>
        {entries.map((e) => (
          editingId === e.id ? (
            <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", borderTop: "1px solid #EFEADC", flexWrap: "wrap" }}>
              <input type="number" step="0.01" autoFocus value={editAmount} onChange={(ev) => setEditAmount(ev.target.value)} style={{ width: 110 }} />
              <input value={editNote} onChange={(ev) => setEditNote(ev.target.value)} placeholder="Note" style={{ flex: 1, minWidth: 120 }} />
              <ConfirmSaveButton onConfirm={() => saveEdit(e.id)} />
              <button className="btn-outline" onClick={() => setEditingId(null)} style={{ padding: "6px 12px", fontSize: 12 }}>Cancel</button>
            </div>
          ) : (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1px solid #EFEADC" }}>
              <button onClick={() => startEdit(e)} style={{ border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
                <div>{e.type === "owed" ? "Set aside" : `Given${e.kind && e.kind !== "cash" ? ` (${e.kind === "time" ? "time/effort" : "in-kind"})` : ""}`}{e.note ? ` · ${e.note}` : ""}</div>
                <div style={{ fontSize: 11, color: "#8A8370" }}>{e.date.slice(0, 10)}</div>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="num" style={{ color: e.type === "owed" ? "#9C4221" : "#2F6B4F", fontWeight: 600 }}>
                  {e.type === "owed" ? "+" : "-"}${e.amount.toFixed(2)}
                </span>
                <ConfirmDeleteButton onConfirm={() => remove(e.id)} />
              </div>
            </div>
          )
        ))}
        {entries.length === 0 && <div style={{ padding: 14, color: "#8A8370" }}>No entries yet.</div>}
      </div>
    </main>
  );
}
