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

  // Price updates apply per-holding regardless of owner, so this loop
  // doesn't need to be split by user.
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

  // Net worth is personal, so snapshot it once per user, not once globally.
  const userIds = await prisma.user.findMany({ select: { id: true } });
  for (const { id: userId } of userIds) {
    const userHoldings = await prisma.holding.findMany({ where: { userId } });
    const totalHoldings = userHoldings.reduce((s, h) => s + h.currentValue, 0);
    const bankAccounts = await prisma.bankAccount.findMany({ where: { userId } });
    const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0);
    const cards = await prisma.card.findMany({ where: { userId }, include: { payments: true } });
    const transactions = await prisma.transaction.findMany({ where: { userId } });
    const cardDebt = cards.reduce((sum, c) => {
      const charged = transactions.filter((t) => t.type === "expense" && t.cardId === c.id).reduce((s, t) => s + t.amount, 0);
      const paid = c.payments.reduce((s, p) => s + p.amount, 0);
      return sum + (charged - paid);
    }, 0);
    const loans = await prisma.loan.findMany({ where: { userId } });
    const loanDebt = loans.reduce((s, l) => s + l.balance, 0);
    const netWorth = totalBank + totalHoldings - cardDebt - loanDebt;
    await prisma.netWorthSnapshot.create({ data: { userId, date: new Date(), value: netWorth } });
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString(), results, usersSnapshotted: userIds.length });
}
