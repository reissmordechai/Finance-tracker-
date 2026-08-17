import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  await prisma.taxProfile.updateMany({ where: { id: params.id, userId: auth.userId }, data: { label: body.label, rate: body.rate } });
  const profile = await prisma.taxProfile.findFirst({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json(profile);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  await prisma.taxProfile.deleteMany({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
