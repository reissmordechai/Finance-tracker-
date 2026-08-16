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
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash: hash, passwordSalt: salt },
  });

  // Give the new user their own Settings row right away so every page that
  // expects one to exist doesn't have to special-case a brand new account.
  await prisma.settings.create({ data: { userId: user.id } });

  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}
