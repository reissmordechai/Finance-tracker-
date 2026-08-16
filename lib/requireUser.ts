import { NextResponse } from "next/server";
import { getCurrentUserId } from "./auth";

// Every API route calls this first. Returns the userId, or writes a 401
// response and returns null (the caller should return that response as-is).
export async function requireUser(): Promise<{ userId: string } | { error: NextResponse }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { userId };
}
