"use client";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";

export default function RecurringPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const load = () => fetch("/api/recurring").then((r) => r.json()).then(setRules);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!category.trim() || !amount) return;
    await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, category, amount: parseFloat(amount), frequency, startDate }),
    });
    setCategory(""); setAmount("");
    load();
  };

  const togglePause = async (id: string, paused: boolean) => {
    await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !paused }),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Nav />
      <h1 style={{ color: "#0F3D2E" }}>Recurring Entries</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>Rent, subscriptions, and anything else that repeats. Note: automatic posting into Transactions isn't wired up in this version yet — this tracks the schedule for now.</p>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 110 }}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Account" style={{ width: 140 }} />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ width: 120 }}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 150 }} />
        <button className="btn" onClick={add}>Save</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {rules.map((r) => (
          <div className="card" key={r.id} style={{ opacity: r.paused ? 0.6 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.category} <span style={{ fontSize: 11, color: "#8A8370" }}>({r.frequency})</span></div>
                <div style={{ fontSize: 12, color: "#8A8370" }}>Starts {r.startDate.slice(0, 10)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="num" style={{ fontWeight: 700, color: r.type === "income" ? "#2F6B4F" : "#9C4221" }}>
                  {r.type === "income" ? "+" : "-"}${r.amount.toFixed(2)}
                </span>
                <button className="btn-outline" onClick={() => togglePause(r.id, r.paused)}>{r.paused ? "Resume" : "Pause"}</button>
                <button onClick={() => remove(r.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
              </div>
            </div>
          </div>
        ))}
        {rules.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No recurring entries yet.</div>}
      </div>
    </main>
  );
}
