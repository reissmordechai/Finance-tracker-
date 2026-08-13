import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const rule = await prisma.recurring.update({
    where: { id: params.id },
    data: { paused: body.paused },
  });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.recurring.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
