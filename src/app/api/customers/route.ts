import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      sales: {
        orderBy: { date: "desc" },
        take: 3,
        include: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, address, notes } = body;
  if (!name) return NextResponse.json({ error: "Ism kerak" }, { status: 400 });
  const customer = await prisma.customer.create({
    data: { name, phone: phone || null, address: address || null, notes: notes || null },
  });
  return NextResponse.json(customer);
}
