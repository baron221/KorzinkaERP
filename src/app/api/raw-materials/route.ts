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

    const material = await prisma.$transaction(async (tx) => {
      // Create the material entry
      const mat = await tx.rawMaterial.create({
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

      // Auto-apply any existing prepayments (unlinked payments) for this supplier — FIFO
      if (mat.debtAmount > 0) {
        const prepayments = await tx.supplierPayment.findMany({
          where: { supplierId: mat.supplierId, rawMaterialId: null },
          orderBy: { date: "asc" },
        });

        let remainingDebt = mat.debtAmount;
        for (const pp of prepayments) {
          if (remainingDebt <= 0) break;
          const apply = Math.min(pp.amount, remainingDebt);
          remainingDebt -= apply;

          // Link this prepayment to the new material
          await tx.supplierPayment.update({
            where: { id: pp.id },
            data: { rawMaterialId: mat.id },
          });
        }

        // Update the material's paid/debt amounts
        if (remainingDebt < mat.debtAmount) {
          await tx.rawMaterial.update({
            where: { id: mat.id },
            data: {
              paidAmount: totalAmount - remainingDebt,
              debtAmount: Math.max(0, remainingDebt),
            },
          });
        }
      }

      return tx.rawMaterial.findUnique({ where: { id: mat.id } });
    });

    return NextResponse.json(material, { status: 201 });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

