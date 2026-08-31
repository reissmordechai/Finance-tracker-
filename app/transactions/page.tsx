"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseCsv } from "@/lib/csv";
import { useVoiceInput } from "../components/useVoiceInput";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";
import ConfirmSaveButton from "../components/ConfirmSaveButton";
import Autocomplete from "../components/Autocomplete";
import { scanReceipt } from "@/lib/receiptOcr";

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

function paymentLabel(t: any, cards: any[], accounts: any[]): string | null {
  if (!t.paymentMethod || t.paymentMethod === "cash") return null;
  if (t.paymentMethod === "card") {
    const c = cards.find((x) => x.id === t.cardId);
    return c ? `paid with ${c.name}` : "paid with credit card";
  }
  if (t.paymentMethod === "debit") {
    const a = accounts.find((x) => x.id === t.bankAccountId);
    return a ? `paid from ${a.name}` : "paid from account";
  }
  if (t.paymentMethod === "check") return t.checkNumber ? `check #${t.checkNumber}` : "paid by check";
  if (t.paymentMethod === "other") return t.paymentOther ? `paid via ${t.paymentOther}` : "other payment method";
  return null;
}

export default function TransactionsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [charityEntries, setCharityEntries] = useState<any[]>([]);
  const [type, setType] = useState("expense");
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendor, setVendor] = useState("");
  const [boughtFor, setBoughtFor] = useState("");
  const [categoryAutoFilled, setCategoryAutoFilled] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
  const [editTxnType, setEditTxnType] = useState("expense");
  const [editTxnCategory, setEditTxnCategory] = useState("");
  const [editTxnAmount, setEditTxnAmount] = useState("");
  const [editTxnDate, setEditTxnDate] = useState("");
  const [editTxnVendor, setEditTxnVendor] = useState("");
  const [editTxnBoughtFor, setEditTxnBoughtFor] = useState("");
  const [editTxnGovProgramName, setEditTxnGovProgramName] = useState("");
  const [editTxnGovProgramAmount, setEditTxnGovProgramAmount] = useState("");
  const [editTxnTags, setEditTxnTags] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash");
  const [editPayCardId, setEditPayCardId] = useState("");
  const [editPayBankAccountId, setEditPayBankAccountId] = useState("");
  const [editPayCheckNumber, setEditPayCheckNumber] = useState("");
  const [editPaymentOther, setEditPaymentOther] = useState("");
  const [showItems, setShowItems] = useState(false);
  const [items, setItems] = useState<{ id: string; name: string; qty: string; unit: string; unitPrice: string }[]>([]);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [govProgramEnabled, setGovProgramEnabled] = useState(false);
  const [govProgramName, setGovProgramName] = useState("");
  const [govProgramAmount, setGovProgramAmount] = useState("");
  const [govProgramFull, setGovProgramFull] = useState(true);
  const [splitCategory2, setSplitCategory2] = useState("");
  const [splitAmount2, setSplitAmount2] = useState("");
  const [expandedItemsId, setExpandedItemsId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [payCardId, setPayCardId] = useState("");
  const [payBankAccountId, setPayBankAccountId] = useState("");
  const [payCheckNumber, setPayCheckNumber] = useState("");
  const [paymentOther, setPaymentOther] = useState("");
  const [cardsList, setCardsList] = useState<any[]>([]);

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
  const [addError, setAddError] = useState("");

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
  const loadVendors = () => fetch("/api/vendors").then((r) => r.json()).then(setVendors);
  const [bankAccountsList, setBankAccountsList] = useState<any[]>([]);
  useEffect(() => {
    load();
    loadCategories();
    loadVendors();
    fetch("/api/cards").then((r) => r.json()).then(setCardsList);
    fetch("/api/bankaccounts").then((r) => r.json()).then(setBankAccountsList);
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

  // When a vendor is chosen (exact match to an existing vendor), suggest the
  // account most often used with them in the past — still fully editable.
  useEffect(() => {
    const v = vendor.trim().toLowerCase();
    if (!v) { setCategoryAutoFilled(false); return; }
    const matches = txns.filter((t) => t.type === type && t.vendor && t.vendor.trim().toLowerCase() === v);
    if (matches.length === 0) { setCategoryAutoFilled(false); return; }
    const counts: Record<string, { count: number; lastDate: string }> = {};
    matches.forEach((t) => {
      if (!counts[t.category]) counts[t.category] = { count: 0, lastDate: t.date };
      counts[t.category].count++;
      if (t.date > counts[t.category].lastDate) counts[t.category].lastDate = t.date;
    });
    const [bestCategory] = Object.entries(counts).sort(
      (a, b) => b[1].count - a[1].count || (b[1].lastDate > a[1].lastDate ? 1 : -1)
    )[0];
    setCategory(bestCategory);
    setCategoryAutoFilled(true);
  }, [vendor, type, txns]);

  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [receiptScanNote, setReceiptScanNote] = useState("");

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setReceiptScanNote("");
    try { setReceiptImage(await compressImage(file)); } catch {}
    setUploading(false);

    setScanningReceipt(true);
    try {
      const guess = await scanReceipt(file);
      const filledParts: string[] = [];
      if (guess.amount && !amount) { setAmount(String(guess.amount)); filledParts.push(`amount $${guess.amount.toFixed(2)}`); }
      if (guess.vendor && !vendor) { setVendor(guess.vendor); filledParts.push(`vendor "${guess.vendor}"`); }
      setReceiptScanNote(
        filledParts.length > 0
          ? `Filled in ${filledParts.join(" and ")} from the receipt — please double-check before saving.`
          : "Couldn't read this receipt clearly — please fill in the details manually."
      );
    } catch {
      setReceiptScanNote("Couldn't scan this receipt — please fill in the details manually.");
    }
    setScanningReceipt(false);
  };

  const charityAmount = charityOverrideAmount ? parseFloat(charityOverrideAmount) || 0 : (parseFloat(amount) || 0) * (parseFloat(charityPct) || 0) / 100;

  const addItemRow = () => setItems((prev) => [...prev, { id: crypto.randomUUID(), name: "", qty: "1", unit: "", unitPrice: "" }]);
  const updateItemRow = (id: string, field: string, value: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  const removeItemRow = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const itemsTotal = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0), 0);

  const add = async () => {
    setAddError("");
    const amt = parseFloat(amount);
    if (!amt) { setAddError("Enter an amount first."); return; }
    if (!category) {
      setAddError(
        catsForType.length === 0
          ? `You don't have any ${type} accounts yet — type a name in the account field above and tap "+ Add" to create one.`
          : "Choose an account."
      );
      return;
    }

    const splitAmt2 = splitEnabled ? parseFloat(splitAmount2) : 0;
    if (splitEnabled && (!splitCategory2 || !splitAmt2 || splitAmt2 >= amt)) {
      setAddError("Fix the split amounts before adding — the second account's amount must be less than the total.");
      return;
    }

    if (govProgramEnabled) {
      if (!govProgramName.trim()) { setAddError("Enter the program name."); return; }
      if (!govProgramFull) {
        const gAmt = parseFloat(govProgramAmount);
        if (!gAmt || gAmt > amt) { setAddError("Enter a valid program amount — it can't be more than the total."); return; }
      }
    }
    const finalGovProgramAmount = govProgramEnabled ? (govProgramFull ? amt : parseFloat(govProgramAmount)) : null;

    let rate = 1;
    let currencyCode: string | null = null;
    if (entryCurrency !== baseCurrency) {
      setConverting(true);
      const res = await fetch(`/api/currency?from=${entryCurrency}&to=${baseCurrency}`).then((r) => r.json());
      setConverting(false);
      if (res.rate) { rate = res.rate; currencyCode = entryCurrency; }
    }

    const amt1 = splitEnabled ? amt - splitAmt2 : amt;
    const finalAmount1 = Math.round(amt1 * rate * 100) / 100;
    const finalAmount2 = splitEnabled ? Math.round(splitAmt2 * rate * 100) / 100 : 0;

    const validItems = items.filter((it) => it.name.trim() && parseFloat(it.qty) > 0);
    const splitGroupId = splitEnabled ? crypto.randomUUID() : null;

    const created = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type, category, amount: finalAmount1, date, tags: tags || null, vendor: vendor || null, boughtFor: boughtFor || null, receiptImage,
        govProgramName: govProgramEnabled ? govProgramName : null, govProgramAmount: finalGovProgramAmount,
        currencyCode, originalAmount: currencyCode ? amt1 : null,
        paymentMethod, cardId: paymentMethod === "card" ? payCardId || null : null,
        bankAccountId: paymentMethod === "debit" ? payBankAccountId || null : null,
        checkNumber: paymentMethod === "check" ? payCheckNumber || null : null,
        paymentOther: paymentMethod === "other" ? paymentOther || null : null,
        items: validItems.map((it) => ({ name: it.name, qty: parseFloat(it.qty) || 0, unit: it.unit || "each", unitPrice: parseFloat(it.unitPrice) || 0 })),
        splitGroupId, splitIndex: splitGroupId ? 0 : null, splitCount: splitGroupId ? 2 : null,
      }),
    }).then((r) => r.json());

    if (splitGroupId) {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, category: splitCategory2, amount: finalAmount2, date, tags: tags || null, vendor: vendor || null, boughtFor: boughtFor || null,
          currencyCode, originalAmount: currencyCode ? splitAmt2 : null,
          paymentMethod, cardId: paymentMethod === "card" ? payCardId || null : null,
          bankAccountId: paymentMethod === "debit" ? payBankAccountId || null : null,
          checkNumber: paymentMethod === "check" ? payCheckNumber || null : null,
          paymentOther: paymentMethod === "other" ? paymentOther || null : null,
          splitGroupId, splitIndex: 1, splitCount: 2,
        }),
      });
    }

    if (type === "income" && charityEligible && charityAmount > 0) {
      await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "owed", amount: Math.round(charityAmount * 100) / 100, date, note: `${charityPct}% of ${category} income`, transactionId: created.id }),
      });
    }
    if (type === "expense" && isCharityPayment) {
      const giveAmt = parseFloat(charityGiveAmount) || finalAmount1;
      await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "given", kind: charityGiveKind, amount: giveAmt, date, note: `Paid via ${category}`, transactionId: created.id }),
      });
    }

    setAmount(""); setTags(""); setVendor(""); setBoughtFor(""); setReceiptImage(null);
    setReceiptScanNote("");
    setGovProgramEnabled(false); setGovProgramName(""); setGovProgramAmount(""); setGovProgramFull(true);
    setSplitEnabled(false); setSplitCategory2(""); setSplitAmount2("");
    setCategoryAutoFilled(false); setAddError("");
    setCharityEligible(null); setCharityOverrideAmount(""); setIsCharityPayment(null); setCharityGiveAmount(""); setCharityGiveKind("cash");
    setItems([]); setShowItems(false);
    setPaymentMethod("cash"); setPayCardId(""); setPayBankAccountId(""); setPayCheckNumber(""); setPaymentOther("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const startEditTxn = (t: any) => {
    setEditingTxnId(t.id);
    setEditTxnType(t.type);
    setEditTxnCategory(t.category);
    setEditTxnAmount(String(t.amount));
    setEditTxnDate(t.date.slice(0, 10));
    setEditTxnVendor(t.vendor || "");
    setEditTxnBoughtFor(t.boughtFor || "");
    setEditTxnGovProgramName(t.govProgramName || "");
    setEditTxnGovProgramAmount(t.govProgramAmount != null ? String(t.govProgramAmount) : "");
    setEditTxnTags(t.tags || "");
    setEditPaymentMethod(t.paymentMethod || "cash");
    setEditPayCardId(t.cardId || "");
    setEditPayBankAccountId(t.bankAccountId || "");
    setEditPayCheckNumber(t.checkNumber || "");
    setEditPaymentOther(t.paymentOther || "");
  };
  const saveEditTxn = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editTxnType,
        category: editTxnCategory,
        amount: parseFloat(editTxnAmount) || 0,
        date: editTxnDate,
        vendor: editTxnVendor || null,
        boughtFor: editTxnBoughtFor || null,
        govProgramName: editTxnGovProgramName || null,
        govProgramAmount: editTxnGovProgramName ? (parseFloat(editTxnGovProgramAmount) || parseFloat(editTxnAmount) || 0) : null,
        tags: editTxnTags || null,
        paymentMethod: editPaymentMethod,
        cardId: editPaymentMethod === "card" ? editPayCardId || null : null,
        bankAccountId: editPaymentMethod === "debit" ? editPayBankAccountId || null : null,
        checkNumber: editPaymentMethod === "check" ? editPayCheckNumber || null : null,
        paymentOther: editPaymentMethod === "other" ? editPaymentOther || null : null,
      }),
    });
    setEditingTxnId(null);
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
          <Autocomplete
            value={category}
            onChange={(v) => { setCategory(v); setCategoryAutoFilled(false); }}
            options={catsForType.map((c) => ({
              value: c.name,
              label: c.name,
              group: c.parentId ? catsForType.find((p) => p.id === c.parentId)?.name : undefined,
            }))}
            placeholder="Type to search accounts…"
            onCreateNew={async (name) => {
              const created = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, type }),
              }).then((r) => r.json());
              setCategory(created.name);
              setCategoryAutoFilled(false);
              loadCategories();
            }}
            style={{ width: 180 }}
          />
          {categoryAutoFilled && (
            <div style={{ fontSize: 10.5, color: "#B0A88E", marginTop: 2 }}>usual account for this vendor</div>
          )}
        </div>
        <div>
          <Autocomplete
            value={vendor}
            onChange={setVendor}
            options={vendors.map((v) => ({ value: v.name, label: v.name }))}
            placeholder="Vendor (optional)"
            onCreateNew={async (name) => {
              const created = await fetch("/api/vendors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              }).then((r) => r.json());
              setVendor(created.name);
              loadVendors();
            }}
            style={{ width: 180 }}
          />
        </div>
        <input value={boughtFor} onChange={(e) => setBoughtFor(e.target.value)} placeholder="Bought for (optional)" style={{ width: 150 }} />
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
        <button type="button" className={showItems ? "btn" : "btn-outline"} onClick={() => setShowItems((s) => !s)} style={{ padding: "9px 12px", fontSize: 13 }}>
          {showItems ? "Hide items" : "+ Itemize"}
        </button>
        <button type="button" className={splitEnabled ? "btn" : "btn-outline"} onClick={() => setSplitEnabled((s) => !s)} style={{ padding: "9px 12px", fontSize: 13 }}>
          {splitEnabled ? "Cancel split" : "Split into 2 accounts"}
        </button>
        <button type="button" className={govProgramEnabled ? "btn" : "btn-outline"} onClick={() => setGovProgramEnabled((s) => !s)} style={{ padding: "9px 12px", fontSize: 13 }}>
          {govProgramEnabled ? "Cancel program payment" : "Paid by a federal program"}
        </button>
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
        <div style={{ width: "100%", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
          <label style={{ fontSize: 11, color: "#8A8370" }}>Paid with</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: 130 }}>
            <option value="cash">Cash</option>
            <option value="debit">Account (debit)</option>
            <option value="card">Credit card</option>
            <option value="check">Check</option>
            <option value="other">Other</option>
          </select>
          {paymentMethod === "card" && (
            <select value={payCardId} onChange={(e) => setPayCardId(e.target.value)} style={{ width: 160 }}>
              <option value="">Which card?</option>
              {cardsList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {paymentMethod === "debit" && (
            <select value={payBankAccountId} onChange={(e) => setPayBankAccountId(e.target.value)} style={{ width: 160 }}>
              <option value="">Which account?</option>
              {bankAccountsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          {paymentMethod === "check" && (
            <input value={payCheckNumber} onChange={(e) => setPayCheckNumber(e.target.value)} placeholder="Check #" style={{ width: 120 }} />
          )}
          {paymentMethod === "other" && (
            <input value={paymentOther} onChange={(e) => setPaymentOther(e.target.value)} placeholder="Describe how (e.g. Venmo, gift card)" style={{ width: 220 }} />
          )}
        </div>
        <div>
          <label className="btn-outline" style={{ display: "inline-block", cursor: "pointer" }}>
            {uploading ? "…" : receiptImage ? "Photo added ✓" : "Scan receipt"}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
          </label>
          {scanningReceipt && <div style={{ fontSize: 11.5, color: "#8A8370", marginTop: 4 }}>Reading receipt…</div>}
          {!scanningReceipt && receiptScanNote && <div style={{ fontSize: 11.5, color: "#5B7B7A", marginTop: 4, maxWidth: 220 }}>{receiptScanNote}</div>}
        </div>
        <button className="btn" onClick={add} disabled={converting}>{converting ? "Converting…" : "Add"}</button>
        {addError && (
          <div style={{ width: "100%", fontSize: 12.5, color: "#9C4221", fontWeight: 500 }}>{addError}</div>
        )}
      </div>

      {showItems && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Itemize this transaction</div>
          {items.map((it) => (
            <div key={it.id} style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
              <input value={it.name} onChange={(e) => updateItemRow(it.id, "name", e.target.value)} placeholder="Item name" style={{ flex: 2, minWidth: 120 }} />
              <input type="number" step="0.01" value={it.qty} onChange={(e) => updateItemRow(it.id, "qty", e.target.value)} placeholder="Qty" style={{ width: 70 }} />
              <input value={it.unit} onChange={(e) => updateItemRow(it.id, "unit", e.target.value)} placeholder="unit" style={{ width: 70 }} />
              <input type="number" step="0.01" value={it.unitPrice} onChange={(e) => updateItemRow(it.id, "unitPrice", e.target.value)} placeholder="Price each" style={{ width: 100 }} />
              <span className="num" style={{ fontSize: 12, color: "#8A8370", width: 60 }}>${((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)).toFixed(2)}</span>
              <button onClick={() => removeItemRow(it.id)} style={{ border: "none", background: "none", color: "#B0A88E" }}>✕</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <button className="btn-outline" onClick={addItemRow} style={{ padding: "6px 12px", fontSize: 12 }}>+ Add item</button>
            {items.length > 0 && (
              <span style={{ fontSize: 12.5, color: "#5B5540" }}>
                Items total: <span className="num" style={{ fontWeight: 600 }}>${itemsTotal.toFixed(2)}</span>
                {Math.abs(itemsTotal - (parseFloat(amount) || 0)) > 0.01 && amount && (
                  <button onClick={() => setAmount(itemsTotal.toFixed(2))} className="pill" style={{ marginLeft: 8, border: "none", cursor: "pointer" }}>Use as amount</button>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {splitEnabled && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Split this transaction across two accounts</div>
          <div style={{ fontSize: 12, color: "#8A8370", marginBottom: 8 }}>
            The main amount above (${amount || "0.00"}) will be split — enter how much of it goes to a second account below; the rest stays under "{category || "the first account"}".
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select value={splitCategory2} onChange={(e) => setSplitCategory2(e.target.value)} style={{ width: 160 }}>
              <option value="">Second account…</option>
              {catsForType.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <input type="number" step="0.01" value={splitAmount2} onChange={(e) => setSplitAmount2(e.target.value)} placeholder="Amount for second account" style={{ width: 180 }} />
          </div>
          {splitAmount2 && amount && (
            <div style={{ fontSize: 12, color: "#5B5540", marginTop: 8 }}>
              {parseFloat(splitAmount2) >= parseFloat(amount) ? (
                <span style={{ color: "#9C4221" }}>This has to be less than the total amount.</span>
              ) : (
                <>"{category || "First account"}" gets <span className="num">${(parseFloat(amount) - parseFloat(splitAmount2)).toFixed(2)}</span>, "{splitCategory2 || "second account"}" gets <span className="num">${parseFloat(splitAmount2).toFixed(2)}</span></>
              )}
            </div>
          )}
        </div>
      )}

      {govProgramEnabled && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Paid by a federal or state program</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button type="button" className={govProgramFull ? "btn" : "btn-outline"} onClick={() => setGovProgramFull(true)} style={{ padding: "6px 16px", fontSize: 12.5 }}>Full purchase</button>
            <button type="button" className={!govProgramFull ? "btn" : "btn-outline"} onClick={() => setGovProgramFull(false)} style={{ padding: "6px 16px", fontSize: 12.5 }}>Only part of it</button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input value={govProgramName} onChange={(e) => setGovProgramName(e.target.value)} placeholder="Program name, e.g. SNAP, WIC" style={{ width: 200 }} />
            {!govProgramFull && (
              <input type="number" step="0.01" value={govProgramAmount} onChange={(e) => setGovProgramAmount(e.target.value)} placeholder="Amount covered" style={{ width: 160 }} />
            )}
          </div>
          {govProgramName && (
            <div style={{ fontSize: 12, color: "#5B5540", marginTop: 8 }}>
              {govProgramFull ? (
                <>The full ${amount || "0.00"} was covered by <strong>{govProgramName}</strong>.</>
              ) : govProgramAmount && amount ? (
                parseFloat(govProgramAmount) > parseFloat(amount) ? (
                  <span style={{ color: "#9C4221" }}>This can't be more than the total amount.</span>
                ) : (
                  <><strong>{govProgramName}</strong> covered <span className="num">${parseFloat(govProgramAmount).toFixed(2)}</span> of the ${amount} total — the rest was paid another way.</>
                )
              ) : (
                <>Enter how much {govProgramName} covered.</>
              )}
            </div>
          )}
        </div>
      )}

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
          editingTxnId === t.id ? (
            <div key={t.id} style={{ padding: "12px 14px", borderBottom: "1px solid #EFEADC", background: "#FBF9F2" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <select value={editTxnType} onChange={(e) => setEditTxnType(e.target.value)} style={{ width: 100 }}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <Autocomplete
                  value={editTxnCategory}
                  onChange={setEditTxnCategory}
                  options={categories.filter((c) => c.type === editTxnType).map((c) => ({ value: c.name, label: c.name }))}
                  placeholder="Account"
                  style={{ width: 150 }}
                />
                <input type="number" step="0.01" value={editTxnAmount} onChange={(e) => setEditTxnAmount(e.target.value)} placeholder="Amount" style={{ width: 100 }} />
                <input type="date" value={editTxnDate} onChange={(e) => setEditTxnDate(e.target.value)} style={{ width: 140 }} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <Autocomplete
                  value={editTxnVendor}
                  onChange={setEditTxnVendor}
                  options={vendors.map((v) => ({ value: v.name, label: v.name }))}
                  placeholder="Vendor (optional)"
                  style={{ width: 160 }}
                />
                <input value={editTxnBoughtFor} onChange={(e) => setEditTxnBoughtFor(e.target.value)} placeholder="Bought for (optional)" style={{ width: 150 }} />
                <input value={editTxnGovProgramName} onChange={(e) => setEditTxnGovProgramName(e.target.value)} placeholder="Program (optional), e.g. SNAP" style={{ width: 160 }} />
                {editTxnGovProgramName && (
                  <input type="number" step="0.01" value={editTxnGovProgramAmount} onChange={(e) => setEditTxnGovProgramAmount(e.target.value)} placeholder="Amount covered" style={{ width: 140 }} />
                )}
                <input value={editTxnTags} onChange={(e) => setEditTxnTags(e.target.value)} placeholder="Tags (comma separated)" style={{ flex: 1, minWidth: 140 }} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                <label style={{ fontSize: 11, color: "#8A8370" }}>Paid with</label>
                <select value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)} style={{ width: 130 }}>
                  <option value="cash">Cash</option>
                  <option value="debit">Account (debit)</option>
                  <option value="card">Credit card</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
                {editPaymentMethod === "card" && (
                  <select value={editPayCardId} onChange={(e) => setEditPayCardId(e.target.value)} style={{ width: 160 }}>
                    <option value="">Which card?</option>
                    {cardsList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {editPaymentMethod === "debit" && (
                  <select value={editPayBankAccountId} onChange={(e) => setEditPayBankAccountId(e.target.value)} style={{ width: 160 }}>
                    <option value="">Which account?</option>
                    {bankAccountsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
                {editPaymentMethod === "check" && (
                  <input value={editPayCheckNumber} onChange={(e) => setEditPayCheckNumber(e.target.value)} placeholder="Check #" style={{ width: 110 }} />
                )}
                {editPaymentMethod === "other" && (
                  <input value={editPaymentOther} onChange={(e) => setEditPaymentOther(e.target.value)} placeholder="Describe how" style={{ width: 180 }} />
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <ConfirmSaveButton onConfirm={() => saveEditTxn(t.id)} />
                <button className="btn-outline" onClick={() => setEditingTxnId(null)} style={{ padding: "5px 10px", fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          ) : (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #EFEADC" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {t.receiptImage && (
                <img
                  src={t.receiptImage}
                  onClick={() => setLightbox(t.receiptImage)}
                  style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #E4DEC9" }}
                />
              )}
              <button onClick={() => startEditTxn(t)} style={{ border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
                <div>{t.category}{t.vendor && <span style={{ color: "#8A8370" }}> · {t.vendor}</span>}{t.boughtFor && <span className="pill" style={{ marginLeft: 6 }}>for {t.boughtFor}</span>}{t.govProgramName && <span className="pill" style={{ marginLeft: 6 }}>{t.govProgramName}{t.govProgramAmount && t.govProgramAmount < t.amount ? ` $${t.govProgramAmount.toFixed(2)}` : " (full)"}</span>}{t.tags && <span className="pill" style={{ marginLeft: 6 }}>{t.tags.split(",")[0].trim()}</span>}{t.splitGroupId && <span className="pill" style={{ marginLeft: 6 }}>split</span>}</div>
                <div style={{ fontSize: 11, color: "#8A8370" }}>
                  {t.date.slice(0, 10)}
                  {paymentLabel(t, cardsList, bankAccountsList) && (
                    <span style={{ marginLeft: 6 }}>· {paymentLabel(t, cardsList, bankAccountsList)}</span>
                  )}
                  {t.currencyCode && t.originalAmount != null && (
                    <span style={{ marginLeft: 6 }}>· originally {t.originalAmount.toFixed(2)} {t.currencyCode}</span>
                  )}
                  {charityByTxn[t.id] && (
                    <span className="pill" style={{ marginLeft: 6, background: charityByTxn[t.id].type === "owed" ? "#F0EAD8" : "#E3EDE7" }}>
                      Charity {charityByTxn[t.id].type === "owed" ? "set aside" : "given"} ${charityByTxn[t.id].amount.toFixed(2)}
                    </span>
                  )}
                </div>
              </button>
              {t.items && t.items.length > 0 && (
                <div style={{ marginTop: 2 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedItemsId(expandedItemsId === t.id ? null : t.id); }}
                    style={{ border: "none", background: "none", padding: 0, fontSize: 11, color: "#B8863E", cursor: "pointer" }}
                  >
                    {expandedItemsId === t.id ? "Hide" : `${t.items.length} item${t.items.length !== 1 ? "s" : ""}`}
                  </button>
                  {expandedItemsId === t.id && (
                    <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: "2px solid #EFEADC" }}>
                      {t.items.map((it: any) => (
                        <div key={it.id} style={{ fontSize: 11.5, color: "#5B5540", display: "flex", justifyContent: "space-between", maxWidth: 260 }}>
                          <span>{it.qty} {it.unit} {it.name}</span>
                          <span className="num">${(it.qty * it.unitPrice).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="num" style={{ color: t.type === "income" ? "#2F6B4F" : "#9C4221", fontWeight: 600 }}>
                {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
              </span>
              <ConfirmDeleteButton onConfirm={() => remove(t.id)} />
            </div>
          </div>
          )
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
