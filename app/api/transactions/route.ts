import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const trash = req.nextUrl.searchParams.get("trash") === "1";
  const txns = await prisma.transaction.findMany({
    where: trash ? { deletedAt: { not: null } } : { deletedAt: null },
    include: { items: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(txns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const txn = await prisma.transaction.create({
    data: {
      type: body.type,
      date: new Date(body.date),
      category: body.category,
      amount: body.amount,
      note: body.note || "",
      vendor: body.vendor || "",
      paymentMethod: body.paymentMethod || "cash",
      cardId: body.cardId || null,
      bankAccountId: body.bankAccountId || null,
      checkNumber: body.checkNumber || null,
      taxRate: body.tax?.rate ?? null,
      taxAmount: body.tax?.amount ?? null,
      receiptImage: body.receiptImage || null,
      tags: body.tags || null,
      items: body.items?.length
        ? { create: body.items.map((it: any) => ({ name: it.name, qty: it.qty, unit: it.unit, unitPrice: it.unitPrice })) }
        : undefined,
    },
    include: { items: true },
  });
  return NextResponse.json(txn);
}
