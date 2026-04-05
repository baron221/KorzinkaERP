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
    const paid = parseFloat(paidAmount) || 0;
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

      // If user provided a payment during intake, create a payment record
      if (paid > 0) {
        await tx.supplierPayment.create({
          data: {
            supplierId: mat.supplierId,
            rawMaterialId: mat.id,
            amount: paid,
            date: mat.date,
            notes: "Kirim vaqtidagi to'lov",
          }
        });
      }

      // Auto-apply any existing prepayments (Avans) for this supplier
      if (mat.debtAmount > 0) {
        const prepayments = await tx.supplierPayment.findMany({
          where: { supplierId: mat.supplierId, rawMaterialId: null },
          orderBy: { date: "asc" },
        });

        let remainingDebt = mat.debtAmount;
        let autoPaidFromAvans = 0;

        for (const pp of prepayments) {
          if (remainingDebt <= 0) break;
          const apply = Math.min(pp.amount, remainingDebt);
          remainingDebt -= apply;
          autoPaidFromAvans += apply;

          if (apply === pp.amount) {
            // Used up the whole prepayment piece
            await tx.supplierPayment.update({
              where: { id: pp.id },
              data: { rawMaterialId: mat.id },
            });
          } else {
            // Partially consumed from a larger prepayment
            // Update the original prepayment to lower its amount
            await tx.supplierPayment.update({
              where: { id: pp.id },
              data: { amount: pp.amount - apply },
            });
            // Create a new locked payment specifically attached to this material
            await tx.supplierPayment.create({
              data: {
                supplierId: mat.supplierId,
                rawMaterialId: mat.id,
                amount: apply,
                date: mat.date,
                notes: "Avans (oldindan to'lov) hisobidan yopildi",
              }
            });
          }
        }

        // Update the material's paid/debt amounts to reflect avans usage
        if (autoPaidFromAvans > 0) {
          await tx.rawMaterial.update({
            where: { id: mat.id },
            data: {
              paidAmount: mat.paidAmount + autoPaidFromAvans,
              debtAmount: mat.totalAmount - (mat.paidAmount + autoPaidFromAvans),
            },
          });
        }
      }

      return tx.rawMaterial.findUnique({ where: { id: mat.id }, include: { supplier: true } });
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

