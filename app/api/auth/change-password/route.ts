import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { hashNewPassword, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Enter your current and new password." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const ok = await verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  const { hash, salt } = await hashNewPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash, passwordSalt: salt } });

  return NextResponse.json({ ok: true });
}
