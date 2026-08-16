import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function addInterval(date: Date, freq: string): Date {
  const d = new Date(date.getTime());
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function GET() {
  const bankAccounts = await prisma.bankAccount.findMany();
  const startBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const rules = await prisma.recurring.findMany({ where: { paused: false, postTo: "transaction" } });
  const cards = await prisma.card.findMany();
  const loans = await prisma.loan.findMany();

  type Event = { date: Date; label: string; delta: number };
  const events: Event[] = [];

  for (const rule of rules) {
    if (rule.endDate && rule.endDate < today) continue;
    let cursor = rule.lastGenerated ? addInterval(rule.lastGenerated, rule.frequency) : new Date(rule.startDate);
    let guard = 0;
    while (cursor <= endOfMonth && guard < 200) {
      if (cursor >= today && (!rule.endDate || cursor <= rule.endDate)) {
        events.push({ date: cursor, label: rule.category, delta: rule.type === "income" ? rule.amount : -rule.amount });
      }
      cursor = addInterval(cursor, rule.frequency);
      guard++;
    }
  }

  for (const c of cards) {
    if (c.amountDue > 0 && c.dueDay) {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), c.dueDay);
      if (dueDate >= today && dueDate <= endOfMonth) {
        events.push({ date: dueDate, label: `${c.name} payment due`, delta: -c.amountDue });
      }
    }
  }

  for (const l of loans) {
    if (l.minPayment && l.dueDay) {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), l.dueDay);
      if (dueDate >= today && dueDate <= endOfMonth) {
        events.push({ date: dueDate, label: `${l.name} payment due`, delta: -l.minPayment });
      }
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  let running = startBalance;
  const timeline = events.map((e) => {
    running += e.delta;
    return { date: e.date.toISOString(), label: e.label, delta: e.delta, runningBalance: Math.round(running * 100) / 100 };
  });

  return NextResponse.json({
    startBalance,
    projectedEndBalance: Math.round(running * 100) / 100,
    asOf: today.toISOString(),
    monthEnd: endOfMonth.toISOString(),
    timeline,
  });
}
