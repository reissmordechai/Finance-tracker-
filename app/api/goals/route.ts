import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const goals = await prisma.goal.findMany();
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const goal = await prisma.goal.create({
    data: {
      name: body.name,
      targetAmount: body.targetAmount,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      savedAmount: 0,
    },
  });
  return NextResponse.json(goal);
}
