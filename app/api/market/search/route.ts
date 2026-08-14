import { NextRequest, NextResponse } from "next/server";
import { searchSymbol } from "@/lib/stockPrice";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json([]);
  const results = await searchSymbol(q);
  return NextResponse.json(results);
}
