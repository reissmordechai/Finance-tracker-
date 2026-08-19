"use client";
import { useEffect, useState } from "react";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";
import ConfirmSaveButton from "../components/ConfirmSaveButton";

const KIND_LABELS: Record<string, string> = { asset: "Asset", liability: "Liability", equity: "Equity" };
const KIND_COLORS: Record<string, string> = { asset: "#2F6B4F", liability: "#9C4221", equity: "#5B7B7A" };

export default function OtherAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("liability");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editKind, setEditKind] = useState("liability");
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");

  const load = () => fetch("/api/other-accounts").then((r) => r.json()).then(setAccounts);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim() || !value) return;
    await fetch("/api/other-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, kind, value: parseFloat(value) || 0, note: note || null }),
    });
    setName(""); setValue(""); setNote("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/other-accounts/${id}`, { method: "DELETE" });
    load();
  };

  const startEdit = (a: any) => {
    setEditingId(a.id); setEditName(a.name); setEditKind(a.kind); setEditValue(String(a.value)); setEditNote(a.note || "");
  };
  const saveEdit = async (id: string) => {
    await fetch(`/api/other-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, kind: editKind, value: parseFloat(editValue) || 0, note: editNote || null }),
    });
    setEditingId(null);
    load();
  };

  const totalAssets = accounts.filter((a) => a.kind === "asset").reduce((s, a) => s + a.value, 0);
  const totalLiabilities = accounts.filter((a) => a.kind === "liability").reduce((s, a) => s + a.value, 0);
  const totalEquity = accounts.filter((a) => a.kind === "equity").reduce((s, a) => s + a.value, 0);
  const netEffect = totalAssets + totalEquity - totalLiabilities;

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Other Assets &amp; Liabilities</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Anything not already covered by Bank Accounts, Holdings, Cards, or Loans — informal debts you owe someone, physical assets you own, or an ownership stake somewhere. This flows into your net worth on the Dashboard.
      </p>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Loan from my brother, Car" style={{ flex: 2, minWidth: 160 }} />
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: 130 }}>
          <option value="asset">Asset</option>
          <option value="liability">Liability (owed)</option>
          <option value="equity">Equity</option>
        </select>
        <input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value / amount owed" style={{ width: 150 }} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" style={{ flex: 1, minWidth: 140 }} />
        <button className="btn" onClick={add}>Add</button>
      </div>

      {accounts.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
            <span>Assets</span><span className="num" style={{ color: "#2F6B4F" }}>+${totalAssets.toFixed(2)}</span>
          </div>
          {totalEquity !== 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginTop: 4 }}>
              <span>Equity</span><span className="num" style={{ color: "#5B7B7A" }}>+${totalEquity.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginTop: 4 }}>
            <span>Liabilities</span><span className="num" style={{ color: "#9C4221" }}>-${totalLiabilities.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: "1px solid #EFEADC" }}>
            <span>Net effect on net worth</span>
            <span className="num" style={{ color: netEffect >= 0 ? "#0F3D2E" : "#9C4221" }}>${netEffect.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {accounts.map((a) => (
          <div className="card" key={a.id}>
            {editingId === a.id ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ flex: 2, minWidth: 140 }} />
                <select value={editKind} onChange={(e) => setEditKind(e.target.value)} style={{ width: 130 }}>
                  <option value="asset">Asset</option>
                  <option value="liability">Liability (owed)</option>
                  <option value="equity">Equity</option>
                </select>
                <input type="number" step="0.01" value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ width: 130 }} />
                <input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Note" style={{ flex: 1, minWidth: 120 }} />
                <ConfirmSaveButton onConfirm={() => saveEdit(a.id)} />
                <button className="btn-outline" onClick={() => setEditingId(null)} style={{ padding: "5px 10px", fontSize: 12 }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => startEdit(a)} style={{ border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
                  <div style={{ fontWeight: 600 }}>{a.name} <span className="pill" style={{ marginLeft: 6 }}>{KIND_LABELS[a.kind]}</span></div>
                  {a.note && <div style={{ fontSize: 12, color: "#8A8370" }}>{a.note}</div>}
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="num" style={{ fontWeight: 700, color: KIND_COLORS[a.kind] }}>${a.value.toFixed(2)}</span>
                  <ConfirmDeleteButton onConfirm={() => remove(a.id)} />
                </div>
              </div>
            )}
          </div>
        ))}
        {accounts.length === 0 && <div className="card" style={{ color: "#8A8370" }}>Nothing tracked yet — add one above.</div>}
      </div>
    </main>
  );
}
