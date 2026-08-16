import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const item = await prisma.shoppingItem.update({
    where: { id: params.id },
    data: { checked: body.checked },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.shoppingItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
