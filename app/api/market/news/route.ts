import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/stockPrice";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";
  if (!symbol) return NextResponse.json([]);
  const news = await getNews(symbol);
  return NextResponse.json(news);
}
