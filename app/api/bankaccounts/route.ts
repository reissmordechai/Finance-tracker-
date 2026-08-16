import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const accounts = await prisma.bankAccount.findMany();
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const account = await prisma.bankAccount.create({
    data: { name: body.name, balance: body.balance || 0, currencyCode: body.currencyCode || "USD" },
  });
  return NextResponse.json(account);
}
