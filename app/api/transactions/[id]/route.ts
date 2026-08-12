import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const txn = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      type: body.type,
      date: body.date ? new Date(body.date) : undefined,
      category: body.category,
      amount: body.amount,
      note: body.note,
      vendor: body.vendor,
      paymentMethod: body.paymentMethod,
      cardId: body.cardId,
      bankAccountId: body.bankAccountId,
      checkNumber: body.checkNumber,
    },
  });
  return NextResponse.json(txn);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.transaction.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
