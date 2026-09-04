import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import webpush from "web-push";

function addInterval(date: Date, freq: string): Date {
  const d = new Date(date.getTime());
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}
function nextMonthlyOccurrence(day: number, now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), day);
  if (d < now) d.setMonth(d.getMonth() + 1);
  return d;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Called daily by Vercel Cron. For each user with at least one push
// subscription, finds anything due tomorrow (a recurring bill, a card
// payment, or a loan payment) and sends one push notification per item —
// simple and predictable, a day's notice before it's due.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:no-reply@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const now = new Date();
  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) return NextResponse.json({ sent: 0, note: "No subscriptions" });

  const userIds = Array.from(new Set(subs.map((s) => s.userId)));
  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const userId of userIds) {
    const [recurringRules, cards, loans] = await Promise.all([
      prisma.recurring.findMany({ where: { userId, paused: false } }),
      prisma.card.findMany({ where: { userId } }),
      prisma.loan.findMany({ where: { userId } }),
    ]);

    const dueItems: { name: string; amount: number }[] = [];
    recurringRules.forEach((r) => {
      const next = r.lastGenerated ? addInterval(r.lastGenerated, r.frequency) : new Date(r.startDate);
      if (isSameDay(next, tomorrow)) dueItems.push({ name: r.category, amount: r.amount });
    });
    cards.forEach((c) => {
      if (!c.dueDay || c.amountDue <= 0) return;
      if (isSameDay(nextMonthlyOccurrence(c.dueDay, now), tomorrow)) dueItems.push({ name: `${c.name} (card)`, amount: c.amountDue });
    });
    loans.forEach((l) => {
      if (!l.dueDay || !l.minPayment) return;
      if (isSameDay(nextMonthlyOccurrence(l.dueDay, now), tomorrow)) dueItems.push({ name: `${l.name} (loan)`, amount: l.minPayment });
    });

    if (dueItems.length === 0) continue;
    const body = dueItems.length === 1
      ? `${dueItems[0].name}: $${dueItems[0].amount.toFixed(2)} due tomorrow`
      : `${dueItems.length} payments due tomorrow: ${dueItems.map((i) => i.name).join(", ")}`;

    const userSubs = subs.filter((s) => s.userId === userId);
    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: "Payment due tomorrow", body, url: "/" })
        );
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) staleEndpoints.push(sub.endpoint);
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }

  return NextResponse.json({ sent, cleaned: staleEndpoints.length });
}
