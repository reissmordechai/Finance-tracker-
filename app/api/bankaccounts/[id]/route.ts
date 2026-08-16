import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  await prisma.bankAccount.updateMany({
    where: { id: params.id, userId: auth.userId },
    data: {
      name: body.name,
      // Editing the balance counts as "confirming" it — reset the clock the
      // interest estimate grows from, so the estimate doesn't double-count.
      ...(body.balance !== undefined ? { balance: body.balance, lastConfirmedAt: new Date() } : {}),
      ...(body.apy !== undefined ? { apy: body.apy === "" || body.apy === null ? null : parseFloat(body.apy) } : {}),
    },
  });
  const account = await prisma.bankAccount.findFirst({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json(account);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  await prisma.bankAccount.deleteMany({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
