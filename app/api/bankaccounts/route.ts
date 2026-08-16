import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const accounts = await prisma.bankAccount.findMany({ where: { userId: auth.userId } });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const account = await prisma.bankAccount.create({
    data: { userId: auth.userId, name: body.name, balance: body.balance || 0, currencyCode: body.currencyCode || "USD" },
  });
  return NextResponse.json(account);
}
