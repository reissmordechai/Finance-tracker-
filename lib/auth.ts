import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "finance_session";

// Simple single-user auth: one shared password (APP_PASSWORD env var).
// The cookie stores a hash of the password + a server-only pepper, so it
// can't be forged without knowing APP_PASSWORD.
function expectedToken() {
  const pepper = process.env.AUTH_SECRET || "change-me";
  const password = process.env.APP_PASSWORD || "";
  return crypto.createHash("sha256").update(password + pepper).digest("hex");
}

export function checkPassword(input: string): boolean {
  return input === (process.env.APP_PASSWORD || "");
}

export function setSessionCookie() {
  cookies().set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export function isAuthenticated(): boolean {
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie) return false;
  return cookie.value === expectedToken();
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
