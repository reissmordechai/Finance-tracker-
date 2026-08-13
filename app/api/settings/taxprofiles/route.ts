import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const profiles = await prisma.taxProfile.findMany();
  return NextResponse.json(profiles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const profile = await prisma.taxProfile.create({
    data: { label: body.label, rate: body.rate },
  });
  return NextResponse.json(profile);
}
