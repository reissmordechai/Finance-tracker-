import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  await prisma.shoppingItem.updateMany({ where: { id: params.id, userId: auth.userId }, data: { checked: body.checked } });
  const item = await prisma.shoppingItem.findFirst({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  await prisma.shoppingItem.deleteMany({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
