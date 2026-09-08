import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashNewPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, password } = body;
  if (!token || !password) return NextResponse.json({ error: "Missing token or password." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
  if (record.usedAt) return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
  if (record.expiresAt < new Date()) return NextResponse.json({ error: "This reset link has expired — request a new one." }, { status: 400 });

  const { hash, salt } = await hashNewPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hash, passwordSalt: salt } }),
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
