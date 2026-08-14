import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/stockPrice";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";
  const range = (req.nextUrl.searchParams.get("range") || "1M") as "1M" | "6M" | "1Y";
  if (!symbol) return NextResponse.json([]);
  const history = await getHistory(symbol, range);
  return NextResponse.json(history);
}
