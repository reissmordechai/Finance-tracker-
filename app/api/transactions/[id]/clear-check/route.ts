import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

// Marks a pending check as cleared and deducts it from the bank account it
// was drawn on. One-way: there's no "un-clear" once the balance has moved.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const txn = await prisma.transaction.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (txn.paymentMethod !== "check") return NextResponse.json({ error: "Not a check" }, { status: 400 });
  if (txn.checkCleared) return NextResponse.json({ error: "Already cleared" }, { status: 400 });
  if (!txn.bankAccountId) return NextResponse.json({ error: "This check isn't linked to an account" }, { status: 400 });

  const account = await prisma.bankAccount.findFirst({ where: { id: txn.bankAccountId, userId: auth.userId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.transaction.update({ where: { id: txn.id }, data: { checkCleared: true } }),
    prisma.bankAccount.update({ where: { id: account.id }, data: { balance: account.balance - txn.amount } }),
  ]);

  return NextResponse.json({ ok: true });
}
