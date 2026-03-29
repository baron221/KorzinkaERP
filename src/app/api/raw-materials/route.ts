import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/raw-materials — all raw material entries
export async function GET() {
  try {
    const materials = await prisma.rawMaterial.findMany({
      include: { supplier: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/raw-materials — add raw material intake
export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json(material, { status: 201 });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

