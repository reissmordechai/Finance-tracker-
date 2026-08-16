import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const card = await prisma.card.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const payment = await prisma.cardPayment.create({
    data: {
      cardId: params.id,
      date: new Date(body.date),
      amount: body.amount,
      fromAccountId: body.fromAccountId || null,
      checkNumber: body.checkNumber || null,
      note: body.note || null,
    },
  });
  await prisma.card.update({
    where: { id: params.id },
    data: { amountDue: Math.max(0, card.amountDue - body.amount) },
  });
  // Actually deduct from the chosen bank account — only if it belongs to this user.
  if (body.fromAccountId) {
    const account = await prisma.bankAccount.findFirst({ where: { id: body.fromAccountId, userId: auth.userId } });
    if (account) {
      await prisma.bankAccount.update({ where: { id: body.fromAccountId }, data: { balance: account.balance - body.amount } });
    }
  }
  return NextResponse.json(payment);
}
