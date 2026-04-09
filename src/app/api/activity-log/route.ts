import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const entityLabels: Record<string, string> = {
  Sale: "Savdo",
  Expense: "Xarajat",
  RawMaterial: "Xomashyo (Seryo)",
  Production: "Ishlab Chiqarish",
  SupplierPayment: "Ta'minotchi To'lovi",
  CustomerPayment: "Mijoz To'lovi",
  Customer: "Mijoz",
  Supplier: "Ta'minotchi",
};

export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const enriched = logs.map((log) => ({
      ...log,
      entityLabel: entityLabels[log.entity] || log.entity,
      actionLabel: log.action === "DELETE" ? "O'chirildi" : "Yaratildi",
    }));

    return NextResponse.json(enriched);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
