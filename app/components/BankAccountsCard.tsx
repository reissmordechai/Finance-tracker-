"use client";
import { useEffect, useState } from "react";

export default function BankAccountsCard() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [charityBalance, setCharityBalance] = useState(0);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [newName, setNewName] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [newCurrency, setNewCurrency] = useState("USD");
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [convertedTotal, setConvertedTotal] = useState<number | null>(null);

  const load = () => {
    fetch("/api/bankaccounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/charity").then((r) => r.json()).then((entries: any[]) => {
      const owed = entries.filter((e) => e.type === "owed").reduce((s, e) => s + e.amount, 0);
      const given = entries.filter((e) => e.type === "given").reduce((s, e) => s + e.amount, 0);
      setCharityBalance(owed - given);
    });
    fetch("/api/settings/general").then((r) => r.json()).then((d) => {
      setBaseCurrency(d.baseCurrencyCode || "USD");
      setNewCurrency(d.baseCurrencyCode || "USD");
    });
  };
  useEffect(() => { load(); }, []);

  // If every account is already in the base currency, the raw sum is correct.
  // Otherwise convert each foreign-currency balance to base for the total.
  useEffect(() => {
    const foreign = accounts.filter((a) => a.currencyCode && a.currencyCode !== baseCurrency);
    if (foreign.length === 0) { setConvertedTotal(null); return; }
    (async () => {
      let sum = accounts.filter((a) => !foreign.includes(a)).reduce((s, a) => s + a.balance, 0);
      for (const a of foreign) {
        const { rate } = await fetch(`/api/currency?from=${a.currencyCode}&to=${baseCurrency}`).then((r) => r.json());
        sum += rate ? a.balance * rate : a.balance;
      }
      setConvertedTotal(Math.round(sum * 100) / 100);
    })();
  }, [accounts, baseCurrency]);

  const rawTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const total = convertedTotal ?? rawTotal;
  const netAfterCharity = total - charityBalance;

  const startEdit = (a: any) => { setEditingId(a.id); setEditBalance(String(a.balance)); };
  const saveEdit = async (id: string) => {
    await fetch(`/api/bankaccounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: parseFloat(editBalance) || 0 }),
    });
    setEditingId(null);
    load();
  };
  const remove = async (id: string) => {
    await fetch(`/api/bankaccounts/${id}`, { method: "DELETE" });
    load();
  };
  const addAccount = async () => {
    if (!newName.trim()) return;
    await fetch("/api/bankaccounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, balance: parseFloat(newBalance) || 0, currencyCode: newCurrency }),
    });
    setNewName(""); setNewBalance(""); setShowAdd(false);
    load();
  };

  const doTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (!fromId || !toId || fromId === toId || !amt) return;
    setTransferring(true);
    await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromAccountId: fromId, toAccountId: toId, amount: amt, date: new Date().toISOString() }),
    });
    setTransferring(false);
    setTransferAmount(""); setShowTransfer(false);
    load();
  };

  const currencies = Array.from(new Set([baseCurrency, "USD", "EUR", "GBP", "ILS", "CAD"]));

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Bank accounts</div>
        <div style={{ display: "flex", gap: 8 }}>
          {accounts.length >= 2 && (
            <button className="btn-outline" onClick={() => setShowTransfer((s) => !s)} style={{ padding: "5px 12px", fontSize: 12 }}>{showTransfer ? "Cancel" : "Transfer"}</button>
          )}
          <button className="btn-outline" onClick={() => setShowAdd((s) => !s)} style={{ padding: "5px 12px", fontSize: 12 }}>{showAdd ? "Cancel" : "+ Add account"}</button>
        </div>
      </div>

      {showAdd && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Checking" style={{ flex: 1, minWidth: 140 }} />
          <input type="number" step="0.01" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="Balance" style={{ width: 120 }} />
          <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} style={{ width: 90 }}>
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn" onClick={addAccount}>Save</button>
        </div>
      )}

      {showTransfer && accounts.length >= 2 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center", background: "#FBF9F2", border: "1px solid #E4DEC9", borderRadius: 8, padding: 10 }}>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} style={{ width: 150 }}>
            <option value="">From…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <span style={{ fontSize: 13 }}>→</span>
          <select value={toId} onChange={(e) => setToId(e.target.value)} style={{ width: 150 }}>
            <option value="">To…</option>
            {accounts.filter((a) => a.id !== fromId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
          <button className="btn" onClick={doTransfer} disabled={transferring}>{transferring ? "…" : "Transfer"}</button>
        </div>
      )}

      {accounts.length === 0 ? (
        <div style={{ color: "#8A8370", fontSize: 13 }}>No accounts yet — add one above.</div>
      ) : (
        <>
          {accounts.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
              <span style={{ fontSize: 13.5 }}>{a.name}{a.currencyCode && a.currencyCode !== baseCurrency && <span className="pill" style={{ marginLeft: 6 }}>{a.currencyCode}</span>}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {editingId === a.id ? (
                  <>
                    <input type="number" step="0.01" autoFocus value={editBalance} onChange={(e) => setEditBalance(e.target.value)} style={{ width: 100 }} onKeyDown={(e) => e.key === "Enter" && saveEdit(a.id)} />
                    <button className="btn" onClick={() => saveEdit(a.id)} style={{ padding: "5px 10px", fontSize: 12 }}>Save</button>
                  </>
                ) : (
                  <button className="btn-outline" onClick={() => startEdit(a)} style={{ padding: "4px 10px", fontSize: 12 }}>
                    <span className="num">{a.balance.toFixed(2)} {a.currencyCode || "USD"}</span>
                  </button>
                )}
                <button onClick={() => remove(a.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #D8D0BC" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
              <span>Total in bank {convertedTotal !== null && `(converted to ${baseCurrency})`}</span>
              <span className="num" style={{ fontWeight: 600 }}>${total.toFixed(2)}</span>
            </div>
            {charityBalance > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#9C4221", marginTop: 4 }}>
                  <span>Minus charity owed</span>
                  <span className="num">-${charityBalance.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginTop: 6, paddingTop: 6, borderTop: "1px solid #EFEADC" }}>
                  <span>Net after charity</span>
                  <span className="num" style={{ color: netAfterCharity >= 0 ? "#0F3D2E" : "#9C4221" }}>${netAfterCharity.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
