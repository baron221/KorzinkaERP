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
  Clock,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Bosh", icon: LayoutDashboard, color: "#4f46e5" },
  { href: "/ombor", label: "Ombor", icon: Package, color: "#0891b2" },
  { href: "/ishlab-chiqarish", label: "Ishlab ch.", icon: Factory, color: "#059669" },
  { href: "/mijozlar", label: "Mijozlar", icon: Users, color: "#d97706" },
  { href: "/xarajatlar", label: "Xarajat", icon: Receipt, color: "#dc2626" },
  { href: "/hisobot", label: "Hisobot", icon: BarChart3, color: "#7c3aed" },
  { href: "/tarix", label: "Tarix", icon: Clock, color: "#64748b" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      }}
    >
      {navItems.map(({ href, label, icon: Icon, color }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              flex: 1,
              height: "100%",
              textDecoration: "none",
              color: active ? color : "var(--text-secondary)",
              position: "relative",
              transition: "all 0.15s",
            }}
          >
            {/* Active indicator dot */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `${color}18`,
                }}
              />
            )}
            <div style={{ position: "relative", zIndex: 1 }}>
              <Icon
                size={active ? 22 : 20}
                color={active ? color : "var(--text-secondary)"}
                strokeWidth={active ? 2.5 : 1.8}
              />
            </div>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.01em",
                position: "relative",
                zIndex: 1,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
