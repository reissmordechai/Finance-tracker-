import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();

  if (body.action === "restore") {
    await prisma.transaction.updateMany({ where: { id: params.id, userId: auth.userId }, data: { deletedAt: null } });
    const txn = await prisma.transaction.findFirst({ where: { id: params.id, userId: auth.userId } });
    return NextResponse.json(txn);
  }

  await prisma.transaction.updateMany({
    where: { id: params.id, userId: auth.userId },
    data: {
      type: body.type,
      date: body.date ? new Date(body.date) : undefined,
      category: body.category,
      amount: body.amount,
      note: body.note,
      vendor: body.vendor,
      paymentMethod: body.paymentMethod,
      paymentOther: body.paymentOther,
      cardId: body.cardId,
      bankAccountId: body.bankAccountId,
      checkNumber: body.checkNumber,
      tags: body.tags,
    },
  });
  const txn = await prisma.transaction.findFirst({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json(txn);
}

// Soft-delete by default (sets deletedAt, recoverable from Trash for 30 days).
// Pass ?permanent=1 to actually remove it (used from the Trash page itself).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const permanent = req.nextUrl.searchParams.get("permanent") === "1";
  if (permanent) {
    await prisma.transaction.deleteMany({ where: { id: params.id, userId: auth.userId } });
  } else {
    await prisma.transaction.updateMany({ where: { id: params.id, userId: auth.userId }, data: { deletedAt: new Date() } });
  }
  return NextResponse.json({ ok: true });
}
