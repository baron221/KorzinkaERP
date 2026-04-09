import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/delete?type=customer|supplier|expense|raw|production|sale&id=123
 * Before deleting, saves a snapshot to ActivityLog.
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
        const customerSales = await prisma.sale.findMany({
          where: { customerId: id },
          select: { id: true },
        });
        const saleIds = customerSales.map((s) => s.id);

        const customer = await prisma.customer.findUnique({ where: { id }, include: { sales: true } });
        await prisma.activityLog.create({
          data: { action: "DELETE", entity: "Customer", entityId: id, snapshot: customer as object },
        });

        await prisma.customerPayment.deleteMany({ where: { customerId: id } });
        if (saleIds.length > 0) {
          await prisma.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
          await prisma.sale.deleteMany({ where: { customerId: id } });
        }
        await prisma.customer.delete({ where: { id } });
        break;
      }
      case "supplier": {
        const supplier = await prisma.supplier.findUnique({ where: { id }, include: { rawMaterials: true } });
        await prisma.activityLog.create({
          data: { action: "DELETE", entity: "Supplier", entityId: id, snapshot: supplier as object },
        });

        const supplierMaterials = await prisma.rawMaterial.findMany({
          where: { supplierId: id },
          select: { id: true },
        });
        const matIds = supplierMaterials.map((m) => m.id);
        await prisma.supplierPayment.deleteMany({ where: { supplierId: id } });
        if (matIds.length > 0) {
          await prisma.rawMaterial.deleteMany({ where: { supplierId: id } });
        }
        await prisma.supplier.delete({ where: { id } });
        break;
      }
      case "supplier-payment": {
        const payment = await prisma.supplierPayment.findUnique({ where: { id } });
        if (payment) {
          await prisma.activityLog.create({
            data: { action: "DELETE", entity: "SupplierPayment", entityId: id, snapshot: payment as object },
          });
          if (payment.rawMaterialId) {
            await prisma.rawMaterial.update({
              where: { id: payment.rawMaterialId },
              data: {
                paidAmount: { decrement: payment.amount },
                debtAmount: { increment: payment.amount },
              },
            });
          }
        }
        await prisma.supplierPayment.delete({ where: { id } });
        break;
      }
      case "expense": {
        const expense = await prisma.expense.findUnique({ where: { id } });
        if (expense) {
          await prisma.activityLog.create({
            data: { action: "DELETE", entity: "Expense", entityId: id, snapshot: expense as object },
          });
        }
        await prisma.expense.delete({ where: { id } });
        break;
      }
      case "raw": {
        const raw = await prisma.rawMaterial.findUnique({ where: { id }, include: { supplier: true } });
        if (raw) {
          await prisma.activityLog.create({
            data: { action: "DELETE", entity: "RawMaterial", entityId: id, snapshot: raw as object },
          });
        }
        await prisma.rawMaterial.delete({ where: { id } });
        break;
      }
      case "production": {
        const batch = await prisma.productionBatch.findUnique({ where: { id }, include: { items: true } });
        if (batch) {
          await prisma.activityLog.create({
            data: { action: "DELETE", entity: "Production", entityId: id, snapshot: batch as object },
          });
        }
        await prisma.productionItem.deleteMany({ where: { batchId: id } });
        await prisma.productionBatch.delete({ where: { id } });
        break;
      }
      case "sale": {
        const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true, customer: true } });
        if (sale) {
          await prisma.activityLog.create({
            data: { action: "DELETE", entity: "Sale", entityId: id, snapshot: sale as object },
          });
        }
        await prisma.saleItem.deleteMany({ where: { saleId: id } });
        await prisma.sale.delete({ where: { id } });
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    if (error.code === "P2003") {
      return NextResponse.json({ error: "O'chirishning iloji yo'q: Bog'langan ma'lumotlar mavjud" }, { status: 400 });
    }
    return NextResponse.json({ error: "O'chirishda xatolik yuz berdi" }, { status: 500 });
  }
}
