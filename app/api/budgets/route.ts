import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const budgets = await prisma.budget.findMany();
  return NextResponse.json(budgets);
}

// Upsert by category
export async function POST(req: NextRequest) {
  const body = await req.json();
  const budget = await prisma.budget.upsert({
    where: { category: body.category },
    update: { limit: body.limit },
    create: { category: body.category, limit: body.limit },
  });
  return NextResponse.json(budget);
}
