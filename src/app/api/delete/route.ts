import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/delete?type=customer|supplier|expense|raw|production|sale&id=123
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const idStr = searchParams.get("id");

    if (!type || !idStr) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    const id = parseInt(idStr);

    switch (type) {
      case "customer": {
        // Get all sales for this customer
        const customerSales = await prisma.sale.findMany({
          where: { customerId: id },
          select: { id: true },
        });
        const saleIds = customerSales.map((s) => s.id);
        // Delete in order: payments → sale items → sales → customer
        await prisma.customerPayment.deleteMany({ where: { customerId: id } });
        if (saleIds.length > 0) {
          await prisma.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
          await prisma.sale.deleteMany({ where: { customerId: id } });
        }
        await prisma.customer.delete({ where: { id } });
        break;
      }
      case "supplier": {
        // Get all raw material IDs for this supplier
        const supplierMaterials = await prisma.rawMaterial.findMany({
          where: { supplierId: id },
          select: { id: true },
        });
        const matIds = supplierMaterials.map((m) => m.id);
        // Delete in order: payments → raw materials → supplier
        await prisma.supplierPayment.deleteMany({ where: { supplierId: id } });
        if (matIds.length > 0) {
          await prisma.rawMaterial.deleteMany({ where: { supplierId: id } });
        }
        await prisma.supplier.delete({ where: { id } });
        break;
      }
      case "expense":
        await prisma.expense.delete({ where: { id } });
        break;
      case "raw":
        await prisma.rawMaterial.delete({ where: { id } });
        break;
      case "production":
        await prisma.productionItem.deleteMany({ where: { batchId: id } });
        await prisma.productionBatch.delete({ where: { id } });
        break;
      case "sale":
        await prisma.saleItem.deleteMany({ where: { saleId: id } });
        await prisma.sale.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    // Handle Prisms constraint errors (e.g. child records exist)
    if (error.code === "P2003") {
      return NextResponse.json({ error: "O'chirishning iloji yo'q: Bog'langan ma'lumotlar mavjud" }, { status: 400 });
    }
    return NextResponse.json({ error: "O'chirishda xatolik yuz berdi" }, { status: 500 });
  }
}
