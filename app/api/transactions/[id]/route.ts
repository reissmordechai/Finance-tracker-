import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  if (body.action === "restore") {
    const txn = await prisma.transaction.update({ where: { id: params.id }, data: { deletedAt: null } });
    return NextResponse.json(txn);
  }

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
      tags: body.tags,
    },
  });
  return NextResponse.json(txn);
}

// Soft-delete by default (sets deletedAt, recoverable from Trash for 30 days).
// Pass ?permanent=1 to actually remove it (used from the Trash page itself).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const permanent = req.nextUrl.searchParams.get("permanent") === "1";
  if (permanent) {
    await prisma.transaction.delete({ where: { id: params.id } });
  } else {
    await prisma.transaction.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  }
  return NextResponse.json({ ok: true });
}
