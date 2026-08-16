import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  }

  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
