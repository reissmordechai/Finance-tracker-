"use client";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";

export default function ReportsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { fetch("/api/transactions").then((r) => r.json()).then(setTxns); }, []);

  const monthTxns = txns.filter((t) => t.date.slice(0, 7) === month);
  const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, number> = {};
  monthTxns.filter((t) => t.type === "expense").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Nav />
      <h1 style={{ color: "#0F3D2E" }}>Reports</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Income</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#2F6B4F" }}>${income.toFixed(2)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Expenses</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#9C4221" }}>${expense.toFixed(2)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Net</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>${(income - expense).toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Spending by account</div>
        {sorted.length === 0 ? (
          <div style={{ color: "#8A8370" }}>Nothing this month.</div>
        ) : (
          sorted.map(([cat, amt]) => (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
              <span>{cat}</span>
              <span className="num" style={{ fontWeight: 600 }}>${amt.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
