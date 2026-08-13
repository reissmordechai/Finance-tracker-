"use client";
import { useEffect, useState } from "react";

export default function TagsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { fetch("/api/transactions").then((r) => r.json()).then(setTxns); }, []);

  const byTag: Record<string, { total: number; count: number; txns: any[] }> = {};
  txns.forEach((t) => {
    if (!t.tags) return;
    t.tags.split(",").map((x: string) => x.trim()).filter(Boolean).forEach((tag: string) => {
      if (!byTag[tag]) byTag[tag] = { total: 0, count: 0, txns: [] };
      byTag[tag].total += t.type === "expense" ? t.amount : -t.amount;
      byTag[tag].count += 1;
      byTag[tag].txns.push(t);
    });
  });

  const tags = Object.entries(byTag).sort((a, b) => b[1].count - a[1].count);

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Tags</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Labels like "tax deductible" or "reimbursable" that cut across accounts — add them when logging a transaction.
      </p>

      {tags.length === 0 ? (
        <div className="card" style={{ color: "#8A8370" }}>No tags used yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {tags.map(([tag, info]) => (
            <div className="card clickable" key={tag} style={{ cursor: "pointer" }} onClick={() => setSelected(selected === tag ? null : tag)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="pill">{tag}</span>
                <div style={{ textAlign: "right" }}>
                  <div className="num" style={{ fontWeight: 700 }}>${info.total.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: "#8A8370" }}>{info.count} entries</div>
                </div>
              </div>
              {selected === tag && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #D8D0BC" }}>
                  {info.txns.map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                      <span>{t.category} · {t.date.slice(0, 10)}</span>
                      <span className="num">{t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
