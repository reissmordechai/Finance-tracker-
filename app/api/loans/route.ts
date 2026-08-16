import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const loans = await prisma.loan.findMany({ where: { userId: auth.userId } });
  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const loan = await prisma.loan.create({
    data: {
      userId: auth.userId,
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
