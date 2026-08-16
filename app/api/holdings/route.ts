import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/stockPrice";

export async function GET() {
  const holdings = await prisma.holding.findMany({
    include: {
      entries: { orderBy: { date: "asc" } },
      history: { orderBy: { date: "asc" } },
    },
  });
  return NextResponse.json(holdings);
}

// body: { name, account?, symbol?, amount, date }
// If a symbol is given, we look up today's price and record how many
// "shares" that contribution bought — that's what lets the cron job later
// compute value = shares × current price instead of just overwriting a number.
export async function POST(req: NextRequest) {
  const body = await req.json();
  let shares = 0;

  if (body.symbol) {
    const price = await getCurrentPrice(body.symbol);
    if (price) shares = body.amount / price;
  }

  const holding = await prisma.holding.create({
    data: {
      name: body.name,
      account: body.account || null,
      symbol: body.symbol || null,
      currencyCode: body.currencyCode || "USD",
      shares,
      currentValue: body.amount,
      entries: { create: [{ date: new Date(body.date), amount: body.amount }] },
      history: { create: [{ date: new Date(body.date), value: body.amount, source: "manual" }] },
    },
    include: { entries: true, history: true },
  });
  return NextResponse.json(holding);
}
