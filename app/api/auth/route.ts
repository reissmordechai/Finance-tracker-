import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  // Check both by email and by IP — whichever hits the limit first blocks
  // the attempt, so brute-forcing a single account or spraying many emails
  // from one source are both slowed down the same way.
  const [emailAttempts, ipAttempts] = await Promise.all([
    prisma.loginAttempt.count({ where: { email: normalizedEmail, createdAt: { gte: windowStart } } }),
    prisma.loginAttempt.count({ where: { ip, createdAt: { gte: windowStart } } }),
  ]);
  if (emailAttempts >= MAX_ATTEMPTS || ipAttempts >= MAX_ATTEMPTS * 3) {
    return NextResponse.json({ error: `Too many attempts. Try again in a few minutes.` }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const valid = user && (await verifyPassword(password, user.passwordHash, user.passwordSalt));

  if (!valid) {
    await prisma.loginAttempt.create({ data: { email: normalizedEmail, ip } });
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  }
  if (user!.blocked) {
    return NextResponse.json({ error: "This account has been blocked" }, { status: 403 });
  }
  if (!user!.approved) {
    return NextResponse.json({ error: "Your account is still waiting for approval" }, { status: 403 });
  }

  // Successful login — clear this email's recent failures so a legitimate
  // typo streak doesn't linger and count against future attempts.
  await prisma.loginAttempt.deleteMany({ where: { email: normalizedEmail } });

  await setSessionCookie(user!.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
