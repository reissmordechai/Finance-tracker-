"use client";
import { useEffect, useState } from "react";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";
import ConfirmSaveButton from "../components/ConfirmSaveButton";

function payoffMonths(balance: number, apr: number, payment: number): { months: number; totalInterest: number } | null {
  const monthlyRate = apr / 100 / 12;
  if (payment <= balance * monthlyRate) return null;
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

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [balance, setBalance] = useState("");
  const [apr, setApr] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [plannerId, setPlannerId] = useState<string | null>(null);
  const [plannerPayment, setPlannerPayment] = useState("");
  const [editingDetailsId, setEditingDetailsId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editApr, setEditApr] = useState("");
  const [editMinPayment, setEditMinPayment] = useState("");
  const [editDueDay, setEditDueDay] = useState("");

  const load = () => fetch("/api/loans").then((r) => r.json()).then(setLoans);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim() || !balance) return;
    await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, principal: parseFloat(principal) || parseFloat(balance), balance: parseFloat(balance), apr: apr || null, minPayment: minPayment || null, dueDay: dueDay || null }),
    });
    setName(""); setPrincipal(""); setBalance(""); setApr(""); setMinPayment(""); setDueDay("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/loans/${id}`, { method: "DELETE" });
    load();
  };

  const saveBalance = async (id: string) => {
    await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: parseFloat(editBalance) || 0 }),
    });
    setEditingId(null);
    load();
  };

  const startEditDetails = (l: any) => {
    setEditingDetailsId(l.id);
    setEditName(l.name);
    setEditApr(l.apr != null ? String(l.apr) : "");
    setEditMinPayment(l.minPayment != null ? String(l.minPayment) : "");
    setEditDueDay(l.dueDay != null ? String(l.dueDay) : "");
  };
  const saveDetails = async (id: string) => {
    await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        apr: editApr ? parseFloat(editApr) : null,
        minPayment: editMinPayment ? parseFloat(editMinPayment) : null,
        dueDay: editDueDay ? parseInt(editDueDay) : null,
      }),
    });
    setEditingDetailsId(null);
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Loans</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>Mortgages, car loans, student loans — anything with a balance and a payoff timeline.</p>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Car loan" style={{ flex: 2, minWidth: 140 }} />
        <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Current balance" style={{ width: 130 }} />
        <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="Original amount (optional)" style={{ width: 160 }} />
        <input type="number" step="0.1" value={apr} onChange={(e) => setApr(e.target.value)} placeholder="APR % (optional)" style={{ width: 130 }} />
        <input type="number" value={minPayment} onChange={(e) => setMinPayment(e.target.value)} placeholder="Min payment (optional)" style={{ width: 150 }} />
        <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Due day (optional)" style={{ width: 130 }} />
        <button className="btn" onClick={add}>Add loan</button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {loans.map((l) => {
          const paidOff = l.principal ? ((l.principal - l.balance) / l.principal) * 100 : 0;
          const planResult = plannerId === l.id && plannerPayment && l.apr ? payoffMonths(l.balance, l.apr, parseFloat(plannerPayment)) : null;
          return (
            <div className="card" key={l.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>{l.name} {l.balance === 0 && <span style={{ fontSize: 12, color: "#2F6B4F" }}>🎉 Paid off!</span>}</div>
                <ConfirmDeleteButton onConfirm={() => remove(l.id)} />
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8A8370" }}>Balance</div>
                  {editingId === l.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input type="number" autoFocus value={editBalance} onChange={(e) => setEditBalance(e.target.value)} style={{ width: 100 }} onKeyDown={(e) => e.key === "Enter" && saveBalance(l.id)} />
                      <ConfirmSaveButton onConfirm={() => saveBalance(l.id)} />
                    </div>
                  ) : (
                    <button className="btn-outline" onClick={() => { setEditingId(l.id); setEditBalance(String(l.balance)); }} style={{ padding: "4px 10px", fontSize: 12 }}>
                      <span className="num">${l.balance.toFixed(2)}</span>
                    </button>
                  )}
                </div>
                {l.apr != null && <div><div style={{ fontSize: 11, color: "#8A8370" }}>APR</div><div className="num">{l.apr}%</div></div>}
                {l.minPayment != null && <div><div style={{ fontSize: 11, color: "#8A8370" }}>Min payment</div><div className="num">${l.minPayment.toFixed(2)}</div></div>}
                {l.dueDay != null && <div><div style={{ fontSize: 11, color: "#8A8370" }}>Due day</div><div className="num">{l.dueDay}</div></div>}
              </div>
              {l.principal > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 8, background: "#EFEADC", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, paidOff))}%`, height: "100%", background: "#2F6B4F" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#8A8370", marginTop: 4 }}>{paidOff.toFixed(0)}% paid off</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {l.apr != null && (
                  <button className="btn-outline" onClick={() => { setPlannerId(plannerId === l.id ? null : l.id); setPlannerPayment(""); }}>
                    {plannerId === l.id ? "Cancel" : "Payoff planner"}
                  </button>
                )}
                <button className="btn-outline" onClick={() => editingDetailsId === l.id ? setEditingDetailsId(null) : startEditDetails(l)}>
                  {editingDetailsId === l.id ? "Cancel edit" : "Edit details"}
                </button>
              </div>
              {editingDetailsId === l.id && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" style={{ flex: 2, minWidth: 140 }} />
                  <input type="number" step="0.1" value={editApr} onChange={(e) => setEditApr(e.target.value)} placeholder="APR %" style={{ width: 100 }} />
                  <input type="number" value={editMinPayment} onChange={(e) => setEditMinPayment(e.target.value)} placeholder="Min payment" style={{ width: 130 }} />
                  <input type="number" value={editDueDay} onChange={(e) => setEditDueDay(e.target.value)} placeholder="Due day" style={{ width: 100 }} />
                  <ConfirmSaveButton onConfirm={() => saveDetails(l.id)} />
                </div>
              )}
              {plannerId === l.id && (
                <div style={{ marginTop: 10, background: "#FBF9F2", border: "1px solid #E4DEC9", borderRadius: 8, padding: 12 }}>
                  <label style={{ fontSize: 11, color: "#8A8370" }}>Monthly payment</label>
                  <input type="number" value={plannerPayment} onChange={(e) => setPlannerPayment(e.target.value)} style={{ width: 140, display: "block" }} />
                  {plannerPayment && (
                    planResult ? (
                      <div style={{ marginTop: 10, fontSize: 13 }}>
                        Paid off in <strong>{planResult.months} month{planResult.months !== 1 ? "s" : ""}</strong> (~{(planResult.months / 12).toFixed(1)} years), about <strong className="num">${planResult.totalInterest.toFixed(2)}</strong> in interest.
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, fontSize: 13, color: "#9C4221" }}>That payment won't cover the monthly interest — try a higher amount.</div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
        {loans.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No loans yet — add one above.</div>}
      </div>
    </main>
  );
}
