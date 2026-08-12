import { cookies } from "next/headers";

const COOKIE_NAME = "finance_session";

// Uses the Web Crypto API (globalThis.crypto) instead of Node's "crypto"
// module — this works in both the normal Node runtime AND Vercel's Edge
// runtime (which middleware.ts runs on and does NOT support Node's crypto).
async function expectedToken(): Promise<string> {
  const pepper = process.env.AUTH_SECRET || "change-me";
  const password = process.env.APP_PASSWORD || "";
  const data = new TextEncoder().encode(password + pepper);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function checkPassword(input: string): boolean {
  return input === (process.env.APP_PASSWORD || "");
}

export async function setSessionCookie() {
  cookies().set(COOKIE_NAME, await expectedToken(), {
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

export async function isAuthenticated(): Promise<boolean> {
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie) return false;
  return cookie.value === (await expectedToken());
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const getExpectedToken = expectedToken;
