import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
  const card = await prisma.card.findUnique({ where: { id: params.id } });
  if (card) {
    await prisma.card.update({
      where: { id: params.id },
      data: { amountDue: Math.max(0, card.amountDue - body.amount) },
    });
  }
  return NextResponse.json(payment);
}
