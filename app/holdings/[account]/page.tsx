"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ConfirmDeleteButton from "../../components/ConfirmDeleteButton";

export default function AccountDetailPage() {
  const params = useParams();
  const accountName = decodeURIComponent(params.account as string);
  const isUnassigned = accountName === "Unassigned";

  const [holdings, setHoldings] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [charityEligible, setCharityEligible] = useState<null | boolean>(null);
  const [charityPct, setCharityPct] = useState("10");
  const [addError, setAddError] = useState("");

  const load = () => fetch("/api/holdings").then((r) => r.json()).then((all: any[]) => {
    setHoldings(all.filter((h) => (h.account || "Unassigned") === accountName));
  });
  useEffect(() => {
    load();
    fetch("/api/settings/general").then((r) => r.json()).then((d) => {
      setCharityPct(String(d.charityDefaultPct ?? 10));
      setBaseCurrency(d.baseCurrencyCode || "USD");
      setCurrency(d.baseCurrencyCode || "USD");
    });
  }, [accountName]);

  const charityAmount = (parseFloat(amount) || 0) * (parseFloat(charityPct) || 0) / 100;

  const add = async () => {
    setAddError("");
    const amt = parseFloat(amount);
    if (!name.trim()) { setAddError("Enter a name."); return; }
    if (!amt) { setAddError("Enter an amount."); return; }
    await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, account: isUnassigned ? null : accountName, symbol: symbol || null, currencyCode: currency, amount: amt, date: new Date().toISOString() }),
    });
    if (charityEligible && charityAmount > 0) {
      await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "owed", amount: Math.round(charityAmount * 100) / 100, note: `${charityPct}% of deposit into ${name}` }),
      });
    }
    setName(""); setSymbol(""); setAmount(""); setCharityEligible(null); setShowAdd(false);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    load();
  };

  const total = holdings.reduce((s, h) => s + h.currentValue, 0);

  return (
    <main className="page">
      <Link href="/holdings" style={{ color: "#B8863E", fontSize: 13 }}>&larr; All accounts</Link>
      <h1 style={{ color: "#0F3D2E" }}>{accountName}</h1>

      <div className="card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Total in this account</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 700, color: "#0F3D2E" }}>${total.toFixed(2)}</div>
        </div>
        <button className="btn" onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Cancel" : "+ Add here"}</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. S&P 500 ETF" style={{ flex: 2, minWidth: 160 }} />
            <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol (optional)" style={{ width: 140 }} />
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 120 }} />
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 90 }}>
              {Array.from(new Set([baseCurrency, "USD", "EUR", "GBP", "ILS", "CAD"])).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn" onClick={add}>Save</button>
            {addError && (
              <div style={{ width: "100%", fontSize: 12.5, color: "#9C4221", fontWeight: 500 }}>{addError}</div>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: charityEligible ? 8 : 0 }}>Does this deposit count toward charity?</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={charityEligible === true ? "btn" : "btn-outline"} onClick={() => setCharityEligible(true)} style={{ padding: "6px 16px", fontSize: 12.5 }}>Yes</button>
              <button className={charityEligible === false ? "btn" : "btn-outline"} onClick={() => setCharityEligible(false)} style={{ padding: "6px 16px", fontSize: 12.5 }}>No</button>
            </div>
            {charityEligible && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13 }}>
                <input type="number" value={charityPct} onChange={(e) => setCharityPct(e.target.value)} style={{ width: 55 }} />
                % of this ={amount && <span className="num" style={{ fontWeight: 600 }}>&nbsp;${charityAmount.toFixed(2)}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {holdings.map((h) => {
          const invested = h.entries.reduce((s: number, e: any) => s + e.amount, 0);
          const gain = h.currentValue - invested;
          const gainPct = invested ? (gain / invested) * 100 : 0;
          return (
            <div className="card" key={h.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>{h.name} {h.symbol && <span style={{ fontSize: 11, color: "#8A8370" }}>({h.symbol})</span>}{h.currencyCode && h.currencyCode !== baseCurrency && <span className="pill" style={{ marginLeft: 6 }}>{h.currencyCode}</span>}</div>
                <ConfirmDeleteButton onConfirm={() => remove(h.id)} />
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8A8370" }}>Invested</div>
                  <div className="num" style={{ fontWeight: 600 }}>${invested.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8A8370" }}>Current value</div>
                  <div className="num" style={{ fontWeight: 600 }}>${h.currentValue.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8A8370" }}>Gain / loss</div>
                  <div className="num" style={{ fontWeight: 700, color: gain >= 0 ? "#2F6B4F" : "#9C4221" }}>
                    {gain >= 0 ? "+" : ""}${gain.toFixed(2)} ({gainPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
              {h.symbol ? (
                <div style={{ fontSize: 11, color: "#B0A88E", marginTop: 8 }}>
                  Auto-updated daily from live {h.symbol} pricing. Last checked: {h.history.length ? new Date(h.history[h.history.length - 1].date).toLocaleString() : "not yet"}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#B0A88E", marginTop: 8 }}>No symbol set — update manually.</div>
              )}
            </div>
          );
        })}
        {holdings.length === 0 && <div className="card" style={{ color: "#8A8370" }}>Nothing in this account yet.</div>}
      </div>
    </main>
  );
}
