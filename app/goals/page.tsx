"use client";
import { useEffect, useState } from "react";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const load = () => fetch("/api/goals").then((r) => r.json()).then(setGoals);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim() || !target) return;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetAmount: parseFloat(target) }),
    });
    setName(""); setTarget("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    load();
  };

  const addFunds = async (id: string) => {
    const amt = parseFloat(fundAmount);
    if (!amt) return;
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addFunds", amount: amt }),
    });
    setFundAmount(""); setFundingId(null);
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Goals</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name" style={{ flex: 2, minWidth: 160 }} />
        <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target amount" style={{ width: 140 }} />
        <button className="btn" onClick={add}>New goal</button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {goals.map((g) => {
          const pct = Math.min(100, (g.savedAmount / g.targetAmount) * 100);
          const reached = g.savedAmount >= g.targetAmount;
          return (
            <div className="card" key={g.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{g.name} {reached && "🎉"}</span>
                <button onClick={() => remove(g.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
              </div>
              <div className="num" style={{ marginTop: 6, fontSize: 13 }}>${g.savedAmount.toFixed(2)} of ${g.targetAmount.toFixed(2)}</div>
              <div style={{ height: 8, background: "#EFEADC", borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: reached ? "#2F6B4F" : "#B8863E" }} />
              </div>
              <button className="btn-outline" style={{ marginTop: 10 }} onClick={() => setFundingId(fundingId === g.id ? null : g.id)}>
                {fundingId === g.id ? "Cancel" : "Add funds"}
              </button>
              {fundingId === g.id && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="Amount" style={{ width: 120 }} />
                  <button className="btn" onClick={() => addFunds(g.id)}>Add</button>
                </div>
              )}
            </div>
          );
        })}
        {goals.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No goals yet.</div>}
      </div>
    </main>
  );
}
