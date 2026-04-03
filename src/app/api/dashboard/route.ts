import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// GET /api/dashboard — dashboard summary stats
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    
    let dateFilter = {};
    if (dateParam) {
      const start = new Date(dateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      dateFilter = { date: { gte: start, lt: end } };
    }

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

    const filteredSaleAgg = await prisma.sale.aggregate({
      where: dateFilter,
      _sum: { totalAmount: true, paidAmount: true },
    });
    const allDebtAgg = await prisma.sale.aggregate({
      _sum: { debtAmount: true },
    });

    let expenseFilter = {};
    if (dateParam) {
      expenseFilter = dateFilter;
    } else {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      expenseFilter = { date: { gte: monthStart } };
    }
    const expenseAgg = await prisma.expense.aggregate({
      where: expenseFilter,
      _sum: { amount: true },
    });

    // ==============================================
    // COGS & PROFIT CALCULATION (Method 1)
    // ==============================================
    const rawAggForCost = await prisma.rawMaterial.aggregate({
      _sum: { totalAmount: true, weightKg: true },
    });
    const avgRawPrice =
      rawAggForCost._sum.weightKg && rawAggForCost._sum.totalAmount
        ? rawAggForCost._sum.totalAmount / rawAggForCost._sum.weightKg
        : 0;

    const prodItemsAgg = await prisma.productionItem.groupBy({
      by: ["size"],
      _avg: { weightGrams: true },
    });
    const sizeWeights: Record<number, number> = {};
    prodItemsAgg.forEach((p) => {
      if (p._avg.weightGrams) {
        sizeWeights[p.size] = p._avg.weightGrams;
      }
    });

    const soldAgg = await prisma.saleItem.groupBy({
      by: ["size"],
      where: Object.keys(dateFilter).length > 0 ? { sale: dateFilter } : undefined,
      _sum: { count: true },
    });

    let totalCOGS = 0;
    soldAgg.forEach((s) => {
      const count = s._sum.count || 0;
      const weightGram =
        sizeWeights[s.size] || (s.size === 16 ? 290 : s.size === 14 ? 200 : 150);
      const costRaw = (weightGram / 1000) * avgRawPrice;
      const costWage = 150;
      const costElec = 250;
      totalCOGS += count * (costRaw + costWage + costElec);
    });

    const totalExpensesForProfit = await prisma.expense.aggregate({
      where: dateFilter,
      _sum: { amount: true },
    });
    const totalExpAmount = totalExpensesForProfit._sum.amount ?? 0;
    const totalRevAmount = filteredSaleAgg._sum.totalAmount ?? 0;

    // Sof Foyda = Yalpi Tushum - Tannarx(COGS) - Boshqa Xarajatlar
    const netProfit = totalRevAmount - totalCOGS - totalExpAmount;

    const recentSales = await prisma.sale.findMany({
      take: 5,
      where: dateFilter,
      orderBy: { date: "desc" },
      include: { customer: true },
    });

    return NextResponse.json({
      stock: dynamicStock,
      supplierDebt,
      totalRevenue: totalRevAmount,
      totalCOGS,
      netProfit,
      totalPaid: filteredSaleAgg._sum.paidAmount ?? 0,
      customerDebt: allDebtAgg._sum.debtAmount ?? 0,
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
