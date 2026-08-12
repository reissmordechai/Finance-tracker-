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
