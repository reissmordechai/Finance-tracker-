"use client";

type Segment = { label: string; value: number; color: string };

function CompositionBar({ title, segments }: { title: string; segments: Segment[] }) {
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((s, seg) => s + seg.value, 0);
  if (total <= 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11.5, color: "#8A8370", marginBottom: 4 }}>{title}</div>
      <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden" }}>
        {shown.map((s) => (
          <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={s.label} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 11, color: "#8A8370", flexWrap: "wrap" }}>
        {shown.map((s) => (
          <span key={s.label}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: s.color, marginRight: 4 }} />
            {s.label} ${s.value.toFixed(0)} ({((s.value / total) * 100).toFixed(0)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BreakdownBar({
  bank, holdings, otherAssets, cardDebt, loanDebt, otherLiabilities,
}: {
  bank: number; holdings: number; otherAssets: number;
  cardDebt: number; loanDebt: number; otherLiabilities: number;
}) {
  return (
    <div>
      <CompositionBar
        title="What you own"
        segments={[
          { label: "Bank", value: bank, color: "#2F6B4F" },
          { label: "Holdings", value: holdings, color: "#B8863E" },
          { label: "Other assets", value: otherAssets, color: "#5B7B7A" },
        ]}
      />
      <CompositionBar
        title="What you owe"
        segments={[
          { label: "Cards", value: cardDebt, color: "#9C4221" },
          { label: "Loans", value: loanDebt, color: "#C1662E" },
          { label: "Other owed", value: otherLiabilities, color: "#B08968" },
        ]}
      />
    </div>
  );
}
