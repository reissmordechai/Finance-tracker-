"use client";
import { useEffect, useState } from "react";

function compressImage(file: File, maxDim = 900, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = (height * maxDim) / width; width = maxDim; }
        else if (height > maxDim) { width = (width * maxDim) / height; height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TransactionsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Groceries");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // filters
  const [fCategory, setFCategory] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fMinAmount, setFMinAmount] = useState("");
  const [fMaxAmount, setFMaxAmount] = useState("");
  const [fTag, setFTag] = useState("");

  const load = () => fetch("/api/transactions").then((r) => r.json()).then(setTxns);
  useEffect(() => { load(); }, []);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setReceiptImage(await compressImage(file)); } catch {}
    setUploading(false);
  };

  const add = async () => {
    const amt = parseFloat(amount);
    if (!amt) return;
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, category, amount: amt, date, tags: tags || null, receiptImage }),
    });
    setAmount(""); setTags(""); setReceiptImage(null);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const allTags = Array.from(new Set(txns.flatMap((t) => (t.tags ? t.tags.split(",").map((x: string) => x.trim()) : [])))).sort();

  const filtered = txns.filter((t) => {
    if (fCategory && !t.category.toLowerCase().includes(fCategory.toLowerCase())) return false;
    if (fFrom && t.date.slice(0, 10) < fFrom) return false;
    if (fTo && t.date.slice(0, 10) > fTo) return false;
    if (fMinAmount && t.amount < parseFloat(fMinAmount)) return false;
    if (fMaxAmount && t.amount > parseFloat(fMaxAmount)) return false;
    if (fTag && !(t.tags || "").toLowerCase().includes(fTag.toLowerCase())) return false;
    return true;
  });

  const clearFilters = () => { setFCategory(""); setFFrom(""); setFTo(""); setFMinAmount(""); setFMaxAmount(""); setFTag(""); };
  const filtersActive = fCategory || fFrom || fTo || fMinAmount || fMaxAmount || fTag;

  return (
    <main className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: "#0F3D2E" }}>Transactions</h1>
        <a href="/api/export" className="btn-outline" style={{ textDecoration: "none", height: "fit-content" }}>Export CSV</a>
      </div>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 110 }}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Account" style={{ width: 140 }} />
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 150 }} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" style={{ width: 180 }} />
        <div>
          <label className="btn-outline" style={{ display: "inline-block", cursor: "pointer" }}>
            {uploading ? "…" : receiptImage ? "Photo added ✓" : "Add receipt"}
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </label>
        </div>
        <button className="btn" onClick={add}>Add</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Search &amp; filter</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={fCategory} onChange={(e) => setFCategory(e.target.value)} placeholder="Account contains…" style={{ flex: 1, minWidth: 140 }} />
          <div>
            <label style={{ fontSize: 11, color: "#8A8370" }}>From</label>
            <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={{ width: 150, display: "block" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8370" }}>To</label>
            <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} style={{ width: 150, display: "block" }} />
          </div>
          <input type="number" value={fMinAmount} onChange={(e) => setFMinAmount(e.target.value)} placeholder="Min $" style={{ width: 90 }} />
          <input type="number" value={fMaxAmount} onChange={(e) => setFMaxAmount(e.target.value)} placeholder="Max $" style={{ width: 90 }} />
          {allTags.length > 0 && (
            <select value={fTag} onChange={(e) => setFTag(e.target.value)} style={{ width: 160 }}>
              <option value="">Any tag</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {filtersActive && <button className="btn-outline" onClick={clearFilters}>Clear</button>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#8A8370", marginBottom: 6 }}>{filtered.length} of {txns.length} transactions</div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #EFEADC" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {t.receiptImage && (
                <img
                  src={t.receiptImage}
                  onClick={() => setLightbox(t.receiptImage)}
                  style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #E4DEC9" }}
                />
              )}
              <div>
                <div>{t.category}{t.tags && <span className="pill" style={{ marginLeft: 6 }}>{t.tags.split(",")[0].trim()}</span>}</div>
                <div style={{ fontSize: 11, color: "#8A8370" }}>{t.date.slice(0, 10)}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="num" style={{ color: t.type === "income" ? "#2F6B4F" : "#9C4221", fontWeight: 600 }}>
                {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
              </span>
              <button onClick={() => remove(t.id)} style={{ border: "none", background: "none", color: "#B0A88E", cursor: "pointer" }}>✕</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 14, color: "#8A8370" }}>No transactions match.</div>}
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,61,46,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <img src={lightbox} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 10 }} />
        </div>
      )}
    </main>
  );
}
