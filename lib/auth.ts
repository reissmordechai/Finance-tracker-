import { cookies } from "next/headers";

const COOKIE_NAME = "finance_session";

// PBKDF2 via the Web Crypto API — works in both the normal Node runtime AND
// Vercel's Edge runtime (which middleware.ts runs on and doesn't support
// Node's "crypto" module). Much stronger than a single pepper+SHA256 pass,
// appropriate now that we store many individual users' passwords.
async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, keyMaterial, 256);
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashNewPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  return { hash, salt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const computed = await hashPassword(password, salt);
  return computed === hash;
}

// Session token: "<userId>.<hmac>" — the HMAC lets middleware (which can't
// reach the database on the Edge runtime) verify the token wasn't tampered
// with, without needing a DB round trip on every request.
async function signUserId(userId: string): Promise<string> {
  const pepper = process.env.AUTH_SECRET || "change-me";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(userId));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function makeSessionToken(userId: string): Promise<string> {
  return `${userId}.${await signUserId(userId)}`;
}

export async function verifySessionToken(token: string): Promise<string | null> {
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = await signUserId(userId);
  return sig === expected ? userId : null;
}

export async function setSessionCookie(userId: string) {
  cookies().set(COOKIE_NAME, await makeSessionToken(userId), {
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

// Reads and verifies the session cookie server-side, returning the logged-in
// user's id or null. Used by every API route and server component to scope
// data to the current user.
export async function getCurrentUserId(): Promise<string | null> {
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie) return null;
  return verifySessionToken(cookie.value);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
