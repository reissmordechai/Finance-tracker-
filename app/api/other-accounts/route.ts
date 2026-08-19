import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const accounts = await prisma.otherAccount.findMany({ where: { userId: auth.userId } });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  if (!body.name || !["asset", "liability", "equity"].includes(body.kind)) {
    return NextResponse.json({ error: "Name and a valid kind are required" }, { status: 400 });
  }
  const account = await prisma.otherAccount.create({
    data: { userId: auth.userId, name: body.name, kind: body.kind, value: body.value || 0, note: body.note || null },
  });
  return NextResponse.json(account);
}
