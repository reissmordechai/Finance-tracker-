import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.shoppingItem.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.shoppingItem.create({
    data: { name: body.name, note: body.note || null, category: body.category || null },
  });
  return NextResponse.json(item);
}
