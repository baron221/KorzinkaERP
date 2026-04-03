import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reports — full P&L report
export async function GET() {
  // Total revenue (from sales)
  const saleAgg = await prisma.sale.aggregate({
    _sum: { totalAmount: true, paidAmount: true, debtAmount: true },
  });
  const totalRevenue = saleAgg._sum.totalAmount ?? 0;
  const totalCollected = saleAgg._sum.paidAmount ?? 0;
  const totalCustomerDebt = saleAgg._sum.debtAmount ?? 0;

  // Total raw material cost
  const rawAgg = await prisma.rawMaterial.aggregate({
    _sum: { totalAmount: true, paidAmount: true, debtAmount: true, weightKg: true },
  });
  const totalRawCost = rawAgg._sum.totalAmount ?? 0;
  const totalSupplierDebt = rawAgg._sum.debtAmount ?? 0;

  // Total expenses
  const expenseAgg = await prisma.expense.aggregate({
    _sum: { amount: true },
  });
  const totalExpenses = expenseAgg._sum.amount ?? 0;

  // Expense breakdown by category
  const expensesByCategory = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
  });

  // Monthly revenue (last 6 months)
  const now = new Date();
  const monthlyData: Array<{ month: string; revenue: number; expenses: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleString("uz-UZ", { month: "short", year: "2-digit" });

    const rev = await prisma.sale.aggregate({
      where: { date: { gte: d, lt: nextD } },
      _sum: { totalAmount: true },
    });
    const exp = await prisma.expense.aggregate({
      where: { date: { gte: d, lt: nextD } },
      _sum: { amount: true },
    });
    monthlyData.push({
      month: label,
      revenue: rev._sum.totalAmount ?? 0,
      expenses: exp._sum.amount ?? 0,
    });
  }

  // ==============================================
  // COGS & PROFIT CALCULATION (Method 1)
  // ==============================================
  const avgRawPrice =
    rawAgg._sum.weightKg && rawAgg._sum.totalAmount
      ? rawAgg._sum.totalAmount / rawAgg._sum.weightKg
      : 0;

  const prodItemsAgg = await prisma.productionItem.groupBy({
    by: ["size"],
    _sum: { count: true, weightGrams: true },
  });
  const sizeWeights: Record<number, number> = {};
  prodItemsAgg.forEach((p) => {
    if (p._sum.count && p._sum.weightGrams) {
      sizeWeights[p.size] = p._sum.weightGrams / p._sum.count;
    }
  });

  const soldAgg = await prisma.saleItem.groupBy({
    by: ["size"],
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

  // Net profit (Sof foyda)
  const netProfit = totalRevenue - totalCOGS - totalExpenses;
  const grossProfit = totalRevenue - totalCOGS;

  // Stock
  const stock = await prisma.stockSnapshot.findFirst();

  return NextResponse.json({
    totalRevenue,
    totalCollected,
    totalCustomerDebt,
    totalRawCost,
    totalSupplierDebt,
    totalExpenses,
    totalCOGS,
    netProfit,
    grossProfit,
    expensesByCategory,
    monthlyData,
    stock,
  });
}
