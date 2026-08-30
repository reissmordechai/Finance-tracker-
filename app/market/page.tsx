"use client";
import { useState, useEffect } from "react";
import LineChart from "../components/LineChart";

export default function MarketPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [range, setRange] = useState<"1M" | "6M" | "1Y">("1M");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const currencyOptions = ["USD", "EUR", "GBP", "ILS", "CAD"];
  const [fxFrom, setFxFrom] = useState("USD");
  const [fxTo, setFxTo] = useState("ILS");
  const [fxAmount, setFxAmount] = useState("1");
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState("");

  const checkRate = async () => {
    setFxError(""); setFxRate(null);
    if (fxFrom === fxTo) { setFxRate(1); return; }
    setFxLoading(true);
    try {
      const res = await fetch(`/api/currency?from=${fxFrom}&to=${fxTo}`);
      const data = await res.json();
      if (data.rate) setFxRate(data.rate);
      else setFxError("Rate unavailable right now — try again shortly.");
    } catch {
      setFxError("Rate unavailable right now — try again shortly.");
    }
    setFxLoading(false);
  };

  useEffect(() => {
    checkRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fxFrom, fxTo]);

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
    setResults(await res.json());
    setSearching(false);
  };

  const select = async (item: any) => {
    setSelected(item);
    setLoadingDetail(true);
    const [quoteRes, historyRes, newsRes] = await Promise.all([
      fetch(`/api/market/quote?symbol=${item.symbol}`).then((r) => r.json()),
      fetch(`/api/market/history?symbol=${item.symbol}&range=${range}`).then((r) => r.json()),
      fetch(`/api/market/news?symbol=${item.symbol}`).then((r) => r.json()),
    ]);
    setQuote(quoteRes); setHistory(historyRes); setNews(newsRes);
    setLoadingDetail(false);
  };

  const changeRange = async (r: "1M" | "6M" | "1Y") => {
    setRange(r);
    if (!selected) return;
    setLoadingDetail(true);
    const historyRes = await fetch(`/api/market/history?symbol=${selected.symbol}&range=${r}`).then((res) => res.json());
    setHistory(historyRes);
    setLoadingDetail(false);
  };

  return (
    <main className="page">
      <h1 style={{ color: "#0F3D2E" }}>Market</h1>
      <p style={{ fontSize: 13, color: "#5B5540", marginTop: -8 }}>
        Look up any stock — price, recent performance, and headlines. Uses your free Alpha Vantage key, which has a daily limit, so search deliberately.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Exchange rates</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input type="number" step="0.01" value={fxAmount} onChange={(e) => setFxAmount(e.target.value)} style={{ width: 120 }} />
          <select value={fxFrom} onChange={(e) => setFxFrom(e.target.value)} style={{ width: 90 }}>
            {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ color: "#8A8370" }}>&rarr;</span>
          <select value={fxTo} onChange={(e) => setFxTo(e.target.value)} style={{ width: 90 }}>
            {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {fxLoading && <span style={{ color: "#8A8370", fontSize: 13 }}>Updating…</span>}
        </div>
        {fxRate !== null && !fxLoading && (
          <div style={{ marginTop: 10, fontSize: 20 }}>
            <span className="num" style={{ fontWeight: 700, color: "#0F3D2E" }}>{((parseFloat(fxAmount) || 0) * fxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fxTo}</span>
            <div style={{ fontSize: 12.5, color: "#8A8370", marginTop: 2 }}>1 {fxFrom} = <span className="num">{fxRate.toFixed(4)}</span> {fxTo} · updated just now</div>
          </div>
        )}
        {fxError && <div style={{ marginTop: 8, fontSize: 12.5, color: "#9C4221", fontWeight: 500 }}>{fxError}</div>}
      </div>

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search a company or symbol, e.g. Apple or AAPL" style={{ flex: 1 }} />
        <button className="btn" onClick={search}>{searching ? "…" : "Search"}</button>
      </div>

      {results.length > 0 && !selected && (
        <div className="card" style={{ marginBottom: 16 }}>
          {results.map((r) => (
            <div key={r.symbol} className="clickable" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #EFEADC", cursor: "pointer" }} onClick={() => select(r)}>
              <div>
                <strong>{r.symbol}</strong> — {r.name}
              </div>
              <span style={{ fontSize: 12, color: "#8A8370" }}>{r.region}</span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <>
          <button className="btn-outline" style={{ marginBottom: 12 }} onClick={() => { setSelected(null); setQuote(null); setHistory([]); setNews([]); }}>&larr; Back to results</button>

          {loadingDetail ? (
            <div className="card">Loading…</div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#0F3D2E" }}>{selected.symbol} <span style={{ fontWeight: 400, fontSize: 14, color: "#8A8370" }}>{selected.name}</span></div>
                {quote ? (
                  <>
                    <div className="num" style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>${quote.price?.toFixed(2)}</div>
                    <div className="num" style={{ fontSize: 14, color: quote.change >= 0 ? "#2F6B4F" : "#9C4221" }}>
                      {quote.change >= 0 ? "+" : ""}{quote.change?.toFixed(2)} ({quote.changePercent})
                    </div>
                    <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
                      <div><div style={{ fontSize: 11, color: "#8A8370" }}>High</div><div className="num">${quote.high?.toFixed(2)}</div></div>
                      <div><div style={{ fontSize: 11, color: "#8A8370" }}>Low</div><div className="num">${quote.low?.toFixed(2)}</div></div>
                      <div><div style={{ fontSize: 11, color: "#8A8370" }}>Prev close</div><div className="num">${quote.previousClose?.toFixed(2)}</div></div>
                      <div><div style={{ fontSize: 11, color: "#8A8370" }}>Volume</div><div className="num">{quote.volume?.toLocaleString()}</div></div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: "#8A8370", marginTop: 8 }}>Quote unavailable right now.</div>
                )}
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>Price history</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["1M", "6M", "1Y"] as const).map((r) => (
                      <button key={r} className={range === r ? "btn" : "btn-outline"} onClick={() => changeRange(r)} style={{ padding: "5px 12px", fontSize: 12 }}>{r}</button>
                    ))}
                  </div>
                </div>
                {history.length > 0 ? <LineChart points={history} /> : <div style={{ color: "#8A8370" }}>No history available.</div>}
              </div>

              {news.length > 0 && (
                <div className="card">
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>Recent headlines</div>
                  {news.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "8px 0", borderTop: i > 0 ? "1px solid #EFEADC" : "none", textDecoration: "none", color: "inherit" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "#8A8370" }}>{n.source}</div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
