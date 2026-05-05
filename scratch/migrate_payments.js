const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Migratsiya boshlandi...");

  // 1. ActivityLog'dan savdo yaratish amallarini olamiz
  const logs = await prisma.activityLog.findMany({
    where: { entity: 'Sale', action: 'CREATE' }
  });

  for (const log of logs) {
    const snap = typeof log.snapshot === 'string' ? JSON.parse(log.snapshot) : log.snapshot;
    const initialPaid = snap.paidAmount;

    if (initialPaid > 0) {
      // 2. Ushbu savdo uchun shu miqdordagi to'lov CustomerPayment'da bormi tekshiramiz
      // Eslatma: Eski mantiqda savdo vaqtidagi to'lov CustomerPayment yaratmagan.
      // Lekin saleId null bo'lishi mumkinligini hisobga olamiz.
      // Bizga aniq shu savdoga biriktirilgan to'lov kerak.
      
      const existingPayment = await prisma.customerPayment.findFirst({
        where: {
          customerId: snap.customerId,
          amount: initialPaid,
          date: new Date(snap.date),
          notes: { contains: "Savdo vaqtidagi to'lov" } // O'zimizning yangi qoidamiz bo'yicha
        }
      });

      if (!existingPayment) {
        // Check if customer exists
        const customerExists = await prisma.customer.findUnique({ where: { id: snap.customerId } });
        if (customerExists) {
          console.log(`Sale ${log.entityId} uchun ${initialPaid} to'lov yaratilmoqda...`);
          await prisma.customerPayment.create({
            data: {
              customerId: snap.customerId,
              saleId: log.entityId,
              amount: initialPaid,
              date: new Date(snap.date),
              notes: "Savdo vaqtidagi to'lov (Migratsiya)"
            }
          });
        } else {
          console.log(`Sale ${log.entityId} uchun mijoz (ID: ${snap.customerId}) topilmadi, o'tkazib yuborildi.`);
        }
      } else {
        console.log(`Sale ${log.entityId} uchun to'lov allaqachon mavjud.`);
      }
    }
  }

  // 3. ActivityLog'da yo'q lekin Sale'da paidAmount borlarni ham tekshiramiz (ID 21 kabi)
  const salesWithoutLogs = await prisma.sale.findMany({
    where: {
      paidAmount: { gt: 0 },
      id: { notIn: logs.map(l => l.entityId) }
    }
  });

  for (const s of salesWithoutLogs) {
    const customerExists = await prisma.customer.findUnique({ where: { id: s.customerId } });
    if (customerExists) {
      console.log(`Sale ${s.id} (Logda yo'q) uchun ${s.paidAmount} to'lov yaratilmoqda...`);
      await prisma.customerPayment.create({
        data: {
          customerId: s.customerId,
          saleId: s.id,
          amount: s.paidAmount,
          date: s.date,
          notes: "Savdo vaqtidagi to'lov (Migratsiya - Logda yo'q)"
        }
      });
    }
  }

  console.log("Migratsiya yakunlandi.");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
