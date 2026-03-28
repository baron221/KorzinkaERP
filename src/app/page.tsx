"use client";
import { useEffect, useState } from "react";
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
  totalPaid: number;
  customerDebt: number;
  monthlyExpenses: number;
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

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
      value: `${data.stock.rawStockKg.toFixed(1)} kg`,
      sub: `Ta'minotchilar: ${data.supplierCount} ta`,
      icon: Package,
      gradient: "linear-gradient(135deg, #4f46e5, #6366f1)",
      lightBg: "#ede9fe",
      iconColor: "#4f46e5",
    },
    {
      label: "Tayyor Mahsulot",
      value: `${data.stock.size12Count + data.stock.size14Count + data.stock.size16Count} ta`,
      sub: `R12:${data.stock.size12Count} · R14:${data.stock.size14Count} · R16:${data.stock.size16Count}`,
      icon: Factory,
      gradient: "linear-gradient(135deg, #059669, #10b981)",
      lightBg: "#d1fae5",
      iconColor: "#059669",
    },
    {
      label: "Mijozlar Qarzi",
      value: fmt(data.customerDebt),
      sub: `${data.customerCount} ta mijoz`,
      icon: Users,
      gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
      lightBg: "#fef3c7",
      iconColor: "#d97706",
    },
    {
      label: "Oylik Xarajat",
      value: fmt(data.monthlyExpenses),
      sub: "Joriy oy",
      icon: Receipt,
      gradient: "linear-gradient(135deg, #dc2626, #ef4444)",
      lightBg: "#fee2e2",
      iconColor: "#dc2626",
    },
    {
      label: "Jami Daromad",
      value: fmt(data.totalRevenue),
      sub: `Tushgan: ${fmt(data.totalPaid)}`,
      icon: TrendingUp,
      gradient: "linear-gradient(135deg, #0891b2, #06b6d4)",
      lightBg: "#cffafe",
      iconColor: "#0891b2",
    },
    {
      label: "Ta'minotchi Qarzi",
      value: fmt(data.supplierDebt),
      sub: "To'lanmagan nasiya",
      icon: TrendingDown,
      gradient: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
      lightBg: "#ede9fe",
      iconColor: "#7c3aed",
    },
  ];

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
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            🧺 Korzinka ERP
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Bosh sahifa
          </div>
          <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", marginTop: "0.3rem" }}>
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        {cards.map((card) => (
          <div
            key={card.label}
            className="stat-card"
            style={{ position: "relative", overflow: "hidden" }}
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
        ))}
      </div>

      {/* Recent sales */}
      <div className="card">
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
                    <td style={{ fontWeight: 600 }}>{sale.customer.name}</td>
                    <td className="text-muted">
                      {new Date(sale.date).toLocaleDateString("uz-UZ")}
                    </td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>{fmt(sale.totalAmount)}</td>
                    <td style={{ color: "var(--accent-green)", fontWeight: 600 }}>{fmt(sale.paidAmount)}</td>
                    <td>
                      {sale.debtAmount > 0 ? (
                        <span className="badge badge-red">{fmt(sale.debtAmount)} qarz</span>
                      ) : (
                        <span className="badge badge-green">✓ To'liq</span>
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
