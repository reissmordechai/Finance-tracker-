import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const loans = await prisma.loan.findMany();
  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const loan = await prisma.loan.create({
    data: {
      name: body.name,
      principal: body.principal || body.balance || 0,
      balance: body.balance || 0,
      apr: body.apr ? parseFloat(body.apr) : null,
      minPayment: body.minPayment ? parseFloat(body.minPayment) : null,
      dueDay: body.dueDay ? parseInt(body.dueDay) : null,
    },
  });
  return NextResponse.json(loan);
}
