import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mailer";

// Always responds the same way whether or not the email exists — this is
// intentional, so the page can't be used to check who has an account here.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Enter your email." }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });

  if (user) {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const origin = req.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      console.error("Failed to send reset email:", err);
      return NextResponse.json({ error: "Couldn't send the reset email right now — try again shortly." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
