import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/stockPrice";

// body: { action: "contribute", amount, date } | { action: "updateValue", value, date }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  if (body.action === "contribute") {
    const holding = await prisma.holding.findUnique({ where: { id: params.id } });
    let addedShares = 0;
    if (holding?.symbol) {
      const price = await getCurrentPrice(holding.symbol);
      if (price) addedShares = body.amount / price;
    }
    await prisma.holdingEntry.create({
      data: { holdingId: params.id, amount: body.amount, date: new Date(body.date) },
    });
    if (addedShares) {
      await prisma.holding.update({
        where: { id: params.id },
        data: { shares: { increment: addedShares } },
      });
    }
  }

  if (body.action === "updateValue") {
    await prisma.holding.update({
      where: { id: params.id },
      data: { currentValue: body.value },
    });
    await prisma.holdingValue.create({
      data: { holdingId: params.id, value: body.value, date: new Date(body.date), source: body.source || "manual" },
    });
  }

  const holding = await prisma.holding.findUnique({
    where: { id: params.id },
    include: { entries: true, history: true },
  });
  return NextResponse.json(holding);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.holding.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
