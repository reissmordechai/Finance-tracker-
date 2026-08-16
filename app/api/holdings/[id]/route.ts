import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/stockPrice";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const holding = await prisma.holding.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!holding) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body.action === "contribute") {
    let addedShares = 0;
    if (holding.symbol) {
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

  const updated = await prisma.holding.findUnique({
    where: { id: params.id },
    include: { entries: true, history: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  await prisma.holding.deleteMany({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
