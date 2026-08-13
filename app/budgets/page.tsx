"use client";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");

  const load = () => {
    fetch("/api/budgets").then((r) => r.json()).then(setBudgets);
    fetch("/api/transactions").then((r) => r.json()).then(setTxns);
  };
  useEffect(() => { load(); }, []);

  const spentThisMonth = (cat: string) => {
    const now = new Date();
    const ym = now.toISOString().slice(0, 7);
    return txns.filter((t) => t.type === "expense" && t.category === cat && t.date.slice(0, 7) === ym)
      .reduce((s: number, t: any) => s + t.amount, 0);
  };

  const add = async () => {
    if (!category.trim() || !limit) return;
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, limit: parseFloat(limit) }),
    });
    setCategory(""); setLimit("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Nav />
      <h1 style={{ color: "#0F3D2E" }}>Budgets</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Account, e.g. Groceries" style={{ flex: 2, minWidth: 160 }} />
        <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Monthly limit" style={{ width: 140 }} />
        <button className="btn" onClick={add}>Set budget</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {budgets.map((b) => {
          const spent = spentThisMonth(b.category);
          const pct = Math.min(100, (spent / b.limit) * 100);
          const over = spent > b.limit;
          return (
            <div className="card" key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{b.category}</span>
                <div>
                  <span className="num" style={{ color: over ? "#9C4221" : "#5B7B7A" }}>${spent.toFixed(2)} / ${b.limit.toFixed(2)}</span>
                  <button onClick={() => remove(b.id)} style={{ border: "none", background: "none", color: "#B0A88E", marginLeft: 10 }}>✕</button>
                </div>
              </div>
              <div style={{ height: 8, background: "#EFEADC", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: over ? "#9C4221" : "#B8863E" }} />
              </div>
            </div>
          );
        })}
        {budgets.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No budgets yet.</div>}
      </div>
    </main>
  );
}
