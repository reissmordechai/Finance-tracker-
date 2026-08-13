"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [txns, setTxns] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/transactions").then((r) => r.json()).then(setTxns);
    fetch("/api/vendors").then((r) => r.json()).then(setVendors);
    fetch("/api/holdings").then((r) => r.json()).then(setHoldings);
  }, []);

  const query = q.trim().toLowerCase();
  const matchedTxns = query ? txns.filter((t) =>
    t.category.toLowerCase().includes(query) ||
    (t.vendor || "").toLowerCase().includes(query) ||
    (t.note || "").toLowerCase().includes(query) ||
    (t.tags || "").toLowerCase().includes(query)
  ).slice(0, 20) : [];
  const matchedVendors = query ? vendors.filter((v) => v.name.toLowerCase().includes(query)) : [];
  const matchedHoldings = query ? holdings.filter((h) =>
    h.name.toLowerCase().includes(query) || (h.symbol || "").toLowerCase().includes(query) || (h.account || "").toLowerCase().includes(query)
  ) : [];

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Search</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transactions, vendors, holdings…" style={{ width: "100%" }} autoFocus />
      </div>

      {!query && <div className="card" style={{ color: "#8A8370" }}>Start typing to search across everything.</div>}

      {query && (
        <div style={{ display: "grid", gap: 16 }}>
          {matchedTxns.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Transactions ({matchedTxns.length})</div>
              {matchedTxns.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
                  <span>{t.category}{t.vendor ? ` · ${t.vendor}` : ""}</span>
                  <span className="num">{t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {matchedVendors.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Vendors ({matchedVendors.length})</div>
              {matchedVendors.map((v) => <div key={v.id} style={{ padding: "4px 0" }}>{v.name}</div>)}
            </div>
          )}
          {matchedHoldings.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Holdings ({matchedHoldings.length})</div>
              {matchedHoldings.map((h) => (
                <Link key={h.id} href={`/holdings/${encodeURIComponent(h.account || "Unassigned")}`} style={{ display: "block", padding: "4px 0", color: "inherit", textDecoration: "none" }}>
                  {h.name} {h.symbol && `(${h.symbol})`} — <span className="num">${h.currentValue.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          )}
          {matchedTxns.length === 0 && matchedVendors.length === 0 && matchedHoldings.length === 0 && (
            <div className="card" style={{ color: "#8A8370" }}>No matches for "{q}".</div>
          )}
        </div>
      )}
    </main>
  );
}
