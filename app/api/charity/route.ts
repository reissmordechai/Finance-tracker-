import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const entries = await prisma.charityEntry.findMany({ where: { userId: auth.userId }, orderBy: { date: "desc" } });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const entry = await prisma.charityEntry.create({
    data: {
      userId: auth.userId,
      date: body.date ? new Date(body.date) : new Date(),
      type: body.type,
      kind: body.kind || "cash",
      amount: body.amount,
      note: body.note || null,
      transactionId: body.transactionId || null,
    },
  });
  return NextResponse.json(entry);
}
