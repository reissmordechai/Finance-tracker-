import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const vendors = await prisma.vendor.findMany({ where: { userId: auth.userId }, orderBy: { name: "asc" } });
  return NextResponse.json(vendors);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const existing = await prisma.vendor.findUnique({ where: { userId_name: { userId: auth.userId, name } } });
  if (existing) return NextResponse.json(existing);
  const vendor = await prisma.vendor.create({ data: { userId: auth.userId, name } });
  return NextResponse.json(vendor);
}
