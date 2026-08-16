import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/stockPrice";

function addInterval(date: Date, freq: string): Date {
  const d = new Date(date.getTime());
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1); // monthly default
  return d;
}

// Called daily by Vercel Cron. Walks each active recurring rule forward from
// its last posted date (or start date) and creates a real Transaction for
// every occurrence that's now due — stopping at today, and at the rule's
// end date if one is set.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const rules = await prisma.recurring.findMany({ where: { paused: false } });
  const results: any[] = [];

  for (const rule of rules) {
    let cursor = rule.lastGenerated ? addInterval(rule.lastGenerated, rule.frequency) : new Date(rule.startDate);
    let posted = 0;
    let guard = 0;

    while (cursor <= today && (!rule.endDate || cursor <= rule.endDate) && guard < 500) {
      if (rule.postTo === "holding" && rule.holdingId) {
        const holding = await prisma.holding.findUnique({ where: { id: rule.holdingId } });
        if (holding) {
          let newShares = holding.shares;
          if (holding.symbol) {
            const price = await getCurrentPrice(holding.symbol);
            if (price) newShares = holding.shares + rule.amount / price;
          }
          await prisma.holdingEntry.create({ data: { holdingId: holding.id, date: cursor, amount: rule.amount } });
          await prisma.holding.update({ where: { id: holding.id }, data: { currentValue: holding.currentValue + rule.amount, shares: newShares } });
        }
      } else if (rule.postTo === "charity") {
        await prisma.charityEntry.create({
          data: { date: cursor, type: "given", kind: "cash", amount: rule.amount, note: `Recurring gift: ${rule.category}` },
        });
      } else {
        await prisma.transaction.create({
          data: {
            type: rule.type,
            date: cursor,
            category: rule.category,
            amount: rule.amount,
            note: rule.note || "",
            paymentMethod: rule.paymentMethod,
            cardId: rule.paymentMethod === "card" ? rule.cardId : null,
            bankAccountId: rule.paymentMethod === "debit" ? rule.bankAccountId : null,
            checkNumber: rule.checkNumber,
            recurringId: rule.id,
          },
        });
      }
      await prisma.recurring.update({ where: { id: rule.id }, data: { lastGenerated: cursor } });
      posted++;
      cursor = addInterval(cursor, rule.frequency);
      guard++;
    }

    if (posted > 0) results.push({ id: rule.id, category: rule.category, posted });
  }

  // Empty the trash — permanently remove anything soft-deleted more than 30 days ago
  const cutoff = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const purged = await prisma.transaction.deleteMany({ where: { deletedAt: { lt: cutoff } } });

  return NextResponse.json({ ok: true, checkedAt: today.toISOString(), results, trashPurged: purged.count });
}
