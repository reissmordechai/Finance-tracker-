import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const budgets = await prisma.budget.findMany({ where: { userId: auth.userId } });
  return NextResponse.json(budgets);
}

// Upsert by category (per user)
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const budget = await prisma.budget.upsert({
    where: { userId_category: { userId: auth.userId, category: body.category } },
    update: { limit: body.limit, rollover: !!body.rollover },
    create: { userId: auth.userId, category: body.category, limit: body.limit, rollover: !!body.rollover },
  });
  return NextResponse.json(budget);
}
