"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Factory,
  Users,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ShoppingCart,
  ArrowUpRight,
} from "lucide-react";

interface DashboardData {
  stock: { rawStockKg: number; size12Count: number; size14Count: number; size16Count: number };
  supplierDebt: number;
  totalRevenue: number;
  totalCOGS: number;
  netProfit: number;
  totalNetProfit: number;
  totalPaid: number;
  customerDebt: number;
  monthlyExpenses: number;
  deductedExpenses: number;
  expenseBreakdown?: Array<{ category: string; _sum: { amount: number | null } }>;
  supplierBalances?: Array<{ id: number; name: string; balance: number }>;
  customerCount: number;
  supplierCount: number;
  recentSales: Array<{
    id: number;
    date: string;
    totalAmount: number;
    paidAmount: number;
    debtAmount: number;
    customer: { name: string };
  }>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(n)) + " so'm";

const formatWeight = (kg: number) => {
  if (kg >= 1000) {
    const tons = Math.floor(kg / 1000);
    const kilos = Math.round(kg % 1000);
    return kilos > 0 ? `${tons} t ${kilos} kg` : `${tons} t`;
  }
  return `${kg.toFixed(1)} kg`;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?date=${selectedDate}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [selectedDate]);

  if (loading)
    return (
      <div style={{ color: "var(--text-secondary)", padding: "3rem", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
        Yuklanmoqda...
      </div>
    );
  if (!data) return null;

  const cards = [
    {
      label: "Xomashyo Ombori",
      value: formatWeight(data.stock.rawStockKg),
      sub: `Ta'minotchilar: ${data.supplierCount} ta`,
      icon: Package,
      gradient: "linear-gradient(135deg, #4f46e5, #6366f1)",
      lightBg: "#ede9fe",
      iconColor: "#4f46e5",
      href: "/ombor",
    },
    {
      label: "Tayyor Mahsulot",
      value: `${data.stock.size12Count + data.stock.size14Count + data.stock.size16Count} ta`,
      sub: `R12:${data.stock.size12Count} · R14:${data.stock.size14Count} · R16:${data.stock.size16Count}`,
      icon: Factory,
      gradient: "linear-gradient(135deg, #059669, #10b981)",
      lightBg: "#d1fae5",
      iconColor: "#059669",
      href: "/ishlab-chiqarish",
    },
    {
      label: "Mijozlar Qarzi",
      value: fmt(data.customerDebt),
      sub: `${data.customerCount} ta mijoz`,
      icon: Users,
      gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
      lightBg: "#fef3c7",
      iconColor: "#d97706",
      href: "/mijozlar",
    },
    {
      label: "Oylik Xarajat",
      value: fmt(data.monthlyExpenses),
      sub: "Tanlangan oy uchun",
      icon: Receipt,
      gradient: "linear-gradient(135deg, #dc2626, #ef4444)",
      lightBg: "#fee2e2",
      iconColor: "#dc2626",
      href: "/xarajatlar",
    },
  ];

  const totalProfit = data.totalNetProfit;
  const todayProfit = Math.max(0, data.netProfit);

  const netProfitCard = {
    label: "Sof Foyda",
    totalValue: fmt(totalProfit),
    todayValue: fmt(todayProfit),
    sub: (() => {
      let bDown = "";
      if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
        const emojis: Record<string, string> = { ELECTRICITY: "⚡", WAGES: "👷", FOOD: "🍱", MISC: "📎" };
        bDown = " (" + data.expenseBreakdown.map(e => `${emojis[e.category] || ''}${new Intl.NumberFormat("uz-UZ").format(e._sum.amount ?? 0)}`).join(' + ') + ")";
      }
      return `Tushum: ${fmt(data.totalRevenue)} | Tannarx: ${fmt(data.totalCOGS)}${data.deductedExpenses > 0 ? ` | Xarajat: ${fmt(data.deductedExpenses)}${bDown}` : ''}`;
    })(),
    icon: TrendingUp,
    gradient: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    lightBg: "#ede9fe",
    iconColor: "#4f46e5",
    href: "/hisobot",
  };



  return (
    <div>
      {/* Hero header */}
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #0891b2 100%)",
          borderRadius: "20px",
          padding: "1.75rem 2rem",
          marginBottom: "1.5rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative circles */}
        <div style={{ position: "absolute", right: -30, top: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
              🧺 Korzinka ERP
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
              Bosh sahifa
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", padding: "0.5rem 0.8rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)" }}>
            <label style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.7rem", marginBottom: "0.2rem", display: "block" }}>Sana bo'yicha hisobot</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontWeight: 600,
                fontSize: "0.95rem",
                fontFamily: "inherit",
                colorScheme: "dark"
              }}
            />
          </div>
        </div>
      </div>

      {/* Net Profit Hero Card */}
      <Link href={netProfitCard.href} style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "1.5rem" }}>
        <div 
          className="stat-card" 
          style={{ 
            position: "relative", 
            overflow: "hidden", 
            cursor: "pointer", 
            padding: "2rem",
            background: "white",
            border: "1px solid var(--border)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: netProfitCard.lightBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <netProfitCard.icon size={24} color={netProfitCard.iconColor} />
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{netProfitCard.label}</div>
            </div>
            <div style={{ background: "var(--bg-secondary)", padding: "0.4rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              Holat: {new Date().toLocaleDateString("uz-UZ")}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bugungi Sof Foyda</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.04em", color: data.netProfit < 0 ? "var(--text-secondary)" : "#10b981" }}>
              {netProfitCard.todayValue}
            </div>
          </div>

          <div style={{ fontSize: "0.85rem", background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #f1f5f9", lineHeight: 1.6, color: "var(--text-secondary)" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-primary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Bugungi Hisobot Tafsilotlari</div>
            {netProfitCard.sub}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: netProfitCard.gradient,
            }}
          />
        </div>
      </Link>
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        {cards.map((card) => (
          <Link href={card.href} key={card.label} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div
              className="stat-card"
              style={{ position: "relative", overflow: "hidden", cursor: "pointer", height: "100%" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value" style={{ marginTop: "0.3rem" }}>{card.value}</div>
                  <div className="stat-sub" style={{ marginTop: "0.25rem" }}>{card.sub}</div>
                </div>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: card.lightBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <card.icon size={18} color={card.iconColor} />
                </div>
              </div>
              {/* Bottom color bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: card.gradient,
                  borderRadius: "0 0 16px 16px",
                }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent sales */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingCart size={15} color="#4f46e5" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>So'nggi Savdolar</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            Ko'rish <ArrowUpRight size={12} />
          </span>
        </div>
        {data.recentSales.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={32} />
            <div style={{ marginTop: "0.5rem", fontWeight: 500 }}>Hali savdo kiritilmagan</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mijoz</th>
                  <th>Sana</th>
                  <th>Jami Summa</th>
                  <th>To'langan</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{sale.customer.name}</td>
                    <td className="text-muted" style={{ whiteSpace: "nowrap" }}>
                      {new Date(sale.date).toLocaleDateString("uz-UZ")}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{fmt(sale.totalAmount)}</td>
                    <td style={{ color: "var(--accent-green)", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(sale.paidAmount)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {sale.debtAmount > 0 ? (
                        <span className="badge badge-red" style={{ whiteSpace: "nowrap", display: "inline-block" }}>{fmt(sale.debtAmount)} qarz</span>
                      ) : (
                        <span className="badge badge-green" style={{ whiteSpace: "nowrap", display: "inline-block" }}>✓ To'liq</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier Balances */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={15} color="#7c3aed" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Ta'minotchilar Holati</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            Ko'rish <ArrowUpRight size={12} />
          </span>
        </div>
        
        {!data.supplierBalances || data.supplierBalances.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={32} />
            <div style={{ marginTop: "0.5rem", fontWeight: 500 }}>Barcha hisob-kitoblar qilingan ✓</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Ta'minotchi</th>
                  <th style={{ textAlign: "right", whiteSpace: "nowrap" }}>Holati</th>
                </tr>
              </thead>
              <tbody>
                {data.supplierBalances.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{s.name}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {s.balance < 0 ? (
                        <span className="badge badge-green" style={{ whiteSpace: "nowrap", display: "inline-block" }}>
                          Avans: {fmt(Math.abs(s.balance))}
                        </span>
                      ) : (
                        <span className="badge badge-red" style={{ whiteSpace: "nowrap", display: "inline-block" }}>
                          Qarz: {fmt(s.balance)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
