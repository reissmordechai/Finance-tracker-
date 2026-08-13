"use client";
import { useEffect, useState } from "react";

export default function TransactionsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Groceries");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // filters
  const [fCategory, setFCategory] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fMinAmount, setFMinAmount] = useState("");
  const [fMaxAmount, setFMaxAmount] = useState("");

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

  const filtered = txns.filter((t) => {
    if (fCategory && !t.category.toLowerCase().includes(fCategory.toLowerCase())) return false;
    if (fFrom && t.date.slice(0, 10) < fFrom) return false;
    if (fTo && t.date.slice(0, 10) > fTo) return false;
    if (fMinAmount && t.amount < parseFloat(fMinAmount)) return false;
    if (fMaxAmount && t.amount > parseFloat(fMaxAmount)) return false;
    return true;
  });

  const clearFilters = () => { setFCategory(""); setFFrom(""); setFTo(""); setFMinAmount(""); setFMaxAmount(""); };
  const filtersActive = fCategory || fFrom || fTo || fMinAmount || fMaxAmount;

  return (
    <main className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: "#0F3D2E" }}>Transactions</h1>
        <a href="/api/export" className="btn-outline" style={{ textDecoration: "none", height: "fit-content" }}>Export CSV</a>
      </div>

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

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Search &amp; filter</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={fCategory} onChange={(e) => setFCategory(e.target.value)} placeholder="Account contains…" style={{ flex: 1, minWidth: 140 }} />
          <div>
            <label style={{ fontSize: 11, color: "#8A8370" }}>From</label>
            <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={{ width: 150, display: "block" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8370" }}>To</label>
            <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} style={{ width: 150, display: "block" }} />
          </div>
          <input type="number" value={fMinAmount} onChange={(e) => setFMinAmount(e.target.value)} placeholder="Min $" style={{ width: 90 }} />
          <input type="number" value={fMaxAmount} onChange={(e) => setFMaxAmount(e.target.value)} placeholder="Max $" style={{ width: 90 }} />
          {filtersActive && <button className="btn-outline" onClick={clearFilters}>Clear</button>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#8A8370", marginBottom: 6 }}>{filtered.length} of {txns.length} transactions</div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.map((t) => (
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
        {filtered.length === 0 && <div style={{ padding: 14, color: "#8A8370" }}>No transactions match.</div>}
      </div>
    </main>
  );
}
