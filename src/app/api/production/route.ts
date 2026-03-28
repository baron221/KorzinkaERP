import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const batches = await prisma.productionBatch.findMany({
    include: { items: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // items: [{ size: 12|14|16, count: number, weightGrams: number }]
  const { date, notes, items } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Mahsulot ma'lumotlari kerak" }, { status: 400 });
  }

  // Calculate total raw used (sum of count * weightGrams / 1000 for each item)
  const rawUsedKg = items.reduce(
    (sum: number, item: { count: number; weightGrams: number }) =>
      sum + (item.count * item.weightGrams) / 1000,
    0
  );
  const totalBaskets = items.reduce(
    (sum: number, item: { count: number }) => sum + item.count,
    0
  );

  // Check stock
  const snapshot = await prisma.stockSnapshot.findFirst();
  if (!snapshot || snapshot.rawStockKg < rawUsedKg) {
    return NextResponse.json(
      { error: `Omborda yetarli seryo yo'q. Mavjud: ${snapshot?.rawStockKg ?? 0} kg, kerak: ${rawUsedKg.toFixed(2)} kg` },
      { status: 400 }
    );
  }

  // Create production batch
  const batch = await prisma.productionBatch.create({
    data: {
      date: date ? new Date(date) : new Date(),
      rawUsedKg,
      totalBaskets,
      notes: notes || null,
      items: {
        create: items.map((item: { size: number; count: number; weightGrams: number }) => ({
          size: item.size,
          count: item.count,
          weightGrams: item.weightGrams,
        })),
      },
    },
    include: { items: true },
  });

  // Deduct raw stock and update finished basket counts
  const size12Used = items.filter((i: { size: number }) => i.size === 12).reduce((s: number, i: { count: number }) => s + i.count, 0);
  const size14Used = items.filter((i: { size: number }) => i.size === 14).reduce((s: number, i: { count: number }) => s + i.count, 0);
  const size16Used = items.filter((i: { size: number }) => i.size === 16).reduce((s: number, i: { count: number }) => s + i.count, 0);

  await prisma.stockSnapshot.update({
    where: { id: snapshot.id },
    data: {
      rawStockKg: { decrement: rawUsedKg },
      size12Count: { increment: size12Used },
      size14Count: { increment: size14Used },
      size16Count: { increment: size16Used },
    },
  });

  return NextResponse.json(batch, { status: 201 });
}
