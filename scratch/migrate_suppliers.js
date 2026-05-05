const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Ta'minotchilar migratsiyasi boshlandi...");

  // 1. RawMaterial'larni olamiz
  const materials = await prisma.rawMaterial.findMany({
    where: { paidAmount: { gt: 0 } },
    include: { supplierPayments: true }
  });

  for (const m of materials) {
    const sumPayments = m.supplierPayments.reduce((s, p) => s + p.amount, 0);
    
    // Agar paidAmount boru, lekin SupplierPayment yaratilmagan bo'lsa
    if (m.paidAmount > sumPayments) {
      const missingAmount = m.paidAmount - sumPayments;
      console.log(`RawMaterial ${m.id} uchun ${missingAmount} to'lov yaratilmoqda...`);
      
      await prisma.supplierPayment.create({
        data: {
          supplierId: m.supplierId,
          rawMaterialId: m.id,
          amount: missingAmount,
          date: m.date,
          notes: "Seryo qabul qilingandagi to'lov (Migratsiya)"
        }
      });
    }
  }

  console.log("Migratsiya yakunlandi.");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
