import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/customer-payments — record payment from customer (debt collection)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, saleId, amount, notes, date } = body;

    if (!customerId || !amount) {
      return NextResponse.json({ error: "Majburiy maydonlar" }, { status: 400 });
    }

    const amountFloat = parseFloat(amount);
    const customerIdInt = parseInt(customerId);

    let finalNotes = notes || null;
    if (!finalNotes) {
      finalNotes = saleId ? "Qarz to'lovi" : "Avans (Oldindan kiritildi)";
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the payment record
      const payment = await tx.customerPayment.create({
        data: {
          customerId: customerIdInt,
          saleId: saleId ? parseInt(saleId) : null,
          amount: amountFloat,
          notes: finalNotes,
          date: date ? new Date(date) : new Date(),
        },
      });

      // 2. Distribute payment to sales
      if (saleId) {
        // Specific sale payment
        const sale = await tx.sale.findUnique({ where: { id: parseInt(saleId) } });
        if (sale) {
          const newPaid = sale.paidAmount + amountFloat;
          const newDebt = Math.max(0, sale.totalAmount - newPaid);
          await tx.sale.update({
            where: { id: parseInt(saleId) },
            data: { paidAmount: newPaid, debtAmount: newDebt },
          });
        }
      } else {
        // General payment: apply to unpaid sales (FIFO)
        const unpaidSales = await tx.sale.findMany({
          where: { customerId: customerIdInt, debtAmount: { gt: 0 } },
          orderBy: { date: "asc" },
        });

        let remainingAmount = amountFloat;
        for (const sale of unpaidSales) {
          if (remainingAmount <= 0) break;

          const paymentToApply = Math.min(remainingAmount, sale.debtAmount);
          const newPaid = sale.paidAmount + paymentToApply;
          const newDebt = sale.debtAmount - paymentToApply;

          await tx.sale.update({
            where: { id: sale.id },
            data: { paidAmount: newPaid, debtAmount: newDebt },
          });

          remainingAmount -= paymentToApply;
        }
      }

      await tx.activityLog.create({
        data: {
          action: "CREATE",
          entity: "CustomerPayment",
          entityId: payment.id,
          snapshot: payment as object,
        },
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const payments = await prisma.customerPayment.findMany({
      include: { customer: true, sale: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

