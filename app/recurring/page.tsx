"use client";
import { useEffect, useState } from "react";

function countRemaining(startDate: string, endDate: string | null, frequency: string, lastGenerated: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  let cursor = lastGenerated ? new Date(lastGenerated) : new Date(startDate);
  const advance = (d: Date) => {
    const nd = new Date(d.getTime());
    if (frequency === "weekly") nd.setDate(nd.getDate() + 7);
    else if (frequency === "yearly") nd.setFullYear(nd.getFullYear() + 1);
    else nd.setMonth(nd.getMonth() + 1);
    return nd;
  };
  if (lastGenerated) cursor = advance(cursor);
  let count = 0;
  let guard = 0;
  while (cursor <= end && guard < 1000) { count++; cursor = advance(cursor); guard++; }
  return count;
}

export default function RecurringPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [postTo, setPostTo] = useState("transaction");
  const [holdingId, setHoldingId] = useState("");

  const load = () => fetch("/api/recurring").then((r) => r.json()).then(setRules);
  useEffect(() => {
    load();
    fetch("/api/holdings").then((r) => r.json()).then(setHoldings);
  }, []);

  const add = async () => {
    if (postTo === "holding") {
      if (!holdingId || !amount) return;
    } else if (!category.trim() || !amount) return;
    await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: postTo === "holding" ? "expense" : type,
        category: postTo === "holding" ? (holdings.find((h) => h.id === holdingId)?.name || "Holding") : category,
        amount: parseFloat(amount), frequency, startDate, endDate: endDate || null, postTo, holdingId: holdingId || null,
      }),
    });
    setCategory(""); setAmount(""); setEndDate(""); setHoldingId("");
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
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Recurring Entries</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Rent, subscriptions, regular investing — anything that repeats. A daily automatic check posts these on their own —
        set an end date if it should eventually stop.
      </p>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={postTo} onChange={(e) => setPostTo(e.target.value)} style={{ width: 160 }}>
          <option value="transaction">Post to: Transaction</option>
          <option value="holding">Post to: Holding</option>
        </select>
        {postTo === "transaction" ? (
          <>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 110 }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Account" style={{ width: 140 }} />
          </>
        ) : (
          <select value={holdingId} onChange={(e) => setHoldingId(e.target.value)} style={{ width: 220 }}>
            <option value="">Choose a holding…</option>
            {holdings.map((h) => <option key={h.id} value={h.id}>{h.name}{h.account ? ` (${h.account})` : ""}</option>)}
          </select>
        )}
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ width: 120 }}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <div>
          <label style={{ fontSize: 11, color: "#8A8370" }}>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 150, display: "block" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#8A8370" }}>End date (optional)</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 150, display: "block" }} />
        </div>
        <button className="btn" onClick={add} style={{ alignSelf: "flex-end" }}>Save</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {rules.map((r) => {
          const remaining = countRemaining(r.startDate, r.endDate, r.frequency, r.lastGenerated);
          return (
            <div className="card" key={r.id} style={{ opacity: r.paused ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {r.category} <span style={{ fontSize: 11, color: "#8A8370" }}>({r.frequency}{r.postTo === "holding" ? " · into holding" : ""})</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#8A8370" }}>
                    {r.startDate.slice(0, 10)}{r.endDate ? ` → ${r.endDate.slice(0, 10)}` : " → ongoing"}
                    {r.lastGenerated && ` · last posted ${r.lastGenerated.slice(0, 10)}`}
                    {remaining !== null && ` · ${remaining} payment${remaining !== 1 ? "s" : ""} remaining`}
                  </div>
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
          );
        })}
        {rules.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No recurring entries yet.</div>}
      </div>
    </main>
  );
}
