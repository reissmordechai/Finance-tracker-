"use client";
import { useEffect, useState } from "react";

function payoffMonths(balance: number, apr: number, payment: number): { months: number; totalInterest: number } | null {
  const monthlyRate = apr / 100 / 12;
  if (payment <= balance * monthlyRate) return null; // payment too small, never pays off
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  while (bal > 0 && months < 600) {
    const interest = bal * monthlyRate;
    totalInterest += interest;
    bal = bal + interest - payment;
    months++;
  }
  return { months, totalInterest };
}

export default function CardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [apr, setApr] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccount, setPayAccount] = useState("");
  const [plannerId, setPlannerId] = useState<string | null>(null);
  const [plannerPayment, setPlannerPayment] = useState("");
  const [plannerApr, setPlannerApr] = useState("");

  const load = () => {
    fetch("/api/cards").then((r) => r.json()).then(setCards);
    fetch("/api/bankaccounts").then((r) => r.json()).then(setAccounts);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, limit: parseFloat(limit) || 0, dueDay: parseInt(dueDay) || null, apr: apr ? parseFloat(apr) : null }),
    });
    setName(""); setLimit(""); setDueDay(""); setApr("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    load();
  };

  const pay = async (id: string) => {
    const amt = parseFloat(payAmount);
    if (!amt) return;
    await fetch(`/api/cards/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date().toISOString(), amount: amt, fromAccountId: payAccount || null }),
    });
    setPayAmount(""); setPayingId(null);
    load();
  };

  const openPlanner = (c: any) => {
    setPlannerId(plannerId === c.id ? null : c.id);
    setPlannerApr(String(c.apr ?? ""));
    setPlannerPayment("");
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Cards</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Card name" style={{ flex: 2, minWidth: 140 }} />
        <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Limit" style={{ width: 100 }} />
        <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Due day" style={{ width: 90 }} />
        <input type="number" step="0.1" value={apr} onChange={(e) => setApr(e.target.value)} placeholder="APR % (optional)" style={{ width: 130 }} />
        <button className="btn" onClick={add}>Add card</button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {cards.map((c) => {
          const planResult = plannerId === c.id && plannerPayment && plannerApr
            ? payoffMonths(c.amountDue, parseFloat(plannerApr), parseFloat(plannerPayment))
            : null;
          return (
            <div className="card" key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>{c.name} {c.amountDue === 0 && <span style={{ fontSize: 12, color: "#2F6B4F" }}>🎉 Paid off!</span>}</div>
                <button onClick={() => remove(c.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
                <div><div style={{ fontSize: 11, color: "#8A8370" }}>Limit</div><div className="num">${c.limit.toFixed(2)}</div></div>
                <div><div style={{ fontSize: 11, color: "#8A8370" }}>Due day</div><div className="num">{c.dueDay || "—"}</div></div>
                <div><div style={{ fontSize: 11, color: "#8A8370" }}>Amount due</div><div className="num" style={{ fontWeight: 700, color: c.amountDue > 0 ? "#9C4221" : "#0F3D2E" }}>${c.amountDue.toFixed(2)}</div></div>
                {c.apr != null && <div><div style={{ fontSize: 11, color: "#8A8370" }}>APR</div><div className="num">{c.apr}%</div></div>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn-outline" onClick={() => setPayingId(payingId === c.id ? null : c.id)}>
                  {payingId === c.id ? "Cancel" : "Pay card"}
                </button>
                {c.amountDue > 0 && (
                  <button className="btn-outline" onClick={() => openPlanner(c)}>
                    {plannerId === c.id ? "Cancel" : "Payoff planner"}
                  </button>
                )}
              </div>
              {payingId === c.id && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
                  <select value={payAccount} onChange={(e) => setPayAccount(e.target.value)} style={{ width: 160 }}>
                    <option value="">From account (optional)</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <button className="btn" onClick={() => pay(c.id)}>Record payment</button>
                </div>
              )}
              {plannerId === c.id && (
                <div style={{ marginTop: 10, background: "#FBF9F2", border: "1px solid #E4DEC9", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#8A8370" }}>APR %</label>
                      <input type="number" step="0.1" value={plannerApr} onChange={(e) => setPlannerApr(e.target.value)} style={{ width: 100, display: "block" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#8A8370" }}>Monthly payment</label>
                      <input type="number" value={plannerPayment} onChange={(e) => setPlannerPayment(e.target.value)} style={{ width: 130, display: "block" }} />
                    </div>
                  </div>
                  {plannerPayment && plannerApr && (
                    planResult ? (
                      <div style={{ marginTop: 10, fontSize: 13 }}>
                        Paid off in <strong>{planResult.months} month{planResult.months !== 1 ? "s" : ""}</strong> (~{(planResult.months / 12).toFixed(1)} years), paying about <strong className="num">${planResult.totalInterest.toFixed(2)}</strong> in interest.
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, fontSize: 13, color: "#9C4221" }}>That payment won't even cover the monthly interest — try a higher amount.</div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
        {cards.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No cards yet — add one above.</div>}
      </div>
    </main>
  );
}
