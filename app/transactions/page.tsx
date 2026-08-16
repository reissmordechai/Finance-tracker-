"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseCsv } from "@/lib/csv";
import { useVoiceInput } from "../components/useVoiceInput";

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
  const [charityEntries, setCharityEntries] = useState<any[]>([]);
  const [type, setType] = useState("expense");
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [addingNewCat, setAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Charity / maaser
  const [charityEligible, setCharityEligible] = useState<null | boolean>(null);
  const [charityPct, setCharityPct] = useState("10");
  const [charityOverrideAmount, setCharityOverrideAmount] = useState("");
  const [isCharityPayment, setIsCharityPayment] = useState<null | boolean>(null);
  const [charityGiveAmount, setCharityGiveAmount] = useState("");
  const [charityGiveKind, setCharityGiveKind] = useState("cash");

  // Multi-currency
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [entryCurrency, setEntryCurrency] = useState("USD");
  const [converting, setConverting] = useState(false);

  // filters
  const [fCategory, setFCategory] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fMinAmount, setFMinAmount] = useState("");
  const [fMaxAmount, setFMaxAmount] = useState("");
  const [fTag, setFTag] = useState("");

  const load = () => {
    fetch("/api/transactions").then((r) => r.json()).then(setTxns);
    fetch("/api/charity").then((r) => r.json()).then(setCharityEntries);
  };
  const loadCategories = () => fetch("/api/categories").then((r) => r.json()).then(setCategories);
  useEffect(() => {
    load();
    loadCategories();
    fetch("/api/settings/general").then((r) => r.json()).then((d) => {
      setCharityPct(String(d.charityDefaultPct ?? 10));
      setBaseCurrency(d.baseCurrencyCode || "USD");
      setEntryCurrency(d.baseCurrencyCode || "USD");
    });
  }, []);

  const catsForType = categories.filter((c) => c.type === type);
  const voice = useVoiceInput(catsForType.map((c) => c.name));
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const startVoice = () => {
    voice.start((parsed, raw) => {
      setVoiceTranscript(raw);
      if (parsed.amount) setAmount(parsed.amount);
      if (parsed.category) {
        const match = catsForType.find((c) => c.name.toLowerCase() === parsed.category.toLowerCase());
        setCategory(match ? match.name : parsed.category);
      }
    });
  };
  useEffect(() => {
    setCharityEligible(null); setIsCharityPayment(null);
    if (!catsForType.find((c) => c.name === category)) setCategory(catsForType[0]?.name || "");
  }, [type, categories]);

  const confirmNewCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    const created = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    }).then((r) => r.json());
    setCategory(created.name);
    setNewCatName(""); setAddingNewCat(false);
    loadCategories();
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setReceiptImage(await compressImage(file)); } catch {}
    setUploading(false);
  };

  const charityAmount = charityOverrideAmount ? parseFloat(charityOverrideAmount) || 0 : (parseFloat(amount) || 0) * (parseFloat(charityPct) || 0) / 100;

  const add = async () => {
    const amt = parseFloat(amount);
    if (!amt || !category) return;

    let finalAmount = amt;
    let currencyCode: string | null = null;
    let originalAmount: number | null = null;
    if (entryCurrency !== baseCurrency) {
      setConverting(true);
      const { rate } = await fetch(`/api/currency?from=${entryCurrency}&to=${baseCurrency}`).then((r) => r.json());
      setConverting(false);
      if (rate) {
        finalAmount = Math.round(amt * rate * 100) / 100;
        currencyCode = entryCurrency;
        originalAmount = amt;
      }
    }

    const created = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, category, amount: finalAmount, date, tags: tags || null, receiptImage, currencyCode, originalAmount }),
    }).then((r) => r.json());

    if (type === "income" && charityEligible && charityAmount > 0) {
      await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "owed", amount: Math.round(charityAmount * 100) / 100, date, note: `${charityPct}% of ${category} income`, transactionId: created.id }),
      });
    }
    if (type === "expense" && isCharityPayment) {
      const giveAmt = parseFloat(charityGiveAmount) || finalAmount;
      await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "given", kind: charityGiveKind, amount: giveAmt, date, note: `Paid via ${category}`, transactionId: created.id }),
      });
    }

    setAmount(""); setTags(""); setReceiptImage(null);
    setCharityEligible(null); setCharityOverrideAmount(""); setIsCharityPayment(null); setCharityGiveAmount(""); setCharityGiveKind("cash");
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

  const charityByTxn: Record<string, any> = {};
  charityEntries.forEach((c) => { if (c.transactionId) charityByTxn[c.transactionId] = c; });

  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportSummary(null);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) { setImporting(false); setImportSummary("No data rows found."); return; }

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = {
      date: header.findIndex((h) => h.includes("date")),
      type: header.findIndex((h) => h === "type"),
      category: header.findIndex((h) => h.includes("account") || h.includes("category")),
      amount: header.findIndex((h) => h.includes("amount")),
      vendor: header.findIndex((h) => h.includes("vendor")),
      note: header.findIndex((h) => h.includes("note")),
    };
    if (idx.date === -1 || idx.amount === -1) {
      setImporting(false);
      setImportSummary("Couldn't find Date and Amount columns — expected headers like Date, Type, Account, Amount.");
      return;
    }

    let success = 0, failed = 0;
    for (const row of rows.slice(1)) {
      const amt = parseFloat((row[idx.amount] || "").replace(/[^0-9.\-]/g, ""));
      const dateVal = row[idx.date];
      if (!amt || !dateVal) { failed++; continue; }
      const parsedDate = new Date(dateVal);
      if (isNaN(parsedDate.getTime())) { failed++; continue; }
      try {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: idx.type !== -1 && row[idx.type]?.toLowerCase().includes("income") ? "income" : "expense",
            category: idx.category !== -1 ? row[idx.category] || "Imported" : "Imported",
            amount: Math.abs(amt),
            date: parsedDate.toISOString(),
            vendor: idx.vendor !== -1 ? row[idx.vendor] : undefined,
            note: idx.note !== -1 ? row[idx.note] : undefined,
          }),
        });
        success++;
      } catch { failed++; }
    }
    setImporting(false);
    setImportSummary(`Imported ${success} transaction${success !== 1 ? "s" : ""}${failed ? `, ${failed} skipped` : ""}.`);
    load();
    loadCategories();
  };

  return (
    <main className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ color: "#0F3D2E" }}>Transactions</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label className="btn-outline" style={{ cursor: "pointer" }}>
            {importing ? "Importing…" : "Import CSV"}
            <input type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <a href="/api/export" className="btn-outline" style={{ textDecoration: "none" }}>Export CSV</a>
        </div>
      </div>
      {importSummary && <div style={{ fontSize: 12.5, color: "#5B5540", marginTop: 4, marginBottom: 8 }}>{importSummary}</div>}
      {voiceTranscript && <div style={{ fontSize: 12.5, color: "#5B5540", marginTop: 4, marginBottom: 8 }}>Heard: "{voiceTranscript}" — check the amount and account before adding.</div>}

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 110 }}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <div>
          {addingNewCat ? (
            <div style={{ display: "flex", gap: 4 }}>
              <input autoFocus value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Groceries" style={{ width: 130 }} onKeyDown={(e) => e.key === "Enter" && confirmNewCategory()} />
              <button className="btn" onClick={confirmNewCategory} style={{ padding: "9px 10px" }}>OK</button>
            </div>
          ) : (
            <select value={category} onChange={(e) => { if (e.target.value === "__new__") setAddingNewCat(true); else setCategory(e.target.value); }} style={{ width: 160 }}>
              {catsForType.length === 0 && <option value="">No accounts yet</option>}
              {catsForType.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              <option value="__new__">+ New account…</option>
            </select>
          )}
        </div>
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: 110 }} />
        <select value={entryCurrency} onChange={(e) => setEntryCurrency(e.target.value)} style={{ width: 90 }}>
          {Array.from(new Set([baseCurrency, "USD", "EUR", "GBP", "ILS", "CAD"])).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {voice.supported && (
          <button type="button" className={voice.listening ? "btn" : "btn-outline"} onClick={startVoice} style={{ padding: "9px 12px" }} title="Speak amount and account">
            {voice.listening ? "🎙️ Listening…" : "🎙️"}
          </button>
        )}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 150 }} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" style={{ width: 180 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["Joint", "Personal"].map((label) => {
            const has = tags.split(",").map((t) => t.trim().toLowerCase()).includes(label.toLowerCase());
            return (
              <button
                key={label}
                type="button"
                className={has ? "btn" : "btn-outline"}
                style={{ padding: "9px 12px", fontSize: 12 }}
                onClick={() => {
                  const parts = tags.split(",").map((t) => t.trim()).filter(Boolean);
                  const other = label === "Joint" ? "Personal" : "Joint";
                  const withoutOther = parts.filter((p) => p.toLowerCase() !== other.toLowerCase());
                  if (has) setTags(withoutOther.filter((p) => p.toLowerCase() !== label.toLowerCase()).join(", "));
                  else setTags([...withoutOther.filter((p) => p.toLowerCase() !== label.toLowerCase()), label].join(", "));
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div>
          <label className="btn-outline" style={{ display: "inline-block", cursor: "pointer" }}>
            {uploading ? "…" : receiptImage ? "Photo added ✓" : "Add receipt"}
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </label>
        </div>
        <button className="btn" onClick={add} disabled={converting}>{converting ? "Converting…" : "Add"}</button>
      </div>

      {type === "income" && (
        <div className="card" style={{ marginBottom: 16, background: "#FBF9F2" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: charityEligible ? 10 : 0 }}>Does this count toward your charity obligation?</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={charityEligible === true ? "btn" : "btn-outline"} onClick={() => setCharityEligible(true)} style={{ padding: "6px 16px", fontSize: 12.5 }}>Yes</button>
            <button className={charityEligible === false ? "btn" : "btn-outline"} onClick={() => setCharityEligible(false)} style={{ padding: "6px 16px", fontSize: 12.5 }}>No</button>
          </div>
          {charityEligible && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, flexWrap: "wrap" }}>
              <input type="number" value={charityPct} onChange={(e) => { setCharityPct(e.target.value); setCharityOverrideAmount(""); }} style={{ width: 55 }} />
              % = <span className="num" style={{ fontWeight: 600 }}>${charityAmount.toFixed(2)}</span>
              <span style={{ color: "#8A8370" }}>or set exact amount:</span>
              <input type="number" step="0.01" value={charityOverrideAmount} onChange={(e) => setCharityOverrideAmount(e.target.value)} placeholder="optional" style={{ width: 100 }} />
            </div>
          )}
        </div>
      )}
      {type === "expense" && (
        <div className="card" style={{ marginBottom: 16, background: "#FBF9F2" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: isCharityPayment ? 10 : 0 }}>Is this a charity payment?</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={isCharityPayment === true ? "btn" : "btn-outline"} onClick={() => setIsCharityPayment(true)} style={{ padding: "6px 16px", fontSize: 12.5 }}>Yes</button>
            <button className={isCharityPayment === false ? "btn" : "btn-outline"} onClick={() => setIsCharityPayment(false)} style={{ padding: "6px 16px", fontSize: 12.5 }}>No</button>
          </div>
          {isCharityPayment && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, flexWrap: "wrap" }}>
              <span>Subtract</span>
              <input type="number" value={charityGiveAmount} onChange={(e) => setCharityGiveAmount(e.target.value)} placeholder={amount || "0"} style={{ width: 90 }} />
              <span>— full amount if left blank — from what I owe</span>
            </div>
          )}
        </div>
      )}

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
                <div style={{ fontSize: 11, color: "#8A8370" }}>
                  {t.date.slice(0, 10)}
                  {t.currencyCode && t.originalAmount != null && (
                    <span style={{ marginLeft: 6 }}>· originally {t.originalAmount.toFixed(2)} {t.currencyCode}</span>
                  )}
                  {charityByTxn[t.id] && (
                    <span className="pill" style={{ marginLeft: 6, background: charityByTxn[t.id].type === "owed" ? "#F0EAD8" : "#E3EDE7" }}>
                      Charity {charityByTxn[t.id].type === "owed" ? "set aside" : "given"} ${charityByTxn[t.id].amount.toFixed(2)}
                    </span>
                  )}
                </div>
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
