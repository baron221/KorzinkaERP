import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany();
    return NextResponse.json({ count: logs.length, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
