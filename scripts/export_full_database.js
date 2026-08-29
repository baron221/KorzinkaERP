const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportAll() {
  console.log('🔄 Bazadagi barcha ma\'lumotlar eksport qilinmoqda...');

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

  const backupPath = path.join(__dirname, '..', 'database_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Barcha ma'lumotlar saqlandi: ${backupPath}`);
  
  // Count records
  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key])) {
      console.log(` - ${key}: ${data[key].length} ta yozuv`);
    }
  });
}

exportAll()
  .catch(err => {
    console.error('❌ Eksportda xatolik:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
