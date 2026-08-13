"use client";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [groupByAccount, setGroupByAccount] = useState(true);

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
    setName(""); setAccount(""); setSymbol(""); setAmount("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    load();
  };

  // Group holdings by account label (holdings with no account go under "Unassigned")
  const groups: Record<string, any[]> = {};
  holdings.forEach((h) => {
    const key = h.account || "Unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(h);
  });

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);

  const renderHolding = (h: any) => {
    const invested = h.entries.reduce((s: number, e: any) => s + e.amount, 0);
    const gain = h.currentValue - invested;
    const gainPct = invested ? (gain / invested) * 100 : 0;
    return (
      <div className="card" key={h.id}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>
            {h.name} {h.symbol && <span style={{ fontSize: 11, color: "#8A8370" }}>({h.symbol})</span>}
            {h.account && <div style={{ fontSize: 11, color: "#B8863E", fontWeight: 500 }}>{h.account}</div>}
          </div>
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
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Nav />
      <h1 style={{ color: "#0F3D2E" }}>Holdings</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Add a symbol (like <code>VOO</code> for an S&amp;P 500 ETF) and the daily cron job will keep the value current on its own.
        Use "Account" to track the same fund separately across different accounts — like two Fidelity accounts both holding the S&amp;P 500.
      </p>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. S&P 500 ETF" style={{ flex: 2, minWidth: 160 }} />
        <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Account (optional), e.g. Fidelity IRA" style={{ flex: 2, minWidth: 180 }} />
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol (optional), e.g. VOO" style={{ width: 160 }} />
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount invested" style={{ width: 140 }} />
        <button className="btn" onClick={add}>Add holding</button>
      </div>

      <div className="card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Total across all accounts</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#0F3D2E" }}>${totalValue.toFixed(2)}</div>
        </div>
        <button className="btn-outline" onClick={() => setGroupByAccount((g) => !g)}>
          {groupByAccount ? "Show as one list" : "Group by account"}
        </button>
      </div>

      {holdings.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No holdings yet — add one above.</div>}

      {groupByAccount ? (
        Object.entries(groups).map(([acct, list]) => {
          const subtotal = list.reduce((s, h) => s + h.currentValue, 0);
          return (
            <div key={acct} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: "#0F3D2E" }}>{acct}</div>
                <div className="num" style={{ color: "#5B7B7A", fontSize: 13 }}>${subtotal.toFixed(2)}</div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {list.map(renderHolding)}
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {holdings.map(renderHolding)}
        </div>
      )}
    </main>
  );
}
