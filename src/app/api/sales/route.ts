import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sales
export async function GET() {
  const sales = await prisma.sale.findMany({
    include: {
      customer: true,
      items: true,
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(sales);
}

// POST /api/sales — record a sale
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, items, paidAmount, notes, date } = body;
  // items: [{ size: 12|14|16, count: number, unitPrice: number }]

  if (!customerId || !items || items.length === 0) {
    return NextResponse.json({ error: "Majburiy maydonlar" }, { status: 400 });
  }

  const totalAmount = items.reduce(
    (sum: number, item: { count: number; unitPrice: number }) =>
      sum + item.count * item.unitPrice,
    0
  );
  const paid = parseFloat(paidAmount ?? 0);
  const debt = totalAmount - paid;

  // Deduct finished basket stock
  const snapshot = await prisma.stockSnapshot.findFirst();
  if (snapshot) {
    const updates: Record<string, { decrement: number }> = {};
    for (const item of items) {
      const field =
        item.size === 12
          ? "size12Count"
          : item.size === 14
          ? "size14Count"
          : "size16Count";
      updates[field] = { decrement: item.count };
    }
    await prisma.stockSnapshot.update({
      where: { id: snapshot.id },
      data: updates,
    });
  }

  const sale = await prisma.sale.create({
    data: {
      customerId: parseInt(customerId),
      date: date ? new Date(date) : new Date(),
      totalAmount,
      paidAmount: paid,
      debtAmount: debt,
      notes: notes || null,
      items: {
        create: items.map((item: { size: number; count: number; unitPrice: number }) => ({
          size: item.size,
          count: item.count,
          unitPrice: item.unitPrice,
          subtotal: item.count * item.unitPrice,
        })),
      },
    },
    include: { items: true, customer: true },
  });

  return NextResponse.json(sale, { status: 201 });
}
