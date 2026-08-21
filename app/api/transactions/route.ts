import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { adjustLinkedAccountForTransaction } from "@/lib/linkedAccount";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const trash = req.nextUrl.searchParams.get("trash") === "1";
  const txns = await prisma.transaction.findMany({
    where: { userId: auth.userId, ...(trash ? { deletedAt: { not: null } } : { deletedAt: null }) },
    include: { items: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(txns);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const txn = await prisma.transaction.create({
    data: {
      userId: auth.userId,
      type: body.type,
      date: new Date(body.date),
      category: body.category,
      amount: body.amount,
      note: body.note || "",
      vendor: body.vendor || "",
      paymentMethod: body.paymentMethod || "cash",
      paymentOther: body.paymentOther || null,
      cardId: body.cardId || null,
      bankAccountId: body.bankAccountId || null,
      checkNumber: body.checkNumber || null,
      taxRate: body.tax?.rate ?? null,
      taxAmount: body.tax?.amount ?? null,
      receiptImage: body.receiptImage || null,
      tags: body.tags || null,
      currencyCode: body.currencyCode || null,
      originalAmount: body.originalAmount ?? null,
      splitGroupId: body.splitGroupId || null,
      splitIndex: body.splitIndex ?? null,
      splitCount: body.splitCount ?? null,
      items: body.items?.length
        ? { create: body.items.map((it: any) => ({ name: it.name, qty: it.qty, unit: it.unit, unitPrice: it.unitPrice })) }
        : undefined,
    },
    include: { items: true },
  });
  await adjustLinkedAccountForTransaction(auth.userId, txn.type, txn.category, txn.amount, 1);
  return NextResponse.json(txn);
}
