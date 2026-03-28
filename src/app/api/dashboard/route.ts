import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// GET /api/dashboard — dashboard summary stats
// ============================================================
export async function GET() {
  try {
    // Stock snapshot (upsert the single row)
    let snapshot = await prisma.stockSnapshot.findFirst();
    if (!snapshot) {
      snapshot = await prisma.stockSnapshot.create({
        data: { rawStockKg: 0, size12Count: 0, size14Count: 0, size16Count: 0 },
      });
    }

    // Total raw material received
    const rawAgg = await prisma.rawMaterial.aggregate({
      _sum: { weightKg: true, totalAmount: true, paidAmount: true },
    });
    const supplierDebt =
      (rawAgg._sum.totalAmount ?? 0) - (rawAgg._sum.paidAmount ?? 0);

    // Sales stats
    const saleAgg = await prisma.sale.aggregate({
      _sum: { totalAmount: true, paidAmount: true, debtAmount: true },
    });

    // Expenses current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenseAgg = await prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    });

    // Recent sales (last 5)
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { customer: true },
    });

    // Customer count
    const customerCount = await prisma.customer.count();
    const supplierCount = await prisma.supplier.count();

    return NextResponse.json({
      stock: snapshot,
      supplierDebt,
      totalRevenue: saleAgg._sum.totalAmount ?? 0,
      totalPaid: saleAgg._sum.paidAmount ?? 0,
      customerDebt: saleAgg._sum.debtAmount ?? 0,
      monthlyExpenses: expenseAgg._sum.amount ?? 0,
      customerCount,
      supplierCount,
      recentSales,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
