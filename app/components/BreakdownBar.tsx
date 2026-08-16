"use client";

export default function BreakdownBar({ bank, holdings, debt }: { bank: number; holdings: number; debt: number }) {
  const total = bank + holdings + debt;
  if (total <= 0) return null;
  const bankPct = (bank / total) * 100;
  const holdingsPct = (holdings / total) * 100;
  const debtPct = (debt / total) * 100;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden" }}>
        {bankPct > 0 && <div style={{ width: `${bankPct}%`, background: "#2F6B4F" }} />}
        {holdingsPct > 0 && <div style={{ width: `${holdingsPct}%`, background: "#B8863E" }} />}
        {debtPct > 0 && <div style={{ width: `${debtPct}%`, background: "#9C4221" }} />}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "#8A8370", flexWrap: "wrap" }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#2F6B4F", marginRight: 4 }} />Bank {bankPct.toFixed(0)}%</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#B8863E", marginRight: 4 }} />Holdings {holdingsPct.toFixed(0)}%</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#9C4221", marginRight: 4 }} />Debt {debtPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
