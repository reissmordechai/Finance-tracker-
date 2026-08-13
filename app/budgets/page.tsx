"use client";
import { useEffect, useState } from "react";

function monthKey(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [rollover, setRollover] = useState(false);

  const load = () => {
    fetch("/api/budgets").then((r) => r.json()).then(setBudgets);
    fetch("/api/transactions").then((r) => r.json()).then(setTxns);
  };
  useEffect(() => { load(); }, []);

  const spentInMonth = (cat: string, ym: string) =>
    txns.filter((t) => t.type === "expense" && t.category === cat && t.date.slice(0, 7) === ym)
      .reduce((s: number, t: any) => s + t.amount, 0);

  const add = async () => {
    if (!category.trim() || !limit) return;
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, limit: parseFloat(limit), rollover }),
    });
    setCategory(""); setLimit(""); setRollover(false);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Budgets</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Account, e.g. Groceries" style={{ flex: 2, minWidth: 160 }} />
          <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Monthly limit" style={{ width: 140 }} />
          <button className="btn" onClick={add}>Set budget</button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={rollover} onChange={(e) => setRollover(e.target.checked)} style={{ width: "auto" }} />
          Roll over unused budget into next month
        </label>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {budgets.map((b) => {
          const thisMonth = monthKey(0);
          const lastMonth = monthKey(-1);
          const spent = spentInMonth(b.category, thisMonth);
          let effectiveLimit = b.limit;
          let rolledOver = 0;
          if (b.rollover) {
            const prevSpent = spentInMonth(b.category, lastMonth);
            rolledOver = Math.max(0, b.limit - prevSpent);
            effectiveLimit = b.limit + rolledOver;
          }
          const pct = Math.min(100, (spent / effectiveLimit) * 100);
          const over = spent > effectiveLimit;
          return (
            <div className="card" key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{b.category}{b.rollover && <span className="pill" style={{ marginLeft: 6 }}>rollover</span>}</span>
                <div>
                  <span className="num" style={{ color: over ? "#9C4221" : "#5B7B7A" }}>${spent.toFixed(2)} / ${effectiveLimit.toFixed(2)}</span>
                  <button onClick={() => remove(b.id)} style={{ border: "none", background: "none", color: "#B0A88E", marginLeft: 10 }}>✕</button>
                </div>
              </div>
              <div style={{ height: 8, background: "#EFEADC", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: over ? "#9C4221" : "#B8863E" }} />
              </div>
              {rolledOver > 0 && <div style={{ fontSize: 11, color: "#B0A88E", marginTop: 6 }}>+${rolledOver.toFixed(2)} carried over from last month</div>}
            </div>
          );
        })}
        {budgets.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No budgets yet.</div>}
      </div>
    </main>
  );
}
