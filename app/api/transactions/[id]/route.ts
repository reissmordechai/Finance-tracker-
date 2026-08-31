import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { adjustLinkedAccountForTransaction } from "@/lib/linkedAccount";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();

  if (body.action === "restore") {
    const existing = await prisma.transaction.findFirst({ where: { id: params.id, userId: auth.userId } });
    await prisma.transaction.updateMany({ where: { id: params.id, userId: auth.userId }, data: { deletedAt: null } });
    if (existing) await adjustLinkedAccountForTransaction(auth.userId, existing.type, existing.category, existing.amount, 1);
    const txn = await prisma.transaction.findFirst({ where: { id: params.id, userId: auth.userId } });
    return NextResponse.json(txn);
  }

  // Reverse the old linked-account effect (if any) before applying the edit,
  // then apply the new one — this way changing amount/category/type never
  // double-counts or leaves a stale adjustment behind.
  const before = await prisma.transaction.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (before) await adjustLinkedAccountForTransaction(auth.userId, before.type, before.category, before.amount, -1);

  await prisma.transaction.updateMany({
    where: { id: params.id, userId: auth.userId },
    data: {
      type: body.type,
      date: body.date ? new Date(body.date) : undefined,
      category: body.category,
      amount: body.amount,
      note: body.note,
      vendor: body.vendor,
      boughtFor: body.boughtFor,
      govProgramName: body.govProgramName,
      govProgramAmount: body.govProgramAmount,
      paymentMethod: body.paymentMethod,
      paymentOther: body.paymentOther,
      cardId: body.cardId,
      bankAccountId: body.bankAccountId,
      checkNumber: body.checkNumber,
      tags: body.tags,
    },
  });
  const txn = await prisma.transaction.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (txn) await adjustLinkedAccountForTransaction(auth.userId, txn.type, txn.category, txn.amount, 1);
  return NextResponse.json(txn);
}

// Soft-delete by default (sets deletedAt, recoverable from Trash for 30 days).
// Pass ?permanent=1 to actually remove it (used from the Trash page itself,
// which only ever acts on items already soft-deleted — so the linked-account
// effect was already reversed when it was trashed, and permanent delete
// doesn't need to touch it again).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const permanent = req.nextUrl.searchParams.get("permanent") === "1";
  if (permanent) {
    await prisma.transaction.deleteMany({ where: { id: params.id, userId: auth.userId } });
  } else {
    const existing = await prisma.transaction.findFirst({ where: { id: params.id, userId: auth.userId } });
    await prisma.transaction.updateMany({ where: { id: params.id, userId: auth.userId }, data: { deletedAt: new Date() } });
    if (existing) await adjustLinkedAccountForTransaction(auth.userId, existing.type, existing.category, existing.amount, -1);
  }
  return NextResponse.json({ ok: true });
}
