import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// GET /api/dashboard — dashboard summary stats
// ============================================================
export async function GET() {
  try {
    // 1. Dynamic Raw Stock: Received - Used
    const rawReceived = await prisma.rawMaterial.aggregate({ _sum: { weightKg: true } });
    const rawUsed = await prisma.productionBatch.aggregate({ _sum: { rawUsedKg: true } });
    const currentRawStock = (rawReceived._sum.weightKg ?? 0) - (rawUsed._sum.rawUsedKg ?? 0);

    // 2. Dynamic Basket Stock: Produced - Sold
    const producedItems = await prisma.productionItem.groupBy({
      by: ["size"],
      _sum: { count: true },
    });
    const soldItems = await prisma.saleItem.groupBy({
      by: ["size"],
      _sum: { count: true },
    });

    const getStock = (size: number) => {
      const p = producedItems.find(i => i.size === size)?._sum.count ?? 0;
      const s = soldItems.find(i => i.size === size)?._sum.count ?? 0;
      return p - s;
    };

    const dynamicStock = {
      rawStockKg: currentRawStock,
      size12Count: getStock(12),
      size14Count: getStock(14),
      size16Count: getStock(16),
    };

    // Other aggregations
    const rawAgg = await prisma.rawMaterial.aggregate({
      _sum: { debtAmount: true },
    });
    const totalMaterialDebt = rawAgg._sum.debtAmount ?? 0;

    const unlinkedPayments = await prisma.supplierPayment.aggregate({
      where: { rawMaterialId: null },
      _sum: { amount: true },
    });
    const totalPrepayments = unlinkedPayments._sum.amount ?? 0;

    // True supplier debt = Unpaid material debt minus any unused prepayments
    const supplierDebt = totalMaterialDebt - totalPrepayments;

    const saleAgg = await prisma.sale.aggregate({
      _sum: { totalAmount: true, paidAmount: true, debtAmount: true },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenseAgg = await prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    });

    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { customer: true },
    });

    return NextResponse.json({
      stock: dynamicStock,
      supplierDebt,
      totalRevenue: saleAgg._sum.totalAmount ?? 0,
      totalPaid: saleAgg._sum.paidAmount ?? 0,
      customerDebt: saleAgg._sum.debtAmount ?? 0,
      monthlyExpenses: expenseAgg._sum.amount ?? 0,
      customerCount: await prisma.customer.count(),
      supplierCount: await prisma.supplier.count(),
      recentSales,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
