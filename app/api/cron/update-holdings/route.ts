import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/stockPrice";

// Vercel Cron calls this on the schedule set in vercel.json, sending
// Authorization: Bearer <CRON_SECRET>. Reject anything else so a random
// visitor can't trigger it (or waste your stock API quota).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const holdings = await prisma.holding.findMany({ where: { symbol: { not: null } } });
  const results: any[] = [];

  for (const h of holdings) {
    if (!h.symbol) continue;
    const price = await getCurrentPrice(h.symbol);
    if (price === null) {
      results.push({ id: h.id, name: h.name, symbol: h.symbol, updated: false, reason: "price lookup failed" });
      continue;
    }
    const newValue = h.shares * price;
    await prisma.holding.update({ where: { id: h.id }, data: { currentValue: newValue } });
    await prisma.holdingValue.create({
      data: { holdingId: h.id, value: newValue, date: new Date(), source: "cron" },
    });
    results.push({ id: h.id, name: h.name, symbol: h.symbol, price, newValue, updated: true });
  }

  // Also snapshot net worth today (bank + all holdings − card debt), so the
  // dashboard can show a trend over time instead of just today's number.
  const allHoldings = await prisma.holding.findMany();
  const totalHoldings = allHoldings.reduce((s, h) => s + h.currentValue, 0);
  const bankAccounts = await prisma.bankAccount.findMany();
  const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const cards = await prisma.card.findMany({ include: { payments: true } });
  const transactions = await prisma.transaction.findMany();
  const cardDebt = cards.reduce((sum, c) => {
    const charged = transactions.filter((t) => t.type === "expense" && t.cardId === c.id).reduce((s, t) => s + t.amount, 0);
    const paid = c.payments.reduce((s, p) => s + p.amount, 0);
    return sum + (charged - paid);
  }, 0);
  const netWorth = totalBank + totalHoldings - cardDebt;
  await prisma.netWorthSnapshot.create({ data: { date: new Date(), value: netWorth } });

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString(), results, netWorth });
}
