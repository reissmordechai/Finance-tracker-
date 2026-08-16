import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const card = await prisma.card.update({
    where: { id: params.id },
    data: {
      name: body.name,
      limit: body.limit,
      dueDay: body.dueDay,
      amountDue: body.amountDue,
      apr: body.apr,
    },
  });
  return NextResponse.json(card);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.cardPayment.deleteMany({ where: { cardId: params.id } });
  await prisma.card.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
