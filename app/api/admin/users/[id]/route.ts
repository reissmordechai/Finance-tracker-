import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/requireUser";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  if (params.id === auth.userId) {
    return NextResponse.json({ error: "You can't block or unapprove your own account" }, { status: 400 });
  }
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      approved: body.approved,
      blocked: body.blocked,
    },
    select: { id: true, name: true, email: true, role: true, approved: true, blocked: true, createdAt: true },
  });
  return NextResponse.json(user);
}

// Deletes the user and everything they own across every table.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  if (params.id === auth.userId) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  const userId = params.id;
  // Transaction/Card/Goal/Holding cascade-delete their child rows (Item,
  // CardPayment, GoalContribution, HoldingEntry/HoldingValue/RecurringHolding)
  // automatically via the onDelete: Cascade relations in the schema.
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.card.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.holding.deleteMany({ where: { userId } });

  await prisma.category.deleteMany({ where: { userId } });
  await prisma.bankAccount.deleteMany({ where: { userId } });
  await prisma.transfer.deleteMany({ where: { userId } });
  await prisma.vendor.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.recurring.deleteMany({ where: { userId } });
  await prisma.settings.deleteMany({ where: { userId } });
  await prisma.shoppingItem.deleteMany({ where: { userId } });
  await prisma.taxProfile.deleteMany({ where: { userId } });
  await prisma.netWorthSnapshot.deleteMany({ where: { userId } });
  await prisma.loan.deleteMany({ where: { userId } });
  await prisma.charityEntry.deleteMany({ where: { userId } });

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
