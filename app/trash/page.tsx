"use client";
import { useEffect, useState } from "react";

export default function TrashPage() {
  const [txns, setTxns] = useState<any[]>([]);

  const load = () => fetch("/api/transactions?trash=1").then((r) => r.json()).then(setTxns);
  useEffect(() => { load(); }, []);

  const restore = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    load();
  };

  const purge = async (id: string) => {
    await fetch(`/api/transactions/${id}?permanent=1`, { method: "DELETE" });
    load();
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Trash</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Deleted transactions sit here for 30 days before being removed for good — restore anything deleted by mistake.
      </p>

      <div className="card" style={{ padding: 0 }}>
        {txns.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #EFEADC" }}>
            <div>
              <div>{t.category}</div>
              <div style={{ fontSize: 11, color: "#8A8370" }}>{t.date.slice(0, 10)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="num" style={{ color: t.type === "income" ? "#2F6B4F" : "#9C4221", fontWeight: 600 }}>
                {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
              </span>
              <button className="btn-outline" onClick={() => restore(t.id)}>Restore</button>
              <button onClick={() => purge(t.id)} style={{ border: "none", background: "none", color: "#9C4221", fontSize: 12 }}>Delete forever</button>
            </div>
          </div>
        ))}
        {txns.length === 0 && <div style={{ padding: 14, color: "#8A8370" }}>Trash is empty.</div>}
      </div>
    </main>
  );
}
