"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function QuickAddExpense() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (open && categories.length === 0) {
      fetch("/api/categories").then((r) => r.json()).then((cats) => setCategories(cats.filter((c: any) => c.type === "expense")));
    }
  }, [open, categories.length]);

  if (pathname === "/login" || pathname === "/signup" || pathname === "/summary") return null;

  const reset = () => { setAmount(""); setCategory(""); setPaymentMethod("cash"); setError(""); };

  const save = async () => {
    setError("");
    const amt = parseFloat(amount);
    if (!amt) { setError("Enter an amount."); return; }
    if (!category) { setError("Choose an account."); return; }
    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "expense",
        category,
        amount: amt,
        date: new Date().toISOString().slice(0, 10),
        paymentMethod,
      }),
    });
    setSaving(false);
    if (!res.ok) { setError("Couldn't save — try again."); return; }
    setSavedMsg(`Logged $${amt.toFixed(2)} to ${category}`);
    reset();
    setTimeout(() => setSavedMsg(""), 2500);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Quick add expense"
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 200,
          width: 54, height: 54, borderRadius: "50%",
          background: "#0F3D2E", color: "#F2EEE3", border: "none",
          fontSize: 26, lineHeight: "54px", textAlign: "center",
          boxShadow: "0 6px 18px rgba(15,61,46,0.4)", cursor: "pointer",
        }}
      >
        {open ? "×" : "+"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", bottom: 84, right: 20, zIndex: 200,
            background: "#fff", border: "1px solid #E4DEC9", borderRadius: 12,
            boxShadow: "0 10px 30px rgba(15,61,46,0.25)", padding: 14, width: 240,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Quick add expense</div>
          <input
            type="number" step="0.01" inputMode="decimal" autoFocus
            value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount" style={{ width: "100%", marginBottom: 8 }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", marginBottom: 8 }}>
            <option value="">Account…</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: "100%", marginBottom: 10 }}>
            <option value="cash">Cash</option>
            <option value="debit">Account (debit)</option>
            <option value="card">Credit card</option>
          </select>
          <button className="btn" onClick={save} disabled={saving} style={{ width: "100%" }}>
            {saving ? "Saving…" : "Log it"}
          </button>
          {error && <div style={{ fontSize: 11.5, color: "#9C4221", marginTop: 6 }}>{error}</div>}
          <div style={{ fontSize: 10.5, color: "#8A8370", marginTop: 8 }}>
            Need more detail (split, receipt, tags)? Use the full form on the Transactions page.
          </div>
        </div>
      )}

      {savedMsg && (
        <div style={{
          position: "fixed", bottom: 84, right: 20, zIndex: 200,
          background: "#0F3D2E", color: "#F2EEE3", borderRadius: 8,
          padding: "8px 14px", fontSize: 12.5, boxShadow: "0 6px 18px rgba(15,61,46,0.35)",
        }}>
          {savedMsg}
        </div>
      )}
    </>
  );
}
