import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const snapshots = await prisma.netWorthSnapshot.findMany({ where: { userId: auth.userId }, orderBy: { date: "asc" } });
  return NextResponse.json(snapshots);
}
