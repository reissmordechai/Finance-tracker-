"use client";
import { useEffect, useState } from "react";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";
import ConfirmSaveButton from "../components/ConfirmSaveButton";

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
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [dueDay, setDueDay] = useState("");
  const [statementDay, setStatementDay] = useState("");
  const [apr, setApr] = useState("");
  const [autoPay, setAutoPay] = useState(false);
  const [autoPayDay, setAutoPayDay] = useState("");
  const [autoPayAccountId, setAutoPayAccountId] = useState("");
  const [autoPayType, setAutoPayType] = useState("statement");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccount, setPayAccount] = useState("");
  const [plannerId, setPlannerId] = useState<string | null>(null);
  const [plannerPayment, setPlannerPayment] = useState("");
  const [plannerApr, setPlannerApr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editDueDay, setEditDueDay] = useState("");
  const [editStatementDay, setEditStatementDay] = useState("");
  const [editApr, setEditApr] = useState("");
  const [editCurrencyCode, setEditCurrencyCode] = useState("USD");
  const [editAutoPay, setEditAutoPay] = useState(false);
  const [editAutoPayDay, setEditAutoPayDay] = useState("");
  const [editAutoPayAccountId, setEditAutoPayAccountId] = useState("");
  const [editAutoPayType, setEditAutoPayType] = useState("statement");

  const load = () => {
    fetch("/api/cards").then((r) => r.json()).then(setCards);
    fetch("/api/bankaccounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/settings/general").then((r) => r.json()).then((d) => {
      setBaseCurrency(d.baseCurrencyCode || "USD");
      setCurrencyCode(d.baseCurrencyCode || "USD");
    });
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, limit: parseFloat(limit) || 0, currencyCode,
        dueDay: parseInt(dueDay) || null, statementDay: parseInt(statementDay) || null, apr: apr ? parseFloat(apr) : null,
        autoPay, autoPayDay: autoPayDay ? parseInt(autoPayDay) : null, autoPayAccountId: autoPayAccountId || null, autoPayType,
      }),
    });
    setName(""); setLimit(""); setDueDay(""); setStatementDay(""); setApr("");
    setAutoPay(false); setAutoPayDay(""); setAutoPayAccountId(""); setAutoPayType("statement");
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

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditLimit(String(c.limit));
    setEditCurrencyCode(c.currencyCode || "USD");
    setEditDueDay(c.dueDay != null ? String(c.dueDay) : "");
    setEditStatementDay(c.statementDay != null ? String(c.statementDay) : "");
    setEditApr(c.apr != null ? String(c.apr) : "");
    setEditAutoPay(!!c.autoPay);
    setEditAutoPayDay(c.autoPayDay != null ? String(c.autoPayDay) : "");
    setEditAutoPayAccountId(c.autoPayAccountId || "");
    setEditAutoPayType(c.autoPayType || "statement");
  };
  const saveEdit = async (id: string) => {
    await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        limit: parseFloat(editLimit) || 0,
        currencyCode: editCurrencyCode,
        dueDay: editDueDay ? parseInt(editDueDay) : null,
        statementDay: editStatementDay ? parseInt(editStatementDay) : null,
        apr: editApr ? parseFloat(editApr) : null,
        autoPay: editAutoPay,
        autoPayDay: editAutoPayDay ? parseInt(editAutoPayDay) : null,
        autoPayAccountId: editAutoPayAccountId || null,
        autoPayType: editAutoPayType,
      }),
    });
    setEditingId(null);
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Cards</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Card name" style={{ flex: 2, minWidth: 140 }} />
        <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Limit" style={{ width: 100 }} />
        <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} style={{ width: 90 }}>
          {Array.from(new Set([baseCurrency, "USD", "EUR", "GBP", "ILS", "CAD"])).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div>
          <label style={{ fontSize: 11, color: "#8A8370" }}>Statement day</label>
          <input type="number" value={statementDay} onChange={(e) => setStatementDay(e.target.value)} placeholder="e.g. 5" style={{ width: 110, display: "block" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#8A8370" }}>Due day</label>
          <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="e.g. 25" style={{ width: 90, display: "block" }} />
        </div>
        <input type="number" step="0.1" value={apr} onChange={(e) => setApr(e.target.value)} placeholder="APR % (optional)" style={{ width: 130 }} />
        <button className="btn" onClick={add} style={{ alignSelf: "flex-end" }}>Add card</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
          <input type="checkbox" checked={autoPay} onChange={(e) => setAutoPay(e.target.checked)} style={{ width: "auto" }} />
          New card is paid automatically
        </label>
        {autoPay && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 11, color: "#8A8370" }}>Auto-pay day</label>
              <input type="number" value={autoPayDay} onChange={(e) => setAutoPayDay(e.target.value)} placeholder="e.g. 25" style={{ width: 100, display: "block" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#8A8370" }}>From account</label>
              <select value={autoPayAccountId} onChange={(e) => setAutoPayAccountId(e.target.value)} style={{ width: 160, display: "block" }}>
                <option value="">Choose account…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#8A8370" }}>Amount paid</label>
              <select value={autoPayType} onChange={(e) => setAutoPayType(e.target.value)} style={{ width: 160, display: "block" }}>
                <option value="full">Full balance</option>
                <option value="statement">Statement balance only</option>
              </select>
            </div>
          </div>
        )}
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
                <ConfirmDeleteButton onConfirm={() => remove(c.id)} />
              </div>
              {editingId === c.id ? (
                <div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Card name" style={{ flex: 2, minWidth: 140 }} />
                    <input type="number" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} placeholder="Limit" style={{ width: 100 }} />
                    <select value={editCurrencyCode} onChange={(e) => setEditCurrencyCode(e.target.value)} style={{ width: 90 }}>
                      {Array.from(new Set([baseCurrency, editCurrencyCode, "USD", "EUR", "GBP", "ILS", "CAD"])).map((cc) => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                    <div>
                      <label style={{ fontSize: 11, color: "#8A8370" }}>Statement day</label>
                      <input type="number" value={editStatementDay} onChange={(e) => setEditStatementDay(e.target.value)} style={{ width: 100, display: "block" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#8A8370" }}>Due day</label>
                      <input type="number" value={editDueDay} onChange={(e) => setEditDueDay(e.target.value)} style={{ width: 90, display: "block" }} />
                    </div>
                    <input type="number" step="0.1" value={editApr} onChange={(e) => setEditApr(e.target.value)} placeholder="APR %" style={{ width: 100 }} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer", marginTop: 10 }}>
                    <input type="checkbox" checked={editAutoPay} onChange={(e) => setEditAutoPay(e.target.checked)} style={{ width: "auto" }} />
                    Paid automatically
                  </label>
                  {editAutoPay && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#8A8370" }}>Auto-pay day</label>
                        <input type="number" value={editAutoPayDay} onChange={(e) => setEditAutoPayDay(e.target.value)} style={{ width: 100, display: "block" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#8A8370" }}>From account</label>
                        <select value={editAutoPayAccountId} onChange={(e) => setEditAutoPayAccountId(e.target.value)} style={{ width: 160, display: "block" }}>
                          <option value="">Choose account…</option>
                          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#8A8370" }}>Amount paid</label>
                        <select value={editAutoPayType} onChange={(e) => setEditAutoPayType(e.target.value)} style={{ width: 160, display: "block" }}>
                          <option value="full">Full balance</option>
                          <option value="statement">Statement balance only</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <ConfirmSaveButton onConfirm={() => saveEdit(c.id)} />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
                    <div><div style={{ fontSize: 11, color: "#8A8370" }}>Limit</div><div className="num">{c.limit.toFixed(2)} {c.currencyCode || "USD"}</div></div>
                    <div><div style={{ fontSize: 11, color: "#8A8370" }}>Statement day</div><div className="num">{c.statementDay || "—"}</div></div>
                    <div><div style={{ fontSize: 11, color: "#8A8370" }}>Due day</div><div className="num">{c.dueDay || "—"}</div></div>
                    <div><div style={{ fontSize: 11, color: "#8A8370" }}>Amount due</div><div className="num" style={{ fontWeight: 700, color: c.amountDue > 0 ? "#9C4221" : "#0F3D2E" }}>${c.amountDue.toFixed(2)}</div></div>
                    {c.apr != null && <div><div style={{ fontSize: 11, color: "#8A8370" }}>APR</div><div className="num">{c.apr}%</div></div>}
                  </div>
                  {c.limit > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {(() => {
                        const pct = Math.min(100, (c.amountDue / c.limit) * 100);
                        const color = pct >= 80 ? "#9C4221" : pct >= 50 ? "#B8863E" : "#2F6B4F";
                        return (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A8370", marginBottom: 3 }}>
                              <span>Credit used</span>
                              <span className="num" style={{ color, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                            </div>
                            <div style={{ height: 6, background: "#EFEADC", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: color }} />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {c.autoPay && (
                    <div style={{ fontSize: 11.5, color: "#5B7B7A", marginTop: 6 }}>
                      ✓ Auto-pay {c.autoPayType === "full" ? "full balance" : "statement balance"} on day {c.autoPayDay || "—"}
                      {c.autoPayAccountId && ` from ${accounts.find((a) => a.id === c.autoPayAccountId)?.name || "an account"}`}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn-outline" onClick={() => setPayingId(payingId === c.id ? null : c.id)}>
                  {payingId === c.id ? "Cancel" : "Pay card"}
                </button>
                {c.amountDue > 0 && (
                  <button className="btn-outline" onClick={() => openPlanner(c)}>
                    {plannerId === c.id ? "Cancel" : "Payoff planner"}
                  </button>
                )}
                <button className="btn-outline" onClick={() => editingId === c.id ? setEditingId(null) : startEdit(c)}>
                  {editingId === c.id ? "Cancel edit" : "Edit"}
                </button>
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
