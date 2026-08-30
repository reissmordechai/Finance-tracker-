"use client";
import { useEffect, useState } from "react";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";

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
  const [txns, setTxns] = useState<any[]>([]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [postTo, setPostTo] = useState("transaction");
  const [holdingId, setHoldingId] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewAmount, setReviewAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [addError, setAddError] = useState("");
  const [reviewError, setReviewError] = useState("");

  const load = () => fetch("/api/recurring").then((r) => r.json()).then(setRules);
  useEffect(() => {
    load();
    fetch("/api/holdings").then((r) => r.json()).then(setHoldings);
    fetch("/api/transactions").then((r) => r.json()).then(setTxns);
    fetch("/api/settings/general").then((r) => r.json()).then((d) => {
      setBaseCurrency(d.baseCurrencyCode || "USD");
      setCurrencyCode(d.baseCurrencyCode || "USD");
    });
  }, []);

  const lastTxnFor = (ruleId: string) => txns.filter((t) => t.recurringId === ruleId).sort((a, b) => b.date.localeCompare(a.date))[0];

  const saveReview = async (rule: any) => {
    setReviewError("");
    const txn = lastTxnFor(rule.id);
    const newAmt = parseFloat(reviewAmount);
    if (!txn) { setReviewError("No matching transaction found to update."); return; }
    if (!newAmt) { setReviewError("Enter an amount."); return; }
    await fetch(`/api/transactions/${txn.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: newAmt }),
    });
    setReviewId(null);
    fetch("/api/transactions").then((r) => r.json()).then(setTxns);
  };

  const applyToRule = async (rule: any) => {
    await fetch(`/api/recurring/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(reviewAmount) }),
    });
    setReviewId(null);
    load();
  };

  const add = async () => {
    setAddError("");
    if (postTo === "holding") {
      if (!holdingId) { setAddError("Choose a holding."); return; }
      if (!amount) { setAddError("Enter an amount."); return; }
    } else {
      if (!category.trim()) { setAddError("Enter a category."); return; }
      if (!amount) { setAddError("Enter an amount."); return; }
    }
    await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: postTo === "holding" || postTo === "charity" ? "expense" : type,
        category: postTo === "holding" ? (holdings.find((h) => h.id === holdingId)?.name || "Holding") : category,
        amount: parseFloat(amount), currencyCode: currencyCode !== baseCurrency ? currencyCode : null, frequency, startDate, endDate: endDate || null, postTo, holdingId: holdingId || null,
      }),
    });
    setCategory(""); setAmount(""); setEndDate(""); setHoldingId(""); setCurrencyCode(baseCurrency);
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
          <option value="charity">Post to: Charity gift</option>
        </select>
        {postTo === "transaction" ? (
          <>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 110 }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Account" style={{ width: 140 }} />
          </>
        ) : postTo === "holding" ? (
          <select value={holdingId} onChange={(e) => setHoldingId(e.target.value)} style={{ width: 220 }}>
            <option value="">Choose a holding…</option>
            {holdings.map((h) => <option key={h.id} value={h.id}>{h.name}{h.account ? ` (${h.account})` : ""}</option>)}
          </select>
        ) : (
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Label, e.g. Monthly gift" style={{ width: 180 }} />
        )}
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
        <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} style={{ width: 90 }}>
          {Array.from(new Set([baseCurrency, "USD", "EUR", "GBP", "ILS", "CAD"])).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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
        {addError && (
          <div style={{ width: "100%", fontSize: 12.5, color: "#9C4221", fontWeight: 500 }}>{addError}</div>
        )}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {rules.map((r) => {
          const remaining = countRemaining(r.startDate, r.endDate, r.frequency, r.lastGenerated);
          const lastTxn = r.postTo === "transaction" ? lastTxnFor(r.id) : null;
          const diffPct = lastTxn ? Math.abs((lastTxn.amount - r.amount) / r.amount) * 100 : 0;
          return (
            <div className="card" key={r.id} style={{ opacity: r.paused ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {r.category} <span style={{ fontSize: 11, color: "#8A8370" }}>({r.frequency}{r.postTo === "holding" ? " · into holding" : r.postTo === "charity" ? " · charity gift" : ""})</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#8A8370" }}>
                    {r.startDate.slice(0, 10)}{r.endDate ? ` → ${r.endDate.slice(0, 10)}` : " → ongoing"}
                    {r.lastGenerated && ` · last posted ${r.lastGenerated.slice(0, 10)}`}
                    {remaining !== null && ` · ${remaining} payment${remaining !== 1 ? "s" : ""} remaining`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="num" style={{ fontWeight: 700, color: r.type === "income" ? "#2F6B4F" : "#9C4221" }}>
                    {r.type === "income" ? "+" : "-"}{r.amount.toFixed(2)} {r.currencyCode || baseCurrency}
                  </span>
                  <button className="btn-outline" onClick={() => togglePause(r.id, r.paused)}>{r.paused ? "Resume" : "Pause"}</button>
                  <ConfirmDeleteButton onConfirm={() => remove(r.id)} />
                </div>
              </div>

              {lastTxn && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #D8D0BC" }}>
                  {diffPct >= 10 && reviewId !== r.id && (
                    <div style={{ fontSize: 12.5, color: "#9C4221", marginBottom: 6 }}>
                      Last posted amount (${lastTxn.amount.toFixed(2)}) is {diffPct.toFixed(0)}% off from this rule's ${r.amount.toFixed(2)}.
                    </div>
                  )}
                  <button className="btn-outline" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => { setReviewId(reviewId === r.id ? null : r.id); setReviewAmount(String(lastTxn.amount)); }}>
                    {reviewId === r.id ? "Cancel" : "Review last posted amount"}
                  </button>
                  {reviewId === r.id && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <input type="number" step="0.01" value={reviewAmount} onChange={(e) => setReviewAmount(e.target.value)} style={{ width: 110 }} />
                      <button className="btn" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => saveReview(r)}>Fix that transaction</button>
                      {reviewError && (
                        <div style={{ width: "100%", fontSize: 12.5, color: "#9C4221", fontWeight: 500 }}>{reviewError}</div>
                      )}
                      {Math.abs((parseFloat(reviewAmount) - r.amount) / r.amount) * 100 >= 10 && (
                        <button className="btn-outline" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => applyToRule(r)}>Also update rule to ${parseFloat(reviewAmount || "0").toFixed(2)}</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {rules.length === 0 && <div className="card" style={{ color: "#8A8370" }}>No recurring entries yet.</div>}
      </div>
    </main>
  );
}
