import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    const refDate = dateParam ? new Date(dateParam) : new Date();
    const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const monthEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
    expenseFilter = { date: { gte: monthStart, lt: monthEnd } };
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

    const allProdItems = await prisma.productionItem.findMany({
      select: { size: true, count: true, weightGrams: true }
    });
    
    const sizeStats: Record<number, { totalWeight: number, totalCount: number }> = {};
    allProdItems.forEach((i) => {
      if (!sizeStats[i.size]) sizeStats[i.size] = { totalWeight: 0, totalCount: 0 };
      sizeStats[i.size].totalWeight += i.count * i.weightGrams;
      sizeStats[i.size].totalCount += i.count;
    });

    const sizeWeights: Record<number, number> = {};
    Object.keys(sizeStats).forEach((key) => {
      const size = parseInt(key);
      const stat = sizeStats[size];
      if (stat.totalCount > 0) {
        sizeWeights[size] = stat.totalWeight / stat.totalCount;
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
      totalCOGS += count * costRaw;
    });

    const totalExpensesForProfit = await prisma.expense.aggregate({
      where: dateFilter,
      _sum: { amount: true },
    });
    const totalExpAmount = totalExpensesForProfit._sum.amount ?? 0;

    const expenseBreakdown = await prisma.expense.groupBy({
      by: ['category'],
      where: dateFilter,
      _sum: { amount: true }
    });

    const totalRevAmount = filteredSaleAgg._sum.totalAmount ?? 0;

    const customers = await prisma.customer.findMany({
      include: {
        sales: { select: { totalAmount: true } },
        customerPayments: { select: { amount: true } },
      }
    });

    let totalCustomerDebt = 0;
    let totalCustomerCredit = 0;
    let customersWithDebt = 0;
    let customersWithCredit = 0;

    customers.forEach(c => {
      const totalBuy = c.sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalPaid = c.customerPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = totalBuy - totalPaid;
      if (balance > 0) {
        totalCustomerDebt += balance;
        customersWithDebt++;
      } else if (balance < 0) {
        totalCustomerCredit += Math.abs(balance);
        customersWithCredit++;
      }
    });

    // Restore Profit calculation
    const allTimeSaleAgg = await prisma.sale.aggregate({ _sum: { totalAmount: true } });
    const allTimeRev = allTimeSaleAgg._sum.totalAmount ?? 0;
    const allTimeExpAgg = await prisma.expense.aggregate({ _sum: { amount: true } });
    const allTimeExp = allTimeExpAgg._sum.amount ?? 0;
    const allTimeSoldAgg = await prisma.saleItem.groupBy({ by: ["size"], _sum: { count: true } });
    let allTimeCOGS = 0;
    allTimeSoldAgg.forEach((s) => {
      const count = s._sum.count || 0;
      const weightGram = sizeWeights[s.size] || (s.size === 16 ? 290 : s.size === 14 ? 200 : 150);
      const costRaw = (weightGram / 1000) * avgRawPrice;
      allTimeCOGS += count * costRaw;
    });
    const totalNetProfit = allTimeRev - allTimeCOGS - allTimeExp;
    const netProfit = totalRevAmount - totalCOGS - totalExpAmount;

    const recentSales = await prisma.sale.findMany({
      take: 5,
      where: dateFilter,
      orderBy: { date: "desc" },
      include: { customer: true },
    });

    const suppliers = await prisma.supplier.findMany({
      include: { rawMaterials: true, supplierPayments: true }
    });

    const supplierBalances = suppliers.map(s => {
      const totalRaw = s.rawMaterials.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalPay = s.supplierPayments.reduce((sum, p) => sum + p.amount, 0);
      return { id: s.id, name: s.name, balance: totalRaw - totalPay };
    }).filter(s => s.balance !== 0).sort((a, b) => a.balance - b.balance);

    return NextResponse.json({
      stock: dynamicStock,
      supplierDebt,
      totalRevenue: totalRevAmount,
      totalCOGS,
      netProfit,
      totalNetProfit,
      totalPaid: filteredSaleAgg._sum.paidAmount ?? 0,
      customerDebt: totalCustomerDebt,
      customerCredit: totalCustomerCredit,
      debtCustomerCount: customersWithDebt,
      creditCustomerCount: customersWithCredit,
      monthlyExpenses: expenseAgg._sum.amount ?? 0,
      deductedExpenses: totalExpAmount,
      expenseBreakdown,
      supplierBalances,
      customerCount: await prisma.customer.count(),
      supplierCount: await prisma.supplier.count(),
      recentSales,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
