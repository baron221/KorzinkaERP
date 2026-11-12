import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SEASON_CONFIRM_WORD } from "@/lib/season";

export const dynamic = "force-dynamic";

// POST /api/season/close — sezonni yopadi va hamma hisobni 0 ga tushiradi:
//  - savdo, to'lov, vozvrat, seryo kirimi, ishlab chiqarish, xarajat va tarix yozuvlari o'chiriladi
//  - shu bilan barcha qarzlar, avanslar va ombor qoldig'i 0 bo'ladi (hech narsa ko'chirilmaydi)
//  - mijozlar va ta'minotchilar ro'yxati (ism, telefon) saqlanadi
// Hammasi bitta tranzaksiyada: xato chiqsa hech narsa o'zgarmaydi.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Sezonni faqat direktor yopishi mumkin" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== SEASON_CONFIRM_WORD) {
      return NextResponse.json({ error: "Tasdiqlash so'zi noto'g'ri" }, { status: 400 });
    }

    const summary = await prisma.$transaction(
      async (tx) => {
        // To'lovlar savdo va seryo yozuvlariga bog'langan, shuning uchun avval ular o'chadi.
        const customerPayments = await tx.customerPayment.deleteMany();
        await tx.saleItem.deleteMany();
        const sales = await tx.sale.deleteMany();
        await tx.customerReturnItem.deleteMany();
        const returns = await tx.customerReturn.deleteMany();
        const supplierPayments = await tx.supplierPayment.deleteMany();
        const rawMaterials = await tx.rawMaterial.deleteMany();
        await tx.productionItem.deleteMany();
        const productionBatches = await tx.productionBatch.deleteMany();
        const expenses = await tx.expense.deleteMany();
        await tx.activityLog.deleteMany();
        await tx.stockSnapshot.updateMany({
          data: { rawStockKg: 0, size12Count: 0, size14Count: 0, size16Count: 0 },
        });

        return {
          sales: sales.count,
          customerPayments: customerPayments.count,
          returns: returns.count,
          rawMaterials: rawMaterials.count,
          supplierPayments: supplierPayments.count,
          productionBatches: productionBatches.count,
          expenses: expenses.count,
        };
      },
      { maxWait: 15000, timeout: 120000 }
    );

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Sezonni yopishda xatolik:", error);
    return NextResponse.json(
      { error: "Sezonni yopishda xatolik yuz berdi. Hech narsa o'zgartirilmadi." },
      { status: 500 }
    );
  }
}
