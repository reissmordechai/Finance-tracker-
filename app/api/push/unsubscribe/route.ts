import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const endpoint = body.endpoint;
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: auth.userId } });
  }
  return NextResponse.json({ ok: true });
}
