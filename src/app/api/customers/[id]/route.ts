import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/customers/[id] — single customer with full history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(id) },
    include: {
      sales: {
        orderBy: { date: "desc" },
        include: { items: true, payments: true },
      },
      customerPayments: { orderBy: { date: "desc" } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  // Compute total debt
  const totalDebt = customer.sales.reduce((sum, s) => sum + s.debtAmount, 0);
  return NextResponse.json({ ...customer, totalDebt });
}

// DELETE /api/customers/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
