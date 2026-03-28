import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      rawMaterials: {
        orderBy: { date: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, address } = body;
  if (!name) return NextResponse.json({ error: "Ism kerak" }, { status: 400 });
  const supplier = await prisma.supplier.create({
    data: { name, phone: phone || null, address: address || null },
  });
  return NextResponse.json(supplier);
}
