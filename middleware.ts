import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth";
import crypto from "crypto";

function expectedToken() {
  const pepper = process.env.AUTH_SECRET || "change-me";
  const password = process.env.APP_PASSWORD || "";
  return crypto.createHash("sha256").update(password + pepper).digest("hex");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login page, the login API, and the cron endpoint
  // (the cron endpoint has its own secret check, not cookie auth).
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron")
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie || cookie.value !== expectedToken()) {
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
