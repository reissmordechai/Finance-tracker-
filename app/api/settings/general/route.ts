import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  let settings = await prisma.settings.findUnique({ where: { userId: auth.userId } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId: auth.userId } });
  }
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const settings = await prisma.settings.upsert({
    where: { userId: auth.userId },
    update: { currency: body.currency, location: body.location, charityDefaultPct: body.charityDefaultPct, baseCurrencyCode: body.baseCurrencyCode },
    create: { userId: auth.userId, currency: body.currency || "$", location: body.location || "", charityDefaultPct: body.charityDefaultPct || 10, baseCurrencyCode: body.baseCurrencyCode || "USD" },
  });
  return NextResponse.json(settings);
}
