import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/stockPrice";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";
  if (!symbol) return NextResponse.json(null);
  const quote = await getQuote(symbol);
  return NextResponse.json(quote);
}
