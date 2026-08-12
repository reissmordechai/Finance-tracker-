"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TransactionsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Groceries");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = () => fetch("/api/transactions").then((r) => r.json()).then(setTxns);
  useEffect(() => { load(); }, []);

  const add = async () => {
    const amt = parseFloat(amount);
    if (!amt) return;
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, category, amount: amt, date }),
    });
    setAmount("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Link href="/" style={{ color: "#B8863E", fontSize: 13 }}>&larr; Dashboard</Link>
      <h1 style={{ color: "#0F3D2E" }}>Transactions</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 110 }}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Account" style={{ width: 140 }} />
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 150 }} />
        <button className="btn" onClick={add}>Add</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {txns.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #EFEADC" }}>
            <div>
              <div>{t.category}</div>
              <div style={{ fontSize: 11, color: "#8A8370" }}>{t.date.slice(0, 10)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="num" style={{ color: t.type === "income" ? "#2F6B4F" : "#9C4221", fontWeight: 600 }}>
                {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
              </span>
              <button onClick={() => remove(t.id)} style={{ border: "none", background: "none", color: "#B0A88E", cursor: "pointer" }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
