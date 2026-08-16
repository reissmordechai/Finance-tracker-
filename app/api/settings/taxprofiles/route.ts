import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const profiles = await prisma.taxProfile.findMany({ where: { userId: auth.userId } });
  return NextResponse.json(profiles);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const profile = await prisma.taxProfile.create({
    data: { userId: auth.userId, label: body.label, rate: body.rate },
  });
  return NextResponse.json(profile);
}
