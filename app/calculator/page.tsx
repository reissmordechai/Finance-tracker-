"use client";
import { useEffect, useState } from "react";

export default function CalculatorPage() {
  const [mode, setMode] = useState<"keypad" | "ledger">("keypad");

  return (
    <main className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ color: "#0F3D2E" }}>Calculator</h1>
        <div style={{ display: "flex", gap: 4 }}>
          <button className={mode === "keypad" ? "btn" : "btn-outline"} onClick={() => setMode("keypad")}>Keypad</button>
          <button className={mode === "ledger" ? "btn" : "btn-outline"} onClick={() => setMode("ledger")}>By account &amp; date</button>
        </div>
      </div>
      {mode === "keypad" ? <Keypad /> : <LedgerCalculator />}
    </main>
  );
}

function Keypad() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const inputDigit = (d: string) => {
    if (waiting) { setDisplay(d); setWaiting(false); }
    else setDisplay(display === "0" ? d : display + d);
  };
  const inputDot = () => {
    if (waiting) { setDisplay("0."); setWaiting(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };
  const clearAll = () => { setDisplay("0"); setPrev(null); setOp(null); setWaiting(false); };
  const backspace = () => setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
  const toggleSign = () => setDisplay((d) => (d.startsWith("-") ? d.slice(1) : d === "0" ? d : "-" + d));

  const compute = (a: number, b: number, operator: string) => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const applyOperator = (nextOp: string) => {
    const val = parseFloat(display);
    if (prev === null) setPrev(val);
    else if (op) {
      const result = compute(prev, val, op);
      setDisplay(String(Math.round(result * 1e8) / 1e8));
      setPrev(result);
    }
    setWaiting(true);
    setOp(nextOp);
  };

  const equals = () => {
    if (op === null || prev === null) return;
    const val = parseFloat(display);
    const result = compute(prev, val, op);
    setDisplay(String(Math.round(result * 1e8) / 1e8));
    setPrev(null); setOp(null); setWaiting(true);
  };

  const btnStyle: React.CSSProperties = { padding: "18px 0", borderRadius: 8, border: "1px solid #D8D0BC", background: "#fff", fontSize: 18, fontWeight: 600 };
  const opStyle: React.CSSProperties = { ...btnStyle, background: "#B8863E", color: "#fff", borderColor: "#B8863E" };

  return (
    <div className="card" style={{ maxWidth: 340 }}>
      <div className="num" style={{ background: "#0F3D2E", color: "#fff", borderRadius: 8, padding: "18px 14px", textAlign: "right", fontSize: 30, fontWeight: 600, marginBottom: 12, overflowX: "auto" }}>
        {display}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <button style={{ ...btnStyle, color: "#9C4221" }} onClick={clearAll}>AC</button>
        <button style={btnStyle} onClick={toggleSign}>±</button>
        <button style={btnStyle} onClick={backspace}>⌫</button>
        <button style={opStyle} onClick={() => applyOperator("÷")}>÷</button>

        <button style={btnStyle} onClick={() => inputDigit("7")}>7</button>
        <button style={btnStyle} onClick={() => inputDigit("8")}>8</button>
        <button style={btnStyle} onClick={() => inputDigit("9")}>9</button>
        <button style={opStyle} onClick={() => applyOperator("×")}>×</button>

        <button style={btnStyle} onClick={() => inputDigit("4")}>4</button>
        <button style={btnStyle} onClick={() => inputDigit("5")}>5</button>
        <button style={btnStyle} onClick={() => inputDigit("6")}>6</button>
        <button style={opStyle} onClick={() => applyOperator("-")}>−</button>

        <button style={btnStyle} onClick={() => inputDigit("1")}>1</button>
        <button style={btnStyle} onClick={() => inputDigit("2")}>2</button>
        <button style={btnStyle} onClick={() => inputDigit("3")}>3</button>
        <button style={opStyle} onClick={() => applyOperator("+")}>+</button>

        <button style={{ ...btnStyle, gridColumn: "span 2" }} onClick={() => inputDigit("0")}>0</button>
        <button style={btnStyle} onClick={inputDot}>.</button>
        <button style={{ ...btnStyle, background: "#0F3D2E", color: "#fff", borderColor: "#0F3D2E" }} onClick={equals}>=</button>
      </div>
    </div>
  );
}

function LedgerCalculator() {
  const [txns, setTxns] = useState<any[]>([]);
  const [rows, setRows] = useState([{ id: 1, category: "", from: "", to: "", boughtFor: "" }]);

  useEffect(() => { fetch("/api/transactions").then((r) => r.json()).then(setTxns); }, []);

  const categories = Array.from(new Set(txns.map((t) => t.category))).sort();
  const boughtForOptions = Array.from(new Set(txns.map((t) => t.boughtFor).filter(Boolean))).sort();

  const addRow = () => setRows((prev) => [...prev, { id: Date.now(), category: "", from: "", to: "", boughtFor: "" }]);
  const removeRow = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id: number, field: string, val: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));

  const results = rows.map((r) => {
    if (!r.from || !r.category) return { ...r, total: 0, count: 0 };
    const to = r.to || r.from;
    const matches = txns.filter((t) => t.category === r.category && t.date.slice(0, 10) >= r.from && t.date.slice(0, 10) <= to && (!r.boughtFor || t.boughtFor === r.boughtFor));
    return { ...r, total: matches.reduce((s, t) => s + t.amount, 0), count: matches.length };
  });

  const grandTotal = results.reduce((s, r) => s + r.total, 0);

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: 0 }}>
        Add a row per account and date range — they all add up into one combined total.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {results.map((r, i) => (
          <div key={r.id} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", background: "#FBF9F2", border: "1px solid #E4DEC9", borderRadius: 8, padding: 10 }}>
            <span style={{ fontSize: 12, color: "#8A8370", width: 14 }}>{i + 1}</span>
            <select value={r.category} onChange={(e) => updateRow(r.id, "category", e.target.value)} style={{ width: 150 }}>
              <option value="">Account…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div>
              <label style={{ fontSize: 11, color: "#8A8370" }}>From</label>
              <input type="date" value={r.from} onChange={(e) => updateRow(r.id, "from", e.target.value)} style={{ width: 145, display: "block" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#8A8370" }}>To (optional)</label>
              <input type="date" value={r.to} onChange={(e) => updateRow(r.id, "to", e.target.value)} style={{ width: 145, display: "block" }} />
            </div>
            {boughtForOptions.length > 0 && (
              <div>
                <label style={{ fontSize: 11, color: "#8A8370" }}>Bought for (optional)</label>
                <select value={r.boughtFor} onChange={(e) => updateRow(r.id, "boughtFor", e.target.value)} style={{ width: 140, display: "block" }}>
                  <option value="">Anyone</option>
                  {boughtForOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#8A8370" }}>Subtotal</div>
              <div className="num" style={{ fontWeight: 600 }}>${r.total.toFixed(2)}</div>
            </div>
            {rows.length > 1 && <button onClick={() => removeRow(r.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>}
          </div>
        ))}
      </div>
      <button className="btn-outline" style={{ marginTop: 10 }} onClick={addRow}>+ Add another account or date</button>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed #D8D0BC", display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#8A8370" }}>Combined total</span>
        <span className="num" style={{ fontSize: 22, fontWeight: 700, color: "#0F3D2E" }}>${grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
