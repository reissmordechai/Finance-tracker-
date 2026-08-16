import { NextRequest, NextResponse } from "next/server";
import { getExchangeRate } from "@/lib/stockPrice";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") || "";
  const to = req.nextUrl.searchParams.get("to") || "";
  if (!from || !to) return NextResponse.json({ rate: null });
  const rate = await getExchangeRate(from.toUpperCase(), to.toUpperCase());
  return NextResponse.json({ from, to, rate });
}
