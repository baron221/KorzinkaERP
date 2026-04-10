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
    let explicitPaid = parseFloat(paidAmount) || 0;

    const material = await prisma.$transaction(async (tx) => {
      // 1. Calculate the supplier's overall avans dynamically BEFORE this new material
      const allRaw = await tx.rawMaterial.aggregate({
        where: { supplierId: parseInt(supplierId) },
        _sum: { totalAmount: true }
      });
      const allPay = await tx.supplierPayment.aggregate({
        where: { supplierId: parseInt(supplierId) },
        _sum: { amount: true }
      });
      const currentDebt = (allRaw._sum.totalAmount || 0) - (allPay._sum.amount || 0);
      const availableAvans = currentDebt < 0 ? Math.abs(currentDebt) : 0;

      // 2. Decide how much of this new material can be covered by the existing avans
      const remainingDebtAfterExplicit = Math.max(0, totalAmount - explicitPaid);
      const autoCoveredByAvans = Math.min(remainingDebtAfterExplicit, availableAvans);
      
      const finalPaidAmount = explicitPaid + autoCoveredByAvans;
      const finalDebtAmount = totalAmount - finalPaidAmount;

      // 3. Create the material
      const mat = await tx.rawMaterial.create({
        data: {
          supplierId: parseInt(supplierId),
          weightKg: parseFloat(weightKg),
          pricePerKg: parseFloat(pricePerKg),
          totalAmount,
          paidAmount: finalPaidAmount,
          debtAmount: finalDebtAmount,
          notes: notes || null,
          date: date ? new Date(date) : new Date(),
        },
      });

      if (explicitPaid > 0) {
        await tx.supplierPayment.create({
          data: {
            supplierId: mat.supplierId,
            rawMaterialId: mat.id,
            amount: explicitPaid,
            date: mat.date,
            notes: "Seryo qabul qilingandagi tolov",
          }
        });
      }

      await tx.activityLog.create({
        data: {
          action: "CREATE",
          entity: "RawMaterial",
          entityId: mat.id,
          snapshot: mat as object,
        },
      });

      return tx.rawMaterial.findUnique({ where: { id: mat.id }, include: { supplier: true } });
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

