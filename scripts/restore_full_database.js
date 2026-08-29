const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreAll() {
  const backupPath = path.join(__dirname, '..', 'database_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('❌ database_backup.json fayli topilmadi!');
    process.exit(1);
  }

  console.log('🔄 Baza ma\'lumotlari tiklanmoqda (Restore)...');
  const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  // Disable logs during restore if possible, or just insert
  try {
    // 1. Suppliers
    if (data.suppliers?.length) {
      console.log(`- ${data.suppliers.length} ta ta'minotchi yuklanmoqda...`);
      for (const item of data.suppliers) {
        await prisma.supplier.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 2. Customers
    if (data.customers?.length) {
      console.log(`- ${data.customers.length} ta mijoz yuklanmoqda...`);
      for (const item of data.customers) {
        await prisma.customer.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 3. Raw Materials
    if (data.rawMaterials?.length) {
      console.log(`- ${data.rawMaterials.length} ta xomashyo kirimi yuklanmoqda...`);
      for (const item of data.rawMaterials) {
        await prisma.rawMaterial.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 4. Supplier Payments
    if (data.supplierPayments?.length) {
      console.log(`- ${data.supplierPayments.length} ta ta'minotchi to'lovi yuklanmoqda...`);
      for (const item of data.supplierPayments) {
        await prisma.supplierPayment.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 5. Production Batches & Items
    if (data.productionBatches?.length) {
      console.log(`- ${data.productionBatches.length} ta ishlab chiqarish partiyasi yuklanmoqda...`);
      for (const item of data.productionBatches) {
        await prisma.productionBatch.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    if (data.productionItems?.length) {
      for (const item of data.productionItems) {
        await prisma.productionItem.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 6. Sales & Sale Items
    if (data.sales?.length) {
      console.log(`- ${data.sales.length} ta savdo yuklanmoqda...`);
      for (const item of data.sales) {
        await prisma.sale.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    if (data.saleItems?.length) {
      for (const item of data.saleItems) {
        await prisma.saleItem.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 7. Customer Payments
    if (data.customerPayments?.length) {
      console.log(`- ${data.customerPayments.length} ta mijoz to'lovi yuklanmoqda...`);
      for (const item of data.customerPayments) {
        await prisma.customerPayment.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 8. Customer Returns & Return Items
    if (data.customerReturns?.length) {
      console.log(`- ${data.customerReturns.length} ta vozvrat yuklanmoqda...`);
      for (const item of data.customerReturns) {
        await prisma.customerReturn.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    if (data.customerReturnItems?.length) {
      for (const item of data.customerReturnItems) {
        await prisma.customerReturnItem.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 9. Expenses
    if (data.expenses?.length) {
      console.log(`- ${data.expenses.length} ta xarajat yuklanmoqda...`);
      for (const item of data.expenses) {
        await prisma.expense.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 10. Stock Snapshots
    if (data.stockSnapshots?.length) {
      for (const item of data.stockSnapshots) {
        await prisma.stockSnapshot.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 11. Activity Logs
    if (data.activityLogs?.length) {
      console.log(`- ${data.activityLogs.length} ta audit jurnali yuklanmoqda...`);
      for (const item of data.activityLogs) {
        await prisma.activityLog.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    console.log('🎉 Barcha ma\'lumotlar muvaffaqiyatli tiklandi va bazaga yozildi!');
  } catch (e) {
    console.error('❌ Tiklashda xatolik:', e);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAll();
