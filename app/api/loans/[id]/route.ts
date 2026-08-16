import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  await prisma.loan.updateMany({
    where: { id: params.id, userId: auth.userId },
    data: { name: body.name, balance: body.balance, apr: body.apr, minPayment: body.minPayment, dueDay: body.dueDay },
  });
  const loan = await prisma.loan.findFirst({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json(loan);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  await prisma.loan.deleteMany({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
