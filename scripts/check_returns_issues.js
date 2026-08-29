const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', 'database_backup.json');
const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

console.log('--- 🔍 DIAGNOSTIC REPORT ON VOZVRATS ---');
console.log(`Total Customer Returns: ${data.customerReturns.length}`);
console.log(`Total Return Items: ${data.customerReturnItems.length}`);

// 1. Check if return totalAmount matches sum of return items
let returnItemMismatch = 0;
data.customerReturns.forEach(r => {
  const items = data.customerReturnItems.filter(i => i.returnId === r.id);
  const itemsSum = items.reduce((s, i) => s + (i.count * i.unitPrice), 0);
  if (itemsSum !== r.totalAmount) {
    console.log(`⚠️ Mismatch in Return #${r.id} (Customer ID ${r.customerId}): header total = ${r.totalAmount}, items sum = ${itemsSum}`);
    returnItemMismatch++;
  }
});
if (returnItemMismatch === 0) {
  console.log('✅ All Return totalAmounts match their item subtotal sums.');
}

// 2. Check customers who have returns and inspect their balance calculations
console.log('\n--- 👥 CUSTOMERS WITH RETURNS & THEIR BALANCES ---');
const customerIdsWithReturns = [...new Set(data.customerReturns.map(r => r.customerId))];

customerIdsWithReturns.forEach(cid => {
  const customer = data.customers.find(c => c.id === cid);
  if (!customer) return;

  const sales = data.sales.filter(s => s.customerId === cid);
  const payments = data.customerPayments.filter(p => p.customerId === cid);
  const returns = data.customerReturns.filter(r => r.customerId === cid);

  const totalBuy = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalRet = returns.reduce((sum, r) => sum + r.totalAmount, 0);
  const balance = totalBuy - totalPaid - totalRet;

  console.log(`\nMijoz #${cid} (${customer.name}):`);
  console.log(`  - Total Buy: ${totalBuy.toLocaleString('uz-UZ')}`);
  console.log(`  - Total Paid: ${totalPaid.toLocaleString('uz-UZ')}`);
  console.log(`  - Total Ret: ${totalRet.toLocaleString('uz-UZ')}`);
  console.log(`  - Balance: ${balance.toLocaleString('uz-UZ')} (${balance > 0 ? 'QARZ' : balance < 0 ? 'HAQDOR/AVANS' : 'NOL'})`);

  console.log('  - Returns list:');
  returns.forEach(r => {
    const rItems = data.customerReturnItems.filter(i => i.returnId === r.id);
    const itemDetails = rItems.map(i => `R${i.size}x${i.count}@${i.unitPrice}`).join(', ');
    console.log(`    * Return #${r.id} (Date: ${r.date?.slice(0,10)}): ${r.totalAmount.toLocaleString('uz-UZ')} so'm [${itemDetails}] (Notes: ${r.notes || '—'})`);
  });

  // Check if there are negative payments or cash refund payments for this customer
  const refundPayments = payments.filter(p => p.amount < 0 || (p.notes && p.notes.includes('Vozvrat')));
  if (refundPayments.length > 0) {
    console.log('  - Refund payments recorded:');
    refundPayments.forEach(p => {
      console.log(`    * Payment #${p.id}: ${p.amount.toLocaleString('uz-UZ')} so'm (${p.notes})`);
    });
  }
});
