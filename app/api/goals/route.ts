import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const goals = await prisma.goal.findMany({ where: { userId: auth.userId }, include: { contributions: { orderBy: { date: "asc" } } } });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const goal = await prisma.goal.create({
    data: {
      userId: auth.userId,
      name: body.name,
      targetAmount: body.targetAmount,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      savedAmount: 0,
    },
  });
  return NextResponse.json(goal);
}
