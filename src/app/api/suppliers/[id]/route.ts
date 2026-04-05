import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        rawMaterials: {
          orderBy: { date: "asc" }
        },
        supplierPayments: {
          orderBy: { date: "asc" }
        }
      }
    });

    if (!supplier) {
      return NextResponse.json({ error: "Ta'minotchi topilmadi" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
