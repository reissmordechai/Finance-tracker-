"use client";
import { useEffect, useState } from "react";

export default function ForecastPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetch("/api/forecast").then((r) => r.json()).then(setData); }, []);

  if (!data) return <main className="page"><h1 style={{ color: "#0F3D2E" }}>Cash Flow Forecast</h1><div className="card">Loading…</div></main>;

  const monthEndLabel = new Date(data.monthEnd).toLocaleDateString("default", { month: "long", day: "numeric" });

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Cash Flow Forecast</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Projects your bank balance forward through {monthEndLabel} using active recurring entries and upcoming card due dates.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Today</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>${data.startBalance.toFixed(2)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Projected by {monthEndLabel}</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: data.projectedEndBalance >= data.startBalance ? "#2F6B4F" : "#9C4221" }}>
            ${data.projectedEndBalance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ fontWeight: 600, padding: "14px 14px 0" }}>Upcoming</div>
        {data.timeline.length === 0 ? (
          <div style={{ padding: 14, color: "#8A8370" }}>Nothing scheduled for the rest of the month.</div>
        ) : (
          data.timeline.map((e: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid #EFEADC" }}>
              <div>
                <div>{e.label}</div>
                <div style={{ fontSize: 11, color: "#8A8370" }}>{e.date.slice(0, 10)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="num" style={{ color: e.delta >= 0 ? "#2F6B4F" : "#9C4221", fontWeight: 600 }}>{e.delta >= 0 ? "+" : ""}{e.delta.toFixed(2)}</div>
                <div className="num" style={{ fontSize: 11, color: "#8A8370" }}>bal. ${e.runningBalance.toFixed(2)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
