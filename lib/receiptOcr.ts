// Client-side receipt scanning: runs OCR entirely in the browser (no API key,
// no server round-trip) and makes a best-effort guess at the total amount
// and the vendor name. The caller always treats these as a starting point —
// the person reviews and can edit/clear them before saving anything.

export type ReceiptGuess = {
  amount: number | null;
  vendor: string | null;
  rawText: string;
};

function guessAmount(text: string): number | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const moneyRe = /\$?\s?(\d{1,5}(?:[.,]\d{2}))\b/;

  // Prefer a line that looks like a grand total (not "subtotal").
  const totalKeywords = ["total due", "amount due", "grand total", "balance due", "total"];
  for (const kw of totalKeywords) {
    const line = lines.find(
      (l) => l.toLowerCase().includes(kw) && !l.toLowerCase().includes("subtotal")
    );
    if (line) {
      const m = line.match(moneyRe);
      if (m) return parseFloat(m[1].replace(",", "."));
    }
  }

  // Fallback: the largest dollar-looking number anywhere on the receipt —
  // usually the total is the biggest line item plus tax.
  const all: number[] = [];
  const re = /\$?\s?(\d{1,5}[.,]\d{2})\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    all.push(parseFloat(match[1].replace(",", ".")));
  }
  if (all.length === 0) return null;
  return Math.max(...all);
}

function guessVendor(text: string): string | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  // Store names are usually one of the first couple of lines, in letters
  // (not a pure number/date/address line), and reasonably short.
  for (const line of lines.slice(0, 5)) {
    const letters = line.replace(/[^a-zA-Z]/g, "");
    if (letters.length >= 3 && line.length <= 40 && !/^\d/.test(line)) {
      return line;
    }
  }
  return null;
}

export async function scanReceipt(file: File | Blob): Promise<ReceiptGuess> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(file, "eng");
  const text = data.text || "";
  return {
    amount: guessAmount(text),
    vendor: guessVendor(text),
    rawText: text,
  };
}
