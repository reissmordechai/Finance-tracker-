import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const categories = await prisma.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name || "").trim();
  const type = body.type || "expense";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const existing = await prisma.category.findUnique({ where: { name_type: { name, type } } });
  if (existing) return NextResponse.json(existing);
  const category = await prisma.category.create({ data: { name, type } });
  return NextResponse.json(category);
}
