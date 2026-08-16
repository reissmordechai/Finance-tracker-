import { NextResponse } from "next/server";
import { prisma } from "./db";
import { getCurrentUserId } from "./auth";

// Every API route calls this first. Returns the userId, or writes a 401/403
// response and returns null (the caller should return that response as-is).
// Also re-checks "blocked" against the database on every call — so blocking
// someone takes effect on their very next request, not just their next login.
export async function requireUser(): Promise<{ userId: string; role: string } | { error: NextResponse }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { blocked: true, role: true } });
  if (!user || user.blocked) {
    return { error: NextResponse.json({ error: "Account blocked" }, { status: 403 }) };
  }
  return { userId, role: user.role };
}

export async function requireAdmin(): Promise<{ userId: string } | { error: NextResponse }> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (auth.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
  }
  return { userId: auth.userId };
}
