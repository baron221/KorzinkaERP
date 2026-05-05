const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("PRODUCTION Migratsiyasi boshlanmoqda (Takomillashtirilgan variant)...");

  // 1. Barcha paidAmount > 0 bo'lgan savdolarni olamiz
  const sales = await prisma.sale.findMany({
    where: { paidAmount: { gt: 0 } },
    include: { payments: true }
  });

  for (const s of sales) {
    const sumPayments = s.payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Agar savdoda to'langan summa boru, lekin CustomerPayment'da hali qayd etilmagan bo'lsa
    if (s.paidAmount > sumPayments) {
      const missingAmount = s.paidAmount - sumPayments;
      console.log(`Sale ${s.id} uchun ${missingAmount} to'lov yaratilmoqda...`);
      
      await prisma.customerPayment.create({
        data: {
          customerId: s.customerId,
          saleId: s.id,
          amount: missingAmount,
          date: s.date,
          notes: "Savdo vaqtidagi to'lov (Migratsiya v2)"
        }
      });
    }
  }

  console.log("Migratsiya yakunlandi.");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
