import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

export async function GET() {
  try {
    // Ma'lumotlarni bazadan olish
    const sales = await prisma.sale.findMany({
      include: { customer: true, items: true },
      orderBy: { date: "desc" },
    });

    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });

    const rawMaterials = await prisma.rawMaterial.findMany({
      include: { supplier: true },
      orderBy: { date: "desc" },
    });

    const productions = await prisma.productionBatch.findMany({
      include: { items: true },
      orderBy: { date: "desc" },
    });

    const customers = await prisma.customer.findMany({
      include: { sales: true, customerPayments: true },
      orderBy: { name: "asc" },
    });

    const suppliers = await prisma.supplier.findMany({
      include: { rawMaterials: true, supplierPayments: true },
      orderBy: { name: "asc" },
    });

    // Umumiy hisob-kitoblar (aggstats)
    const saleAgg = await prisma.sale.aggregate({
      _sum: { totalAmount: true, paidAmount: true, debtAmount: true },
    });
    const totalRevenue = saleAgg._sum.totalAmount ?? 0;
    const totalCollected = saleAgg._sum.paidAmount ?? 0;
    const totalCustomerDebt = saleAgg._sum.debtAmount ?? 0;

    const rawAgg = await prisma.rawMaterial.aggregate({
      _sum: { totalAmount: true, paidAmount: true, debtAmount: true },
    });
    const totalRawCost = rawAgg._sum.totalAmount ?? 0;
    const totalSupplierDebt = rawAgg._sum.debtAmount ?? 0;

    const expenseAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
    });
    const totalExpenses = expenseAgg._sum.amount ?? 0;
    const netProfit = totalCollected - totalRawCost - totalExpenses;
    const grossProfit = totalRevenue - totalRawCost - totalExpenses;

    // EXCEL VARAQLARIGA MOSLAB FORMATLASH

    // 1. Umumiy
    const summaryData = [
      { Kategoriya: "Jami Savdo (Brutto)", Summa: totalRevenue },
      { Kategoriya: "Tushgan Pul (Sof Savdo)", Summa: totalCollected },
      { Kategoriya: "Mijozlar Qarzi", Summa: totalCustomerDebt },
      { Kategoriya: "Xomashyo Xarajatlari (Seryo)", Summa: totalRawCost },
      { Kategoriya: "Ta'minotchilar Qarzi", Summa: totalSupplierDebt },
      { Kategoriya: "Operatsion Xarajatlar", Summa: totalExpenses },
      { Kategoriya: "Kutilayotgan Foyda (Brutto Foyda)", Summa: grossProfit },
      { Kategoriya: "Sof Foyda (Real Tushum)", Summa: netProfit },
    ];

    // 2. Savdolar
    const salesData = sales.map((sale) => ({
      ID: sale.id,
      Sana: new Date(sale.date).toLocaleString("uz-UZ"),
      Mijoz: sale.customer.name,
      "Jami Summa": sale.totalAmount,
      "To'langan": sale.paidAmount,
      Qarz: sale.debtAmount,
      Izoh: sale.notes || "",
    }));

    // 3. Xaridlar (Seryo)
    const rawData = rawMaterials.map(rm => ({
      ID: rm.id,
      Sana: new Date(rm.date).toLocaleString("uz-UZ"),
      "Ta'minotchi": rm.supplier.name,
      "Og'irlik (kg)": rm.weightKg,
      "Narx (so'm/kg)": rm.pricePerKg,
      "Jami Summa": rm.totalAmount,
      "To'langan": rm.paidAmount,
      "Qarz": rm.debtAmount,
      Izoh: rm.notes || "",
    }));

    // 4. Ishlab Chiqarish
    const productionData = productions.map((p) => ({
      ID: p.id,
      Sana: new Date(p.date).toLocaleString("uz-UZ"),
      "Seryo (kg)": p.rawUsedKg,
      "Korzinka (dona)": p.totalBaskets,
      Izoh: p.notes || "",
    }));

    // 5. Xarajatlar
    const expCategoryTranslation: Record<string, string> = {
      ELECTRICITY: "Elektr",
      WAGES: "Ish haqi",
      FOOD: "Ovqat",
      MISC: "Boshqa",
    };
    const expensesData = expenses.map((e) => ({
      ID: e.id,
      Sana: new Date(e.date).toLocaleString("uz-UZ"),
      Kategoriya: expCategoryTranslation[e.category] || e.category,
      Summa: e.amount,
      Izoh: e.notes || "",
    }));

    // 6. Mijozlar qarzdorligi
    const cusDebtData = customers.map((c) => {
      const totalDebt = c.sales.reduce((a, s) => a + s.debtAmount, 0);
      return {
        Mijoz: c.name,
        Telefon: c.phone || "",
        "Jami Qarz": totalDebt,
      };
    }).filter((c) => c["Jami Qarz"] > 0);

    // 7. Ta'minotchilar qarzdorligi
    const supDebtData = suppliers.map((s) => {
      const totalDebt = s.rawMaterials.reduce((a, r) => a + r.debtAmount, 0);
      return {
        "Ta'minotchi": s.name,
        Telefon: s.phone || "",
        "Jami Qarz": totalDebt,
      };
    }).filter((s) => s["Jami Qarz"] > 0);

    // EXCEL FAYLINI YARATISH
    const workbook = xlsx.utils.book_new();

    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(summaryData), "Umumiy Hisobot");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(salesData), "Savdo Tarixi");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(rawData), "Seryo Xaridi");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(productionData), "Ishlab Chiqarish");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(expensesData), "Xarajatlar");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(cusDebtData), "Mijozlar Qarzi");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(supDebtData), "Ta'minotchi Qarzi");

    // BUFFER GA OGIRISH
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Barcha_Hisobotlar.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Excel eksport xatosi:", error);
    return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}
