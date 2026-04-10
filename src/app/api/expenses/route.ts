import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM format

  let where = {};
  if (month) {
    const [year, m] = month.split("-");
    const start = new Date(parseInt(year), parseInt(m) - 1, 1);
    const end = new Date(parseInt(year), parseInt(m), 1);
    where = { date: { gte: start, lt: end } };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = expenses.reduce(
    (acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    },
    {}
  );

  return NextResponse.json({ expenses, total, byCategory });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category, amount, notes, date } = body;

  if (!category || !amount) {
    return NextResponse.json({ error: "Majburiy maydonlar" }, { status: 400 });
  }

  const VALID_CATEGORIES = ["ELECTRICITY", "WAGES", "FOOD", "MISC"];
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Noto'g'ri kategoriya" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      category,
      amount: parseFloat(amount),
      notes: notes || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
      snapshot: expense as object,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
