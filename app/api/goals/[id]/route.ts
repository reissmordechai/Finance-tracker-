import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  if (body.action === "addFunds") {
    const goal = await prisma.goal.findUnique({ where: { id: params.id } });
    if (goal) {
      await prisma.goal.update({
        where: { id: params.id },
        data: { savedAmount: Math.max(0, goal.savedAmount + body.amount) },
      });
    }
  } else {
    await prisma.goal.update({
      where: { id: params.id },
      data: {
        targetAmount: body.targetAmount,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
      },
    });
  }

  const updated = await prisma.goal.findUnique({ where: { id: params.id } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.goal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
