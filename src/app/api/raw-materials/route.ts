import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/raw-materials — all raw material entries
export async function GET() {
  const materials = await prisma.rawMaterial.findMany({
    include: { supplier: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(materials);
}

// POST /api/raw-materials — add raw material intake
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { supplierId, weightKg, pricePerKg, paidAmount, notes, date } = body;

  if (!supplierId || !weightKg || !pricePerKg) {
    return NextResponse.json({ error: "Majburiy maydonlar kiritilmagan" }, { status: 400 });
  }

  const totalAmount = parseFloat(weightKg) * parseFloat(pricePerKg);
  const paid = parseFloat(paidAmount ?? 0);
  const debt = totalAmount - paid;

  const material = await prisma.rawMaterial.create({
    data: {
      supplierId: parseInt(supplierId),
      weightKg: parseFloat(weightKg),
      pricePerKg: parseFloat(pricePerKg),
      totalAmount,
      paidAmount: paid,
      debtAmount: debt,
      notes: notes || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  // Update stock snapshot
  await prisma.stockSnapshot.upsert({
    where: { id: 1 },
    create: { id: 1, rawStockKg: parseFloat(weightKg) },
    update: { rawStockKg: { increment: parseFloat(weightKg) } },
  });

  return NextResponse.json(material, { status: 201 });
}
