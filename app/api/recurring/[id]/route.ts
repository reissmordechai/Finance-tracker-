import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  await prisma.recurring.updateMany({
    where: { id: params.id, userId: auth.userId },
    data: { paused: body.paused, amount: body.amount, currencyCode: body.currencyCode },
  });
  const rule = await prisma.recurring.findFirst({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  await prisma.recurring.deleteMany({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
