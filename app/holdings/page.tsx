"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HoldingsAccountsPage() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
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
      body: JSON.stringify({ name, account: account || null, symbol: symbol || null, amount: amt, date: new Date().toISOString() }),
    });
    setName(""); setAccount(""); setSymbol(""); setAmount(""); setShowAdd(false);
    load();
  };

  const groups: Record<string, any[]> = {};
  holdings.forEach((h) => {
    const key = h.account || "Unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(h);
  });

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Holdings</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Set money aside for different things — a down payment, a child's wedding fund, anything — each as its own "account."
        Tap an account to see what's in it.
      </p>

      <div className="card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Total across all accounts</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 700, color: "#0F3D2E" }}>${totalValue.toFixed(2)}</div>
        </div>
        <button className="btn" onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Cancel" : "+ Add holding"}</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. S&P 500 ETF" style={{ flex: 2, minWidth: 160 }} />
          <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Account, e.g. Down Payment" style={{ flex: 2, minWidth: 180 }} />
          <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol (optional)" style={{ width: 140 }} />
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 120 }} />
          <button className="btn" onClick={add}>Save</button>
        </div>
      )}

      {holdings.length === 0 ? (
        <div className="card" style={{ color: "#8A8370" }}>No holdings yet — add one above.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {Object.entries(groups).map(([acct, list]) => {
            const subtotal = list.reduce((s, h) => s + h.currentValue, 0);
            return (
              <Link key={acct} href={`/holdings/${encodeURIComponent(acct)}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card clickable" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0F3D2E" }}>{acct}</div>
                    <div style={{ fontSize: 12, color: "#8A8370" }}>{list.length} holding{list.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>${subtotal.toFixed(2)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
