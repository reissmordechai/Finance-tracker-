"use client";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");

  const load = () => fetch("/api/holdings").then((r) => r.json()).then(setHoldings);
  useEffect(() => { load(); }, []);

  const add = async () => {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt) return;
    await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, symbol: symbol || null, amount: amt, date: new Date().toISOString() }),
    });
    setName(""); setSymbol(""); setAmount("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Nav />
      <h1 style={{ color: "#0F3D2E" }}>Holdings</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Add a symbol (like <code>VOO</code> for an S&amp;P 500 ETF) and the daily cron job will keep the value current on its own.
        Leave the symbol blank to track something manually instead.
      </p>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. S&P 500 ETF" style={{ flex: 2, minWidth: 160 }} />
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol (optional), e.g. VOO" style={{ width: 160 }} />
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount invested" style={{ width: 140 }} />
        <button className="btn" onClick={add}>Add holding</button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {holdings.map((h) => {
          const invested = h.entries.reduce((s: number, e: any) => s + e.amount, 0);
          const gain = h.currentValue - invested;
          const gainPct = invested ? (gain / invested) * 100 : 0;
          return (
            <div className="card" key={h.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>{h.name} {h.symbol && <span style={{ fontSize: 11, color: "#8A8370" }}>({h.symbol})</span>}</div>
                <button onClick={() => remove(h.id)} style={{ border: "none", background: "none", color: "#B0A88E", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8A8370" }}>Invested</div>
                  <div className="num" style={{ fontWeight: 600 }}>${invested.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8A8370" }}>Current value</div>
                  <div className="num" style={{ fontWeight: 600 }}>${h.currentValue.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8A8370" }}>Gain / loss</div>
                  <div className="num" style={{ fontWeight: 700, color: gain >= 0 ? "#2F6B4F" : "#9C4221" }}>
                    {gain >= 0 ? "+" : ""}${gain.toFixed(2)} ({gainPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
              {h.symbol ? (
                <div style={{ fontSize: 11, color: "#B0A88E", marginTop: 8 }}>
                  Auto-updated daily from live {h.symbol} pricing. Last checked: {h.history.length ? new Date(h.history[h.history.length - 1].date).toLocaleString() : "not yet"}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#B0A88E", marginTop: 8 }}>
                  No symbol set — update this value manually whenever you check it.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
