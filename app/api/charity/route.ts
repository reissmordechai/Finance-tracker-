import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const entries = await prisma.charityEntry.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await prisma.charityEntry.create({
    data: {
      date: body.date ? new Date(body.date) : new Date(),
      type: body.type, // "owed" | "given"
      kind: body.kind || "cash", // "cash" | "time" | "other"
      amount: body.amount,
      note: body.note || null,
      transactionId: body.transactionId || null,
    },
  });
  return NextResponse.json(entry);
}
