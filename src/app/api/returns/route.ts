import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, items, notes, date } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Noto'g'ri ma'lumotlar" }, { status: 400 });
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + item.count * item.unitPrice, 0);

    const returnObj = await prisma.$transaction(async (tx) => {
      // 1. Create the return
      const ret = await tx.customerReturn.create({
        data: {
          customerId: Number(customerId),
          totalAmount,
          notes: notes || null,
          date: date ? new Date(date) : new Date(),
          items: {
            create: items.map((i: any) => ({
              size: Number(i.size),
              count: Number(i.count),
              unitPrice: Number(i.unitPrice),
              subtotal: Number(i.count) * Number(i.unitPrice),
            })),
          },
        },
        include: { items: true },
      });

      // 2. Activity Log
      await tx.activityLog.create({
        data: {
          action: "CREATE",
          entity: "CustomerReturn",
          entityId: ret.id,
          snapshot: ret as any,
        },
      });

      return ret;
    });

    return NextResponse.json(returnObj, { status: 201 });
  } catch (error: any) {
    console.error("Error creating return:", error);
    return NextResponse.json({ error: error.message || "Server xatosi" }, { status: 500 });
  }
}
