// Fetches the current price for a ticker symbol.
// Uses Alpha Vantage's free GLOBAL_QUOTE endpoint by default.
// Swap this out for FMP, viaNexus, or any other provider — just keep the
// same function signature so the rest of the app doesn't need to change.

export async function getCurrentPrice(symbol: string): Promise<number | null> {
  const apiKey = process.env.STOCK_API_KEY;
  if (!apiKey) {
    console.error("STOCK_API_KEY is not set");
    return null;
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    const price = parseFloat(data?.["Global Quote"]?.["05. price"]);
    if (!price || isNaN(price)) {
      console.error("Unexpected response from stock API:", data);
      return null;
    }
    return price;
  } catch (err) {
    console.error("Stock price lookup failed:", err);
    return null;
  }
}

// Full quote with change/high/low/volume, not just the price.
export async function getQuote(symbol: string) {
  const apiKey = process.env.STOCK_API_KEY;
  if (!apiKey) return null;
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    const q = data?.["Global Quote"];
    if (!q || !q["05. price"]) return null;
    return {
      symbol: q["01. symbol"],
      price: parseFloat(q["05. price"]),
      change: parseFloat(q["09. change"]),
      changePercent: q["10. change percent"],
      high: parseFloat(q["03. high"]),
      low: parseFloat(q["04. low"]),
      volume: parseInt(q["06. volume"], 10),
      previousClose: parseFloat(q["08. previous close"]),
      latestTradingDay: q["07. latest trading day"],
    };
  } catch (err) {
    console.error("getQuote failed:", err);
    return null;
  }
}

// Search for a symbol by name or keyword, e.g. "apple" -> AAPL
export async function searchSymbol(keywords: string) {
  const apiKey = process.env.STOCK_API_KEY;
  if (!apiKey) return [];
  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    const matches = data?.["bestMatches"] || [];
    return matches.slice(0, 8).map((m: any) => ({
      symbol: m["1. symbol"],
      name: m["2. name"],
      region: m["4. region"],
      currency: m["8. currency"],
    }));
  } catch (err) {
    console.error("searchSymbol failed:", err);
    return [];
  }
}

// Historical daily closes. Alpha Vantage's free "compact" size returns the
// most recent ~100 trading days (covers roughly the last 4-5 months);
// "full" returns the entire history (needed for a real 1-year view).
export async function getHistory(symbol: string, range: "1M" | "6M" | "1Y") {
  const apiKey = process.env.STOCK_API_KEY;
  if (!apiKey) return [];
  const outputsize = range === "1Y" ? "full" : "compact";
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=${outputsize}&apikey=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    const series = data?.["Time Series (Daily)"];
    if (!series) return [];
    const days = range === "1M" ? 22 : range === "6M" ? 130 : 365;
    return Object.entries(series)
      .slice(0, days)
      .map(([date, v]: [string, any]) => ({ date, value: parseFloat(v["4. close"]) }))
      .reverse();
  } catch (err) {
    console.error("getHistory failed:", err);
    return [];
  }
}

// Recent news headlines for a symbol. Titles/links only — no article text,
// since reproducing full articles isn't something we do here.
export async function getNews(symbol: string) {
  const apiKey = process.env.STOCK_API_KEY;
  if (!apiKey) return [];
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbol)}&limit=6&apikey=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    const feed = data?.feed || [];
    return feed.slice(0, 6).map((n: any) => ({
      title: n.title,
      url: n.url,
      source: n.source,
      timePublished: n.time_published,
    }));
  } catch (err) {
    console.error("getNews failed:", err);
    return [];
  }
}

// Live currency conversion rate, e.g. from="EUR", to="USD". Uses the same
// Alpha Vantage key as stock lookups (it supports forex too).
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  const apiKey = process.env.STOCK_API_KEY;
  if (!apiKey) return null;
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${encodeURIComponent(from)}&to_currency=${encodeURIComponent(to)}&apikey=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    const rate = data?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
    return rate ? parseFloat(rate) : null;
  } catch (err) {
    console.error("getExchangeRate failed:", err);
    return null;
  }
}
