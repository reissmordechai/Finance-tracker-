import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/stockPrice";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const holdings = await prisma.holding.findMany({
    where: { userId: auth.userId },
    include: {
      entries: { orderBy: { date: "asc" } },
      history: { orderBy: { date: "asc" } },
    },
  });
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  let shares = 0;

  if (body.symbol) {
    const price = await getCurrentPrice(body.symbol);
    if (price) shares = body.amount / price;
  }

  const holding = await prisma.holding.create({
    data: {
      userId: auth.userId,
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
