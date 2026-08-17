import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const type = req.nextUrl.searchParams.get("type");
  const categories = await prisma.category.findMany({
    where: { userId: auth.userId, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const name = (body.name || "").trim();
  const type = body.type || "expense";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const existing = await prisma.category.findUnique({ where: { userId_name_type: { userId: auth.userId, name, type } } });
  if (existing) return NextResponse.json(existing);
  const category = await prisma.category.create({ data: { userId: auth.userId, name, type, parentId: body.parentId || null } });
  return NextResponse.json(category);
}
