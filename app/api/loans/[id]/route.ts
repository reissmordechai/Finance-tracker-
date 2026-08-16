import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const loan = await prisma.loan.update({
    where: { id: params.id },
    data: {
      name: body.name,
      balance: body.balance,
      apr: body.apr,
      minPayment: body.minPayment,
      dueDay: body.dueDay,
    },
  });
  return NextResponse.json(loan);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.loan.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
