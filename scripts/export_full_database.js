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

  // Sanali nusxa: backups/backup_YYYY-MM-DD.json (oxirgi 30 tasi saqlanadi)
  const backupsDir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(backupsDir, { recursive: true });
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const datedPath = path.join(backupsDir, `backup_${stamp}.json`);
  fs.copyFileSync(backupPath, datedPath);
  console.log(`✅ Sanali nusxa: ${datedPath}`);
  const dated = fs.readdirSync(backupsDir).filter(f => /^backup_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  dated.slice(0, Math.max(0, dated.length - 30)).forEach(f => fs.unlinkSync(path.join(backupsDir, f)));
  
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
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
