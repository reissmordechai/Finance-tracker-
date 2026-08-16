import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth";

// Same Web Crypto approach as lib/auth.ts — required here since middleware
// always runs on Vercel's Edge runtime, which doesn't support Node's crypto.
async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.AUTH_SECRET || "change-me";
  const data = new TextEncoder().encode(password + pepper);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function validPasswords(): string[] {
  return [process.env.APP_PASSWORD || "", process.env.APP_PASSWORD_2 || ""].filter(Boolean);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron")
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  let ok = false;
  if (cookie) {
    for (const pw of validPasswords()) {
      if (cookie.value === (await hashPassword(pw))) { ok = true; break; }
    }
  }

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
