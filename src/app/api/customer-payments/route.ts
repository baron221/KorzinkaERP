import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/customer-payments — record payment from customer (debt collection)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, saleId, amount, notes, date } = body;

  if (!customerId || !amount) {
    return NextResponse.json({ error: "Majburiy maydonlar" }, { status: 400 });
  }

  const payment = await prisma.customerPayment.create({
    data: {
      customerId: parseInt(customerId),
      saleId: saleId ? parseInt(saleId) : null,
      amount: parseFloat(amount),
      notes: notes || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  // Update sale debt amount if linked
  if (saleId) {
    const sale = await prisma.sale.findUnique({ where: { id: parseInt(saleId) } });
    if (sale) {
      const newPaid = sale.paidAmount + parseFloat(amount);
      const newDebt = Math.max(0, sale.totalAmount - newPaid);
      await prisma.sale.update({
        where: { id: parseInt(saleId) },
        data: { paidAmount: newPaid, debtAmount: newDebt },
      });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}

export async function GET() {
  const payments = await prisma.customerPayment.findMany({
    include: { customer: true, sale: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(payments);
}
