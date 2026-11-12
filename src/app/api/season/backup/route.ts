import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/season/backup — bazadagi barcha ma'lumotlarni JSON fayl qilib yuklab beradi.
// Fayl tuzilishi scripts/export_full_database.js bilan bir xil,
// ya'ni scripts/restore_full_database.js orqali tiklash mumkin.
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Faqat direktor yuklab olishi mumkin" }, { status: 403 });
    }

    const data = {
      exportedAt: new Date().toISOString(),
      suppliers: await prisma.supplier.findMany(),
      rawMaterials: await prisma.rawMaterial.findMany(),
      productionBatches: await prisma.productionBatch.findMany(),
      productionItems: await prisma.productionItem.findMany(),
      customers: await prisma.customer.findMany(),
      sales: await prisma.sale.findMany(),
      saleItems: await prisma.saleItem.findMany(),
      customerPayments: await prisma.customerPayment.findMany(),
      customerReturns: await prisma.customerReturn.findMany(),
      customerReturnItems: await prisma.customerReturnItem.findMany(),
      expenses: await prisma.expense.findMany(),
      stockSnapshots: await prisma.stockSnapshot.findMany(),
      supplierPayments: await prisma.supplierPayment.findMany(),
      activityLogs: await prisma.activityLog.findMany(),
    };

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="sezon_backup_${stamp}.json"`,
      },
    });
  } catch (error) {
    console.error("Sezon backup xatosi:", error);
    return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}
