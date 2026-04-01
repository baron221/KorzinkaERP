"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Download } from "lucide-react";

interface ReportData {
  totalRevenue: number;
  totalCollected: number;
  totalCustomerDebt: number;
  totalRawCost: number;
  totalSupplierDebt: number;
  totalExpenses: number;
  netProfit: number;
  grossProfit: number;
  expensesByCategory: Array<{ category: string; _sum: { amount: number } }>;
  monthlyData: Array<{ month: string; revenue: number; expenses: number }>;
  stock: { rawStockKg: number; size12Count: number; size14Count: number; size16Count: number } | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(n)) + " so'm";

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICITY: "⚡ Elektr",
  WAGES: "👷 Ish haqi",
  FOOD: "🍱 Ovqat",
  MISC: "📎 Mayda",
};

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.4rem" }}>{label}</div>
        {payload.map((entry, i) => (
          <div key={i} style={{ color: entry.color, fontSize: "0.8rem" }}>
            {entry.name}: {fmt(entry.value)}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function HisobotPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "3rem" }}>Yuklanmoqda...</div>;
  if (!data) return null;

  const isProfit = data.netProfit >= 0;

  const summaryCards = [
    { label: "Jami Daromad", value: fmt(data.totalRevenue), sub: `Tushgan: ${fmt(data.totalCollected)}`, color: "#10b981", icon: TrendingUp },
    { label: "Xomashyo Xarajati", value: fmt(data.totalRawCost), sub: `Qarz: ${fmt(data.totalSupplierDebt)}`, color: "#6366f1", icon: DollarSign },
    { label: "Operatsion Xarajat", value: fmt(data.totalExpenses), sub: "Elektr, ish haqi, ovqat...", color: "#f59e0b", icon: DollarSign },
    { label: "Mijozlar Qarzi", value: fmt(data.totalCustomerDebt), sub: "Undirilmagan", color: "#ef4444", icon: AlertCircle },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="page-title">Hisobot va Sof Foyda</div>
          <div className="page-sub">Foyda va Zarar (P&L) hisobot</div>
        </div>
        <button
          onClick={() => {
            window.location.href = "/api/export-excel";
          }}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", cursor: "pointer", background: "var(--accent-blue, #3b82f6)", color: "white", fontWeight: 600, fontSize: "0.9rem" }}
        >
          <Download size={18} />
          Excelga Yuklash
        </button>
      </div>

      {/* Net Profit Banner */}
      <div
        className="card"
        style={{
          marginBottom: "1.5rem",
          background: isProfit ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          borderColor: isProfit ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
            {isProfit ? "✅ Sof Foyda (Tushgan puldan)" : "❌ Zarar"}
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: isProfit ? "var(--accent-green)" : "var(--accent-red)" }}>
            {fmt(Math.abs(data.netProfit))}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Seryo tannarxi + Xarajatlarni ayirib
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Brutto foyda</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: data.grossProfit >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
            {fmt(data.grossProfit)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
            (Nasiya bilan birga)
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        {summaryCards.map((card) => (
          <div key={card.label} className="stat-card" style={{ borderLeft: `3px solid ${card.color}` }}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ fontSize: "1.05rem" }}>{card.value}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {/* Monthly bar chart */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: "1rem" }}>📊 Oylik Daromad va Xarajat</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v / 1000000).toFixed(0) + "M"}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}
              />
              <Bar dataKey="revenue" name="Daromad" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Xarajat" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense breakdown */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: "1rem" }}>🗂 Xarajat Taqsimoti</div>
          {data.expensesByCategory.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <div>Xarajat kiritilmagan</div>
            </div>
          ) : (
            <div>
              {data.expensesByCategory.map((item) => {
                const total = data.totalExpenses;
                const pct = total > 0 ? (item._sum.amount / total) * 100 : 0;
                return (
                  <div key={item.category} style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {fmt(item._sum.amount)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                          borderRadius: 3,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* P&L breakdown table */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: "1rem" }}>📋 Foyda va Zarar Hisobi</div>
        <table style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.6rem 0", color: "var(--text-secondary)" }}>Jami savdo daromadi</td>
              <td style={{ padding: "0.6rem 0", textAlign: "right", fontWeight: 600 }}>{fmt(data.totalRevenue)}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.6rem 0", color: "var(--text-secondary)" }}>— Xomashyo tannarxi</td>
              <td style={{ padding: "0.6rem 0", textAlign: "right", fontWeight: 600, color: "var(--accent-red)" }}>- {fmt(data.totalRawCost)}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.6rem 0", color: "var(--text-secondary)" }}>— Jami xarajatlar</td>
              <td style={{ padding: "0.6rem 0", textAlign: "right", fontWeight: 600, color: "var(--accent-red)" }}>- {fmt(data.totalExpenses)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "0.75rem 0", fontWeight: 700 }}>Brutto Foyda / Zarar</td>
              <td style={{ padding: "0.75rem 0", textAlign: "right", fontWeight: 800, color: data.grossProfit >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                {fmt(data.grossProfit)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "0.6rem 0", color: "var(--text-secondary)" }}>— Hali to'lanmagan (nasiya)</td>
              <td style={{ padding: "0.6rem 0", textAlign: "right", fontWeight: 600, color: "var(--accent-yellow)" }}>- {fmt(data.totalCustomerDebt)}</td>
            </tr>
            <tr style={{ borderTop: "2px solid var(--border)", background: isProfit ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)" }}>
              <td style={{ padding: "0.75rem 0.5rem", fontWeight: 800, fontSize: "1rem" }}>SOF FOYDA (Real tushum)</td>
              <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 900, fontSize: "1.1rem", color: isProfit ? "var(--accent-green)" : "var(--accent-red)" }}>
                {fmt(data.netProfit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
