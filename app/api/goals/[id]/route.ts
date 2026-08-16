import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const goal = await prisma.goal.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "addFunds") {
    await prisma.goal.update({
      where: { id: params.id },
      data: { savedAmount: Math.max(0, goal.savedAmount + body.amount) },
    });
    await prisma.goalContribution.create({
      data: { goalId: params.id, date: new Date(), amount: body.amount },
    });
  } else {
    await prisma.goal.update({
      where: { id: params.id },
      data: {
        targetAmount: body.targetAmount,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
      },
    });
  }

  const updated = await prisma.goal.findUnique({ where: { id: params.id }, include: { contributions: true } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  await prisma.goal.deleteMany({ where: { id: params.id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
