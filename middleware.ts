import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth";

// Same HMAC verification as lib/auth.ts — required here since middleware
// always runs on Vercel's Edge runtime, which can't reach the database.
async function signUserId(userId: string): Promise<string> {
  const pepper = process.env.AUTH_SECRET || "change-me";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(userId));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyToken(token: string): Promise<boolean> {
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return false;
  return sig === (await signUserId(userId));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron")
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  const ok = cookie ? await verifyToken(cookie.value) : false;

  if (!ok) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
