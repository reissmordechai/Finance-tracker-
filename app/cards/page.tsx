"use client";
import { useEffect, useState } from "react";

export default function CardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccount, setPayAccount] = useState("");

  const load = () => {
    fetch("/api/cards").then((r) => r.json()).then(setCards);
    fetch("/api/bankaccounts").then((r) => r.json()).then(setAccounts);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, limit: parseFloat(limit) || 0, dueDay: parseInt(dueDay) || null }),
    });
    setName(""); setLimit(""); setDueDay("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    load();
  };

  const pay = async (id: string) => {
    const amt = parseFloat(payAmount);
    if (!amt) return;
    await fetch(`/api/cards/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date().toISOString(), amount: amt, fromAccountId: payAccount || null }),
    });
    setPayAmount(""); setPayingId(null);
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Cards</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Card name" style={{ flex: 2, minWidth: 140 }} />
        <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Limit" style={{ width: 100 }} />
        <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Due day" style={{ width: 90 }} />
        <button className="btn" onClick={add}>Add card</button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {cards.map((c) => (
          <div className="card" key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <button onClick={() => remove(c.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 11, color: "#8A8370" }}>Limit</div><div className="num">${c.limit.toFixed(2)}</div></div>
              <div><div style={{ fontSize: 11, color: "#8A8370" }}>Due day</div><div className="num">{c.dueDay || "—"}</div></div>
              <div><div style={{ fontSize: 11, color: "#8A8370" }}>Amount due</div><div className="num" style={{ fontWeight: 700, color: c.amountDue > 0 ? "#9C4221" : "#0F3D2E" }}>${c.amountDue.toFixed(2)}</div></div>
            </div>
            <button className="btn-outline" style={{ marginTop: 10 }} onClick={() => setPayingId(payingId === c.id ? null : c.id)}>
              {payingId === c.id ? "Cancel" : "Pay card"}
            </button>
            {payingId === c.id && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
                <select value={payAccount} onChange={(e) => setPayAccount(e.target.value)} style={{ width: 160 }}>
                  <option value="">From account (optional)</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button className="btn" onClick={() => pay(c.id)}>Record payment</button>
              </div>
            )}
          </div>
        ))}
        {cards.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No cards yet — add one above.</div>}
      </div>
    </main>
  );
}
