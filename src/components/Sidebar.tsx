"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Factory,
  Users,
  Receipt,
  BarChart3,
  ShoppingCart,
  Sun,
  Moon,
  Clock,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";


const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "#4f46e5" },
  { href: "/ombor", label: "Ta'minot & Ombor", icon: Package, color: "#0891b2" },
  { href: "/ishlab-chiqarish", label: "Ishlab Chiqarish", icon: Factory, color: "#059669" },
  { href: "/mijozlar", label: "Mijozlar & Savdo", icon: Users, color: "#d97706" },
  { href: "/xarajatlar", label: "Xarajatlar", icon: Receipt, color: "#dc2626" },
  { href: "/hisobot", label: "Hisobot & Foyda", icon: BarChart3, color: "#7c3aed" },
  { href: "/tarix", label: "Tarix", icon: Clock, color: "#64748b" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    if(!confirm("Tizimdan chiqmoqchimisiz?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        background: "white",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        height: "100vh",
        overflow: "auto",
        boxShadow: "2px 0 12px rgba(79,70,229,0.06)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <ShoppingCart size={18} color="white" />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: "white",
                letterSpacing: "-0.01em",
              }}
            >
              Korzinka ERP
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.7)" }}>
              Boshqaruv tizimi
            </div>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding: "0.75rem 1rem 0.25rem", fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Navigatsiya
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "0 0.625rem" }}>
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.7rem",
                padding: "0.6rem 0.875rem",
                borderRadius: "10px",
                marginBottom: "2px",
                fontSize: "0.865rem",
                fontWeight: active ? 700 : 500,
                color: active ? color : "#64748b",
                background: active
                  ? `${color}14`
                  : "transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
                borderLeft: active ? `3px solid ${color}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: active ? `${color}20` : "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                <Icon size={15} color={active ? color : "#64748b"} />
              </div>
              <span style={{ fontSize: "0.845rem" }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggle}
          style={{
            ...actionButtonStyle
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-primary)"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        >
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            {theme === "light" ? "Kecha rejimi" : "Kunduz rejimi"}
          </span>
          <div
            style={{
              width: 34, height: 18, borderRadius: 9,
              background: theme === "dark" ? "#818cf8" : "#e2e8f0",
              position: "relative", transition: "background 0.25s", flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 14, height: 14, borderRadius: "50%", background: "white",
                position: "absolute", top: 2, left: theme === "dark" ? 18 : 2,
                transition: "left 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        </button>

        <button
          onClick={handleLogout}
          style={{
            ...actionButtonStyle,
            border: "1px solid #fecaca",
            marginBottom: "0.8rem",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        >
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "inherit", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LogOut size={14} color="#ef4444" />
            <span style={{ color: "#ef4444" }}>Dasturdan chiqish</span>
          </span>
        </button>

        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600 }}>© 2026 Korzinka ERP</div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>v1.0.0 · Premium</div>
      </div>
    </aside>
  );
}

const actionButtonStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.55rem 0.8rem",
  borderRadius: "10px",
  background: "var(--bg-hover)",
  cursor: "pointer",
  marginBottom: "0.6rem",
  transition: "all 0.2s",
};
