import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const recurring = await prisma.recurring.findMany({ where: { userId: auth.userId } });
  return NextResponse.json(recurring);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const rule = await prisma.recurring.create({
    data: {
      userId: auth.userId,
      type: body.type,
      category: body.category,
      amount: body.amount,
      frequency: body.frequency,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      paymentMethod: body.paymentMethod || "cash",
      cardId: body.cardId || null,
      bankAccountId: body.bankAccountId || null,
      note: body.note || null,
      postTo: body.postTo || "transaction",
      holdingId: body.postTo === "holding" ? body.holdingId : null,
    },
  });
  return NextResponse.json(rule);
}
