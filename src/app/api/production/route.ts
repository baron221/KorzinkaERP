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

  // Check stock (Dynamic)
  const rawReceived = await prisma.rawMaterial.aggregate({ _sum: { weightKg: true } });
  const rawUsedPrev = await prisma.productionBatch.aggregate({ _sum: { rawUsedKg: true } });
  const currentRawStock = (rawReceived._sum.weightKg ?? 0) - (rawUsedPrev._sum.rawUsedKg ?? 0);

  if (currentRawStock < rawUsedKg) {
    return NextResponse.json(
      { error: `Omborda yetarli seryo yo'q. Mavjud: ${currentRawStock.toFixed(2)} kg, kerak: ${rawUsedKg.toFixed(2)} kg` },
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

  await prisma.activityLog.create({
    data: {
      action: "CREATE",
      entity: "Production",
      entityId: batch.id,
      snapshot: batch as object,
    },
  });

  return NextResponse.json(batch, { status: 201 });
}
