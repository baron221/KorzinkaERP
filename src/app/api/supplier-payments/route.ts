import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/supplier-payments
export async function GET() {
  const payments = await prisma.supplierPayment.findMany({
    include: { supplier: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(payments);
}

// POST /api/supplier-payments — record payment to supplier
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { supplierId, rawMaterialId, amount, notes, date } = body;

  if (!supplierId || !amount) {
    return NextResponse.json({ error: "Majburiy maydonlar" }, { status: 400 });
  }

  const payment = await prisma.supplierPayment.create({
    data: {
      supplierId: parseInt(supplierId),
      rawMaterialId: rawMaterialId ? parseInt(rawMaterialId) : null,
      amount: parseFloat(amount),
      notes: notes || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  // Update the raw material paid amount if linked
  if (rawMaterialId) {
    await prisma.rawMaterial.update({
      where: { id: parseInt(rawMaterialId) },
      data: {
        paidAmount: { increment: parseFloat(amount) },
        debtAmount: { decrement: parseFloat(amount) },
      },
    });
  }

  return NextResponse.json(payment, { status: 201 });
}
