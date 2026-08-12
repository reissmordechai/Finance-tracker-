import { NextRequest, NextResponse } from "next/server";
import { checkPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  setSessionCookie();
  return NextResponse.json({ ok: true });
}
