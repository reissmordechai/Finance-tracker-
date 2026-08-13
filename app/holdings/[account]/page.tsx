"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "../../components/Nav";

export default function AccountDetailPage() {
  const params = useParams();
  const accountName = decodeURIComponent(params.account as string);
  const isUnassigned = accountName === "Unassigned";

  const [holdings, setHoldings] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");

  const load = () => fetch("/api/holdings").then((r) => r.json()).then((all: any[]) => {
    setHoldings(all.filter((h) => (h.account || "Unassigned") === accountName));
  });
  useEffect(() => { load(); }, [accountName]);

  const add = async () => {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt) return;
    await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, account: isUnassigned ? null : accountName, symbol: symbol || null, amount: amt, date: new Date().toISOString() }),
    });
    setName(""); setSymbol(""); setAmount(""); setShowAdd(false);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    load();
  };

  const total = holdings.reduce((s, h) => s + h.currentValue, 0);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Nav />
      <Link href="/holdings" style={{ color: "#B8863E", fontSize: 13 }}>&larr; All accounts</Link>
      <h1 style={{ color: "#0F3D2E" }}>{accountName}</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Total in this account</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 700, color: "#0F3D2E" }}>${total.toFixed(2)}</div>
        </div>
        <button className="btn" onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Cancel" : "+ Add here"}</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. S&P 500 ETF" style={{ flex: 2, minWidth: 160 }} />
          <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol (optional)" style={{ width: 140 }} />
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 120 }} />
          <button className="btn" onClick={add}>Save</button>
        </div>
      )}

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
                <div style={{ fontSize: 11, color: "#B0A88E", marginTop: 8 }}>No symbol set — update manually.</div>
              )}
            </div>
          );
        })}
        {holdings.length === 0 && <div className="card" style={{ color: "#8A8370" }}>Nothing in this account yet.</div>}
      </div>
    </main>
  );
}
