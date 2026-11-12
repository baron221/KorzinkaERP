import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { OPENING_NOTE, SEASON_CONFIRM_WORD } from "@/lib/season";

export const dynamic = "force-dynamic";

const DEFAULT_WEIGHT: Record<number, number> = { 12: 150, 14: 200, 16: 290 };
const EPS = 0.01;

// POST /api/season/close — sezonni yopadi:
//  - savdo, to'lov, vozvrat, seryo kirimi, ishlab chiqarish, xarajat va tarix yozuvlari o'chiriladi
//  - mijozlar va ta'minotchilar ro'yxati saqlanadi
//  - qolgan qarzlar/avanslar va ombor qoldig'i bitta "O'tgan sezondan qoldiq" yozuvi bo'lib ko'chadi
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
        const now = new Date();

        // ---------- 1. Qoldiqlarni hisoblash ----------
        const [saleSums, paySums, retSums] = await Promise.all([
          tx.sale.groupBy({ by: ["customerId"], _sum: { totalAmount: true } }),
          tx.customerPayment.groupBy({ by: ["customerId"], _sum: { amount: true } }),
          tx.customerReturn.groupBy({ by: ["customerId"], _sum: { totalAmount: true } }),
        ]);
        const customerBalance = new Map<number, number>();
        const addTo = (m: Map<number, number>, id: number, v: number) => m.set(id, (m.get(id) ?? 0) + v);
        saleSums.forEach((s) => addTo(customerBalance, s.customerId, s._sum.totalAmount ?? 0));
        paySums.forEach((p) => addTo(customerBalance, p.customerId, -(p._sum.amount ?? 0)));
        retSums.forEach((r) => addTo(customerBalance, r.customerId, -(r._sum.totalAmount ?? 0)));

        const [rawSums, supPaySums] = await Promise.all([
          tx.rawMaterial.groupBy({ by: ["supplierId"], _sum: { totalAmount: true } }),
          tx.supplierPayment.groupBy({ by: ["supplierId"], _sum: { amount: true } }),
        ]);
        const supplierBalance = new Map<number, number>();
        rawSums.forEach((r) => addTo(supplierBalance, r.supplierId, r._sum.totalAmount ?? 0));
        supPaySums.forEach((p) => addTo(supplierBalance, p.supplierId, -(p._sum.amount ?? 0)));

        const rawReceived = await tx.rawMaterial.aggregate({ _sum: { weightKg: true } });
        const rawUsed = await tx.productionBatch.aggregate({ _sum: { rawUsedKg: true } });
        const rawStockKg = Math.max(0, (rawReceived._sum.weightKg ?? 0) - (rawUsed._sum.rawUsedKg ?? 0));

        const [prodItems, soldItems, returnedItems] = await Promise.all([
          tx.productionItem.findMany({ select: { size: true, count: true, weightGrams: true } }),
          tx.saleItem.groupBy({ by: ["size"], _sum: { count: true } }),
          tx.customerReturnItem.groupBy({ by: ["size"], _sum: { count: true } }),
        ]);
        const bySize = new Map<number, { count: number; weight: number; produced: number }>();
        const sizeEntry = (size: number) => {
          if (!bySize.has(size)) bySize.set(size, { count: 0, weight: 0, produced: 0 });
          return bySize.get(size)!;
        };
        prodItems.forEach((i) => {
          const e = sizeEntry(i.size);
          e.count += i.count;
          e.produced += i.count;
          e.weight += i.count * i.weightGrams;
        });
        soldItems.forEach((s) => (sizeEntry(s.size).count -= s._sum.count ?? 0));
        returnedItems.forEach((r) => (sizeEntry(r.size).count += r._sum.count ?? 0));

        const basketStock = [...bySize.entries()]
          .filter(([, e]) => e.count > 0)
          .map(([size, e]) => ({
            size,
            count: e.count,
            weightGrams: e.produced > 0 ? e.weight / e.produced : DEFAULT_WEIGHT[size] ?? 200,
          }));

        // ---------- 2. Eski yozuvlarni o'chirish ----------
        await tx.customerPayment.deleteMany();
        await tx.saleItem.deleteMany();
        await tx.sale.deleteMany();
        await tx.customerReturnItem.deleteMany();
        await tx.customerReturn.deleteMany();
        await tx.supplierPayment.deleteMany();
        await tx.rawMaterial.deleteMany();
        await tx.productionItem.deleteMany();
        await tx.productionBatch.deleteMany();
        await tx.expense.deleteMany();
        await tx.activityLog.deleteMany();

        // ---------- 3. Boshlang'ich qoldiqlarni yaratish ----------
        // Mijoz qarzi -> mahsulotsiz Sale (daromadga qo'shilmaydi, to'lovlar odatdagidek yopadi)
        const debts = [...customerBalance.entries()].filter(([, b]) => b > EPS);
        // Mijoz avansi (ortiqcha to'lagan) -> oddiy to'lov
        const credits = [...customerBalance.entries()].filter(([, b]) => b < -EPS);

        if (debts.length > 0) {
          await tx.sale.createMany({
            data: debts.map(([customerId, b]) => ({
              customerId,
              date: now,
              totalAmount: b,
              paidAmount: 0,
              debtAmount: b,
              notes: OPENING_NOTE,
            })),
          });
        }
        if (credits.length > 0) {
          await tx.customerPayment.createMany({
            data: credits.map(([customerId, b]) => ({
              customerId,
              amount: -b,
              date: now,
              notes: `${OPENING_NOTE} (avans)`,
            })),
          });
        }

        // Ta'minotchi qoldig'i -> bog'lanmagan to'lov.
        // Qarz bo'lsa manfiy summa (balans = kirim - to'lov), avans bo'lsa musbat summa.
        const supplierCarry = [...supplierBalance.entries()].filter(([, b]) => Math.abs(b) > EPS);
        if (supplierCarry.length > 0) {
          await tx.supplierPayment.createMany({
            data: supplierCarry.map(([supplierId, b]) => ({
              supplierId,
              amount: -b,
              date: now,
              notes: b > 0 ? `${OPENING_NOTE} (qarz)` : `${OPENING_NOTE} (avans)`,
            })),
          });
        }

        // Ombor qoldig'i -> bitta ishlab chiqarish partiyasi.
        // Seryo qoldig'i manfiy "ishlatilgan kg" sifatida yoziladi (qoldiq = kirim - ishlatilgan).
        if (rawStockKg > 0 || basketStock.length > 0) {
          await tx.productionBatch.create({
            data: {
              date: now,
              rawUsedKg: -rawStockKg,
              totalBaskets: basketStock.reduce((s, i) => s + i.count, 0),
              notes: OPENING_NOTE,
              items: { create: basketStock },
            },
          });
        }

        return {
          customerDebtCount: debts.length,
          customerDebtTotal: debts.reduce((s, [, b]) => s + b, 0),
          customerCreditCount: credits.length,
          customerCreditTotal: credits.reduce((s, [, b]) => s - b, 0),
          supplierDebtTotal: supplierCarry.filter(([, b]) => b > 0).reduce((s, [, b]) => s + b, 0),
          supplierCreditTotal: supplierCarry.filter(([, b]) => b < 0).reduce((s, [, b]) => s - b, 0),
          rawStockKg,
          baskets: basketStock.map(({ size, count }) => ({ size, count })),
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
