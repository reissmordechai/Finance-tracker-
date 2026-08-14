import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  let settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: "singleton" } });
  }
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { currency: body.currency, location: body.location, charityDefaultPct: body.charityDefaultPct },
    create: { id: "singleton", currency: body.currency || "$", location: body.location || "", charityDefaultPct: body.charityDefaultPct || 10 },
  });
  return NextResponse.json(settings);
}
