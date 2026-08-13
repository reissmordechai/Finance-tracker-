import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(vendors);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const existing = await prisma.vendor.findUnique({ where: { name } });
  if (existing) return NextResponse.json(existing);
  const vendor = await prisma.vendor.create({ data: { name } });
  return NextResponse.json(vendor);
}
