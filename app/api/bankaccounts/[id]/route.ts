import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const account = await prisma.bankAccount.update({
    where: { id: params.id },
    data: { name: body.name, balance: body.balance },
  });
  return NextResponse.json(account);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.bankAccount.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
