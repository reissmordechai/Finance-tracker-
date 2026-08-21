import { prisma } from "./db";

// When an expense category is linked to a Liability or Asset account:
// spending against a Liability category PAYS IT DOWN (value decreases),
// spending against an Asset category BUILDS IT UP (value increases).
// direction: +1 when a transaction is added/restored, -1 when it's removed/trashed.
export async function adjustLinkedAccountForTransaction(
  userId: string,
  type: string,
  categoryName: string,
  amount: number,
  direction: 1 | -1
) {
  if (type !== "expense" || !categoryName) return;
  const cat = await prisma.category.findFirst({ where: { userId, name: categoryName, type: "expense" } });
  if (!cat || !cat.linkedAccountId || !cat.linkedAccountKind) return;

  const sign = cat.linkedAccountKind === "liability" ? -1 : 1;
  const delta = direction * sign * amount;

  await prisma.otherAccount.updateMany({
    where: { id: cat.linkedAccountId, userId },
    data: { value: { increment: delta } },
  });
}
