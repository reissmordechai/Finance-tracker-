"use client";
import { useEffect, useState } from "react";

export default function ChecksPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [clearing, setClearing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/transactions").then((r) => r.json()).then(setTxns);
    fetch("/api/bankaccounts").then((r) => r.json()).then(setAccounts);
  };
  useEffect(load, []);

  const checks = txns.filter((t) => t.paymentMethod === "check").sort((a, b) => b.date.localeCompare(a.date));
  const pending = checks.filter((t) => !t.checkCleared);
  const cleared = checks.filter((t) => t.checkCleared);

  const accountName = (id: string | null) => accounts.find((a) => a.id === id)?.name || "—";

  const pendingByAccount: Record<string, number> = {};
  pending.forEach((t) => {
    const name = accountName(t.bankAccountId);
    pendingByAccount[name] = (pendingByAccount[name] || 0) + t.amount;
  });

  const markCleared = async (id: string) => {
    setError("");
    setClearing(id);
    const res = await fetch(`/api/transactions/${id}/clear-check`, { method: "POST" });
    setClearing(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't mark this as cleared.");
      return;
    }
    load();
  };

  const Row = ({ t }: { t: any }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #EFEADC", flexWrap: "wrap", gap: 8 }}>
      <div>
        <div style={{ fontSize: 13 }}>
          {t.checkNumber ? `Check #${t.checkNumber}` : "Check"}{t.vendor && ` — ${t.vendor}`}
        </div>
        <div style={{ fontSize: 11, color: "#8A8370" }}>{t.date.slice(0, 10)} · {accountName(t.bankAccountId)} · {t.category}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="num" style={{ fontWeight: 600 }}>${t.amount.toFixed(2)}</span>
        {!t.checkCleared && (
          <button className="btn-outline" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => markCleared(t.id)} disabled={clearing === t.id}>
            {clearing === t.id ? "…" : "Mark cleared"}
          </button>
        )}
        {t.checkCleared && <span className="pill" style={{ background: "#EAF2ED", color: "#2F6B4F" }}>cleared</span>}
      </div>
    </div>
  );

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Checks</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8, marginBottom: 16 }}>
        Checks you've written show here as pending until you confirm they've gone through — once marked cleared, the amount comes off that account's balance.
      </p>

      {Object.keys(pendingByAccount).length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Pending, by account</div>
          {Object.entries(pendingByAccount).map(([name, total]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
              <span>{name}</span>
              <span className="num" style={{ fontWeight: 600, color: "#9C4221" }}>${total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ fontSize: 12.5, color: "#9C4221", marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Pending ({pending.length})</div>
        {pending.length === 0 ? (
          <div style={{ color: "#8A8370", fontSize: 13, marginTop: 6 }}>No outstanding checks.</div>
        ) : (
          pending.map((t) => <Row key={t.id} t={t} />)
        )}
      </div>

      {cleared.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Cleared ({cleared.length})</div>
          {cleared.slice(0, 25).map((t) => <Row key={t.id} t={t} />)}
        </div>
      )}
    </main>
  );
}
