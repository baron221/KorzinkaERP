import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sales/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: { items: true, customer: true },
    });
    if (!sale) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
    return NextResponse.json(sale);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// PATCH /api/sales/[id] — to'liq tahrirlash
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const saleId = parseInt(id);
    const body = await req.json();
    const { customerId, items, paidAmount, notes, date } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: "Majburiy maydonlar" }, { status: 400 });
    }

    const filtered = items.filter(
      (i: { count: number; unitPrice: number }) => i.count > 0 && i.unitPrice > 0
    );
    if (filtered.length === 0) {
      return NextResponse.json({ error: "Kamida bitta mahsulot kiriting" }, { status: 400 });
    }

    // Eski savdo ma'lumotlarini olish
    const oldSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });
    if (!oldSale) return NextResponse.json({ error: "Savdo topilmadi" }, { status: 404 });

    // Eski itemlar bo'yicha miqdorni saqlash (stock tekshiruvi uchun)
    const oldCounts: Record<number, number> = {};
    oldSale.items.forEach((item) => {
      oldCounts[item.size] = (oldCounts[item.size] || 0) + item.count;
    });

    // Stock tekshiruvi: ishlab chiqarilgan - sotilgan + eski savdo miqdori >= yangi miqdor
    for (const item of filtered) {
      const produced = await prisma.productionItem.aggregate({
        where: { size: item.size },
        _sum: { count: true },
      });
      const sold = await prisma.saleItem.aggregate({
        where: { size: item.size },
        _sum: { count: true },
      });
      const currentStock =
        (produced._sum.count ?? 0) - (sold._sum.count ?? 0) + (oldCounts[item.size] || 0);

      if (currentStock < item.count) {
        return NextResponse.json(
          {
            error: `Omborda yetarli R${item.size} savat yo'q. Mavjud (eski savdo hisobga olingan): ${currentStock} ta`,
          },
          { status: 400 }
        );
      }
    }

    const totalAmount = filtered.reduce(
      (sum: number, item: { count: number; unitPrice: number }) =>
        sum + item.count * item.unitPrice,
      0
    );
    const paid = parseFloat(paidAmount) || 0;
    const debt = totalAmount - paid;

    // Tranzaksiya: eski itemlarni o'chirib yangi yaratish + sale yangilash
    const updatedSale = await prisma.$transaction(async (tx) => {
      // Eski SaleItem larni o'chirish
      await tx.saleItem.deleteMany({ where: { saleId } });

      // Yangi SaleItem larni yaratish
      await tx.saleItem.createMany({
        data: filtered.map((item: { size: number; count: number; unitPrice: number }) => ({
          saleId,
          size: item.size,
          count: item.count,
          unitPrice: item.unitPrice,
          subtotal: item.count * item.unitPrice,
        })),
      });

      // Sale ni yangilash
      const sale = await tx.sale.update({
        where: { id: saleId },
        data: {
          customerId: parseInt(customerId),
          date: date ? new Date(date) : oldSale.date,
          totalAmount,
          paidAmount: paid,
          debtAmount: debt,
          notes: notes || null,
        },
        include: { items: true, customer: true },
      });

      // Dastlabki to'lovni yangilash (savdo vaqtida yaratilgan)
      const initialPayment = await tx.customerPayment.findFirst({
        where: { saleId, notes: "Savdo vaqtidagi to'lov" },
      });

      if (initialPayment) {
        if (paid > 0) {
          await tx.customerPayment.update({
            where: { id: initialPayment.id },
            data: {
              amount: paid,
              customerId: parseInt(customerId),
              date: date ? new Date(date) : oldSale.date,
            },
          });
        } else {
          // To'lov 0 ga tushsa, dastlabki to'lovni o'chirish
          await tx.customerPayment.delete({ where: { id: initialPayment.id } });
        }
      } else if (paid > 0) {
        // Dastlabki to'lov yo'q edi, lekin endi bor — yaratish
        await tx.customerPayment.create({
          data: {
            customerId: parseInt(customerId),
            saleId,
            amount: paid,
            date: date ? new Date(date) : oldSale.date,
            notes: "Savdo vaqtidagi to'lov",
          },
        });
      }

      return sale;
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Sale",
        entityId: saleId,
        snapshot: updatedSale as object,
      },
    });

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
