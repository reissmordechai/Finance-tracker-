import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getExchangeRate } from "@/lib/stockPrice";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const transfers = await prisma.transfer.findMany({ where: { userId: auth.userId }, orderBy: { date: "desc" }, take: 30 });
  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const { fromAccountId, toAccountId, amount, date, note } = body;
  if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || !amount) {
    return NextResponse.json({ error: "Invalid transfer" }, { status: 400 });
  }

  const fromAccount = await prisma.bankAccount.findFirst({ where: { id: fromAccountId, userId: auth.userId } });
  const toAccount = await prisma.bankAccount.findFirst({ where: { id: toAccountId, userId: auth.userId } });
  if (!fromAccount || !toAccount) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let convertedAmount = amount;
  if (fromAccount.currencyCode !== toAccount.currencyCode) {
    const rate = await getExchangeRate(fromAccount.currencyCode, toAccount.currencyCode);
    if (rate) convertedAmount = Math.round(amount * rate * 100) / 100;
  }

  await prisma.bankAccount.update({ where: { id: fromAccountId }, data: { balance: fromAccount.balance - amount } });
  await prisma.bankAccount.update({ where: { id: toAccountId }, data: { balance: toAccount.balance + convertedAmount } });

  const transfer = await prisma.transfer.create({
    data: {
      userId: auth.userId,
      fromAccountId, toAccountId, amount, convertedAmount,
      date: date ? new Date(date) : new Date(),
      note: note || null,
    },
  });

  return NextResponse.json(transfer);
}
