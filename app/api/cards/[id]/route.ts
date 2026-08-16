import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  await prisma.card.updateMany({
    where: { id: params.id, userId: auth.userId },
    data: { name: body.name, limit: body.limit, dueDay: body.dueDay, amountDue: body.amountDue, apr: body.apr },
  });
  const card = await prisma.card.findFirst({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json(card);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const card = await prisma.card.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!card) return NextResponse.json({ ok: true });
  await prisma.cardPayment.deleteMany({ where: { cardId: params.id } });
  await prisma.card.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
