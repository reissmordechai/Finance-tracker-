import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const cards = await prisma.card.findMany({ where: { userId: auth.userId }, include: { payments: true } });
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const card = await prisma.card.create({
    data: {
      userId: auth.userId,
      name: body.name,
      limit: body.limit || 0,
      dueDay: body.dueDay || null,
      amountDue: body.amountDue || 0,
      apr: body.apr ?? null,
    },
  });
  return NextResponse.json(card);
}
