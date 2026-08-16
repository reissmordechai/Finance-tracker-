import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, approved: true, blocked: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}
