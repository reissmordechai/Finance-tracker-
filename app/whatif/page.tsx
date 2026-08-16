"use client";
import { useEffect, useState } from "react";

export default function WhatIfPage() {
  const [forecast, setForecast] = useState<any>(null);
  const [scenarioLabel, setScenarioLabel] = useState("");
  const [scenarioAmount, setScenarioAmount] = useState("");
  const [scenarioDate, setScenarioDate] = useState(new Date().toISOString().slice(0, 10));
  const [scenarioType, setScenarioType] = useState("expense");

  useEffect(() => { fetch("/api/forecast").then((r) => r.json()).then(setForecast); }, []);

  if (!forecast) return <main className="page"><h1 style={{ color: "#0F3D2E" }}>What If</h1><div className="card">Loading…</div></main>;

  const amt = parseFloat(scenarioAmount) || 0;
  const delta = scenarioType === "income" ? amt : -amt;
  const scenarioProjected = forecast.projectedEndBalance + delta;

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>What If</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Try a hypothetical purchase or income change and see how it shifts your projected balance for the rest of the month, before you actually do it.
      </p>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value)} style={{ width: 110 }}>
          <option value="expense">Spend</option>
          <option value="income">Receive</option>
        </select>
        <input value={scenarioLabel} onChange={(e) => setScenarioLabel(e.target.value)} placeholder="What is it? e.g. New tires" style={{ flex: 1, minWidth: 160 }} />
        <input type="number" step="0.01" value={scenarioAmount} onChange={(e) => setScenarioAmount(e.target.value)} placeholder="Amount" style={{ width: 120 }} />
        <input type="date" value={scenarioDate} onChange={(e) => setScenarioDate(e.target.value)} style={{ width: 150 }} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Projected without this</div>
          <div className="num" style={{ fontSize: 20, fontWeight: 700 }}>${forecast.projectedEndBalance.toFixed(2)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 160, background: scenarioProjected < 0 ? "#F7E9E4" : undefined, borderColor: scenarioProjected < 0 ? "#E2B3A3" : undefined }}>
          <div style={{ fontSize: 11, color: "#8A8370" }}>Projected with this</div>
          <div className="num" style={{ fontSize: 20, fontWeight: 700, color: scenarioProjected >= 0 ? "#0F3D2E" : "#9C4221" }}>${scenarioProjected.toFixed(2)}</div>
        </div>
      </div>

      {amt > 0 && scenarioProjected < 0 && (
        <div className="card" style={{ background: "#F7E9E4", borderColor: "#E2B3A3", marginBottom: 16 }}>
          <div style={{ fontSize: 13 }}>This would put you below zero by month-end based on what's already scheduled — worth timing carefully or spreading out.</div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ fontWeight: 600, padding: "14px 14px 0" }}>Already scheduled this month</div>
        {forecast.timeline.length === 0 ? (
          <div style={{ padding: 14, color: "#8A8370" }}>Nothing else scheduled.</div>
        ) : (
          forecast.timeline.map((e: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderTop: "1px solid #EFEADC", fontSize: 13 }}>
              <span>{e.label} <span style={{ color: "#8A8370" }}>({e.date.slice(0, 10)})</span></span>
              <span className="num" style={{ color: e.delta >= 0 ? "#2F6B4F" : "#9C4221" }}>{e.delta >= 0 ? "+" : ""}{e.delta.toFixed(2)}</span>
            </div>
          ))
        )}
        {amt > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderTop: "1px solid #EFEADC", fontSize: 13, background: "#FBF9F2" }}>
            <span>{scenarioLabel || "This scenario"} <span style={{ color: "#8A8370" }}>({scenarioDate})</span></span>
            <span className="num" style={{ color: delta >= 0 ? "#2F6B4F" : "#9C4221", fontWeight: 600 }}>{delta >= 0 ? "+" : ""}{delta.toFixed(2)}</span>
          </div>
        )}
      </div>
    </main>
  );
}
