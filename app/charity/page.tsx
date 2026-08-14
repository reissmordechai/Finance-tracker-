"use client";
import { useEffect, useState } from "react";

export default function CharityPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [giveAmount, setGiveAmount] = useState("");
  const [giveKind, setGiveKind] = useState("cash");
  const [giveNote, setGiveNote] = useState("");
  const [owedAmount, setOwedAmount] = useState("");
  const [owedNote, setOwedNote] = useState("");
  const [showGive, setShowGive] = useState(false);
  const [showOwed, setShowOwed] = useState(false);

  const load = () => fetch("/api/charity").then((r) => r.json()).then(setEntries);
  useEffect(() => { load(); }, []);

  const owed = entries.filter((e) => e.type === "owed").reduce((s, e) => s + e.amount, 0);
  const given = entries.filter((e) => e.type === "given").reduce((s, e) => s + e.amount, 0);
  const balance = owed - given;

  const recordGift = async () => {
    const amt = parseFloat(giveAmount);
    if (!amt) return;
    await fetch("/api/charity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "given", kind: giveKind, amount: amt, note: giveNote || null }),
    });
    setGiveAmount(""); setGiveKind("cash"); setGiveNote(""); setShowGive(false);
    load();
  };

  const recordObligation = async () => {
    const amt = parseFloat(owedAmount);
    if (!amt) return;
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
          </div>
        )}
        {showOwed && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <input type="number" step="0.01" value={owedAmount} onChange={(e) => setOwedAmount(e.target.value)} placeholder="Amount to set aside" style={{ width: 160 }} />
            <input value={owedNote} onChange={(e) => setOwedNote(e.target.value)} placeholder="Note (optional)" style={{ flex: 1, minWidth: 140 }} />
            <button className="btn" onClick={recordObligation}>Save</button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ fontWeight: 600, padding: "14px 14px 0" }}>History</div>
        {entries.map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1px solid #EFEADC" }}>
            <div>
              <div>{e.type === "owed" ? "Set aside" : `Given${e.kind && e.kind !== "cash" ? ` (${e.kind === "time" ? "time/effort" : "in-kind"})` : ""}`}{e.note ? ` · ${e.note}` : ""}</div>
              <div style={{ fontSize: 11, color: "#8A8370" }}>{e.date.slice(0, 10)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="num" style={{ color: e.type === "owed" ? "#9C4221" : "#2F6B4F", fontWeight: 600 }}>
                {e.type === "owed" ? "+" : "-"}${e.amount.toFixed(2)}
              </span>
              <button onClick={() => remove(e.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <div style={{ padding: 14, color: "#8A8370" }}>No entries yet.</div>}
      </div>
    </main>
  );
}
