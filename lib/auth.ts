import { cookies } from "next/headers";

const COOKIE_NAME = "finance_session";

// Uses the Web Crypto API (globalThis.crypto) instead of Node's "crypto"
// module — this works in both the normal Node runtime AND Vercel's Edge
// runtime (which middleware.ts runs on and does NOT support Node's crypto).
async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.AUTH_SECRET || "change-me";
  const data = new TextEncoder().encode(password + pepper);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Supports a second shared password (APP_PASSWORD_2) for family/shared
// access — e.g. a spouse who logs in with a different password but sees
// the same data. Leave APP_PASSWORD_2 unset to disable this.
function validPasswords(): string[] {
  return [process.env.APP_PASSWORD || "", process.env.APP_PASSWORD_2 || ""].filter(Boolean);
}

export function checkPassword(input: string): boolean {
  return validPasswords().includes(input);
}

export async function setSessionCookie(matchedPassword: string) {
  cookies().set(COOKIE_NAME, await hashPassword(matchedPassword), {
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
  for (const pw of validPasswords()) {
    if (cookie.value === (await hashPassword(pw))) return true;
  }
  return false;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const getHashPassword = hashPassword;
export const getValidPasswords = validPasswords;
