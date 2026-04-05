import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/supplier-payments?supplierId=&unlinked=true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId");
  const unlinked = searchParams.get("unlinked") === "true";

  const where: any = {};
  if (supplierId) where.supplierId = parseInt(supplierId);
  if (unlinked) where.rawMaterialId = null;

  const payments = await prisma.supplierPayment.findMany({
    where,
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

  let finalNotes = notes || null;
  if (!finalNotes) {
    finalNotes = rawMaterialId ? "Qarz to'lovi" : "Avans kiritildi";
  }

  const payment = await prisma.supplierPayment.create({
    data: {
      supplierId: parseInt(supplierId),
      rawMaterialId: rawMaterialId ? parseInt(rawMaterialId) : null,
      amount: parseFloat(amount),
      notes: finalNotes,
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
