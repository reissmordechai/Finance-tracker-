import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const cards = await prisma.card.findMany({ include: { payments: true } });
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const card = await prisma.card.create({
    data: {
      name: body.name,
      limit: body.limit || 0,
      dueDay: body.dueDay || null,
      amountDue: body.amountDue || 0,
      apr: body.apr ?? null,
    },
  });
  return NextResponse.json(card);
}
