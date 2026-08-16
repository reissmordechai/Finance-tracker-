import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashNewPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: "Name, email, and a password of at least 6 characters are required" }, { status: 400 });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const { hash, salt } = await hashNewPassword(password);

  // The very first person to ever sign up becomes the admin, auto-approved.
  // Everyone after that needs the admin to approve them before logging in.
  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      role: isFirstUser ? "admin" : "user",
      approved: isFirstUser,
    },
  });

  await prisma.settings.create({ data: { userId: user.id } });

  if (isFirstUser) {
    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true, status: "active" });
  }

  return NextResponse.json({ ok: true, status: "pending" });
}
