import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const items = await prisma.shoppingItem.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const item = await prisma.shoppingItem.create({
    data: { userId: auth.userId, name: body.name, note: body.note || null, category: body.category || null },
  });
  return NextResponse.json(item);
}
