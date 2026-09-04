"use client";
import { useEffect, useState } from "react";
import BarChart from "../components/BarChart";

export default function ReportsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [mode, setMode] = useState<"monthly" | "tax">("monthly");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear()));
  const [trendCategory, setTrendCategory] = useState("");
  const [boughtForFilter, setBoughtForFilter] = useState("");

  useEffect(() => { fetch("/api/transactions").then((r) => r.json()).then(setTxns); }, []);

  const boughtForOptions = Array.from(new Set(txns.map((t) => t.boughtFor).filter(Boolean))).sort();
  const scopedTxns = boughtForFilter ? txns.filter((t) => t.boughtFor === boughtForFilter) : txns;

  const monthTxns = scopedTxns.filter((t) => t.date.slice(0, 7) === month);
  const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, number> = {};
  monthTxns.filter((t) => t.type === "expense").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const categories = Array.from(new Set(scopedTxns.map((t) => t.category))).sort();
  const activeTrendCategory = trendCategory || sorted[0]?.[0] || categories[0] || "";

  // Last 6 months trend for the selected account
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const trendBars = months.map((ym) => {
    const total = scopedTxns.filter((t) => t.type === "expense" && t.category === activeTrendCategory && t.date.slice(0, 7) === ym)
      .reduce((s, t) => s + t.amount, 0);
    const [y, m] = ym.split("-");
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", { month: "short" });
    return { label, value: Math.round(total * 100) / 100 };
  });

  // Tax summary — pulls together tax withheld/collected (taxAmount per
  // transaction) and anything tagged "tax deductible", for one selected year.
  const yearTxns = scopedTxns.filter((t) => t.date.slice(0, 4) === taxYear);
  const taxCollected = yearTxns.reduce((s, t) => s + (t.taxAmount || 0), 0);
  const deductibleTxns = yearTxns.filter((t) =>
    t.tags && t.tags.toLowerCase().split(",").map((s: string) => s.trim()).includes("tax deductible")
  );
  const deductibleTotal = deductibleTxns.reduce((s, t) => s + t.amount, 0);
  const deductibleByCategory: Record<string, number> = {};
  deductibleTxns.forEach((t) => { deductibleByCategory[t.category] = (deductibleByCategory[t.category] || 0) + t.amount; });
  const sortedDeductible = Object.entries(deductibleByCategory).sort((a, b) => b[1] - a[1]);
  const availableYears = Array.from(new Set(txns.map((t) => t.date.slice(0, 4)))).sort().reverse();

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Reports</h1>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button className={mode === "monthly" ? "btn" : "btn-outline"} onClick={() => setMode("monthly")} style={{ padding: "7px 16px", fontSize: 13 }}>Monthly</button>
        <button className={mode === "tax" ? "btn" : "btn-outline"} onClick={() => setMode("tax")} style={{ padding: "7px 16px", fontSize: 13 }}>Tax summary</button>
      </div>

      {mode === "tax" ? (
        <>
          <div className="card" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select value={taxYear} onChange={(e) => setTaxYear(e.target.value)} style={{ width: 110 }}>
              {(availableYears.includes(taxYear) ? availableYears : [taxYear, ...availableYears]).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: "#8A8370" }}>
              "Deductible" totals come from transactions tagged <code>tax deductible</code>.
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div className="card" style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11, color: "#8A8370" }}>Tax collected/paid — {taxYear}</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#0F3D2E" }}>${taxCollected.toFixed(2)}</div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11, color: "#8A8370" }}>Deductible spending — {taxYear}</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#2F6B4F" }}>${deductibleTotal.toFixed(2)}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Deductible spending by account</div>
            {sortedDeductible.length === 0 ? (
              <div style={{ color: "#8A8370" }}>Nothing tagged "tax deductible" in {taxYear} yet.</div>
            ) : (
              sortedDeductible.map(([cat, amt]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
                  <span>{cat}</span>
                  <span className="num" style={{ fontWeight: 600 }}>${amt.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {deductibleTxns.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Deductible transactions ({deductibleTxns.length})</div>
              {deductibleTxns.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid #EFEADC", fontSize: 12.5 }}>
                  <span>{t.date.slice(0, 10)} · {t.category}{t.vendor && ` · ${t.vendor}`}</span>
                  <span className="num">${t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
      <>
      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        {boughtForOptions.length > 0 && (
          <select value={boughtForFilter} onChange={(e) => setBoughtForFilter(e.target.value)} style={{ width: 170 }}>
            <option value="">All (bought for anyone)</option>
            {boughtForOptions.map((b) => <option key={b} value={b}>Bought for {b}</option>)}
          </select>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Income</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#2F6B4F" }}>${income.toFixed(2)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Expenses</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "#9C4221" }}>${expense.toFixed(2)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Net</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>${(income - expense).toFixed(2)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Spending by account — {month}</div>
        {sorted.length === 0 ? (
          <div style={{ color: "#8A8370" }}>Nothing this month.</div>
        ) : (
          sorted.map(([cat, amt]) => (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #EFEADC" }}>
              <span>{cat}</span>
              <span className="num" style={{ fontWeight: 600 }}>${amt.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      {categories.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>6-month trend</div>
            <select value={activeTrendCategory} onChange={(e) => setTrendCategory(e.target.value)} style={{ width: 160 }}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <BarChart bars={trendBars} />
        </div>
      )}
      </>
      )}
    </main>
  );
}
