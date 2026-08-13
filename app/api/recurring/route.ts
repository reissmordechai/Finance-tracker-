import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const recurring = await prisma.recurring.findMany();
  return NextResponse.json(recurring);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rule = await prisma.recurring.create({
    data: {
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
    },
  });
  return NextResponse.json(rule);
}
