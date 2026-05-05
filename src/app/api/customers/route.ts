import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          orderBy: { date: "desc" },
          include: { items: true },
        },
        customerPayments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, address, notes } = body;
    if (!name) return NextResponse.json({ error: "Ism kerak" }, { status: 400 });

    const customer = await prisma.customer.create({
      data: { name, phone: phone || null, address: address || null, notes: notes || null },
    });

    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Customer",
        entityId: customer.id,
        snapshot: customer as object,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

