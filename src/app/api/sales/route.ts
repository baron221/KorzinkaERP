import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sales
export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { date: "desc" },
    });

    // Calculate dynamic unit economics
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

    const salesWithProfit = sales.map((sale) => {
      let totalCOGS = 0;
      sale.items.forEach((item) => {
        const weightGram = sizeWeights[item.size] || (item.size === 16 ? 290 : item.size === 14 ? 200 : 150);
        const costRaw = (weightGram / 1000) * avgRawPrice;
        const costWage = 150;
        const costElec = 250;
        totalCOGS += item.count * (costRaw + costWage + costElec);
      });
      return {
        ...sale,
        cogs: totalCOGS,
        netProfit: sale.totalAmount - totalCOGS,
      };
    });

    return NextResponse.json(salesWithProfit);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/sales — record a sale
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, items, paidAmount, notes, date } = body;
    // items: [{ size: 12|14|16, count: number, unitPrice: number }]

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: "Majburiy maydonlar" }, { status: 400 });
    }

    const totalAmount = items.reduce(
      (sum: number, item: { count: number; unitPrice: number }) =>
        sum + item.count * item.unitPrice,
      0
    );
    const paid = parseFloat(paidAmount ?? 0);
    const debt = totalAmount - paid;

    // Check finished basket stock (Dynamic)
    for (const item of items) {
      const produced = await prisma.productionItem.aggregate({
        where: { size: item.size },
        _sum: { count: true }
      });
      const sold = await prisma.saleItem.aggregate({
        where: { size: item.size },
        _sum: { count: true }
      });
      const currentStock = (produced._sum.count ?? 0) - (sold._sum.count ?? 0);
      
      if (currentStock < item.count) {
        return NextResponse.json(
          { error: `Omborda yetarli R${item.size} savat yo'q. Mavjud: ${currentStock} ta` },
          { status: 400 }
        );
      }
    }

    const sale = await prisma.sale.create({
      data: {
        customerId: parseInt(customerId),
        date: date ? new Date(date) : new Date(),
        totalAmount,
        paidAmount: paid,
        debtAmount: debt,
        notes: notes || null,
        items: {
          create: items.map((item: { size: number; count: number; unitPrice: number }) => ({
            size: item.size,
            count: item.count,
            unitPrice: item.unitPrice,
            subtotal: item.count * item.unitPrice,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

