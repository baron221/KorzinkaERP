"use client";
import { useEffect, useState } from "react";
import { History, ChevronDown, ChevronUp, ShoppingCart, Package, Factory, Receipt, CreditCard, User, Truck } from "lucide-react";

interface LogEntry {
  id: number;
  action: string;
  actionLabel: string;
  entity: string;
  entityLabel: string;
  entityId: number;
  snapshot: Record<string, any>;
  createdAt: string;
}

const entityIcons: Record<string, any> = {
  Sale: ShoppingCart,
  Expense: Receipt,
  RawMaterial: Package,
  Production: Factory,
  SupplierPayment: CreditCard,
  CustomerPayment: CreditCard,
  Customer: User,
  Supplier: Truck,
  CustomerReturn: ShoppingCart,
};

const entityColors: Record<string, string> = {
  Sale: "#4f46e5",
  Expense: "#dc2626",
  RawMaterial: "#059669",
  Production: "#d97706",
  SupplierPayment: "#7c3aed",
  CustomerPayment: "#0891b2",
  Customer: "#0284c7",
  Supplier: "#16a34a",
  CustomerReturn: "#ea580c",
};

const entityBg: Record<string, string> = {
  Sale: "#ede9fe",
  Expense: "#fee2e2",
  RawMaterial: "#d1fae5",
  Production: "#fef3c7",
  SupplierPayment: "#f3e8ff",
  CustomerPayment: "#e0f2fe",
  Customer: "#e0f2fe",
  Supplier: "#dcfce7",
  CustomerReturn: "#ffedd5",
};

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("uz-UZ", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

function SnapshotViewer({ snapshot, entity, customersMap }: { snapshot: Record<string, any>; entity: string; customersMap?: Record<number, string> }) {
  const fmtNum = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n));
  const rows: { label: string; value: string }[] = [];

  if (entity === "Sale") {
    if (snapshot.customer?.name) rows.push({ label: "Mijoz", value: snapshot.customer.name });
    if (snapshot.totalAmount != null) rows.push({ label: "Jami summa", value: fmtNum(snapshot.totalAmount) + " so'm" });
    if (snapshot.paidAmount != null) rows.push({ label: "To'langan", value: fmtNum(snapshot.paidAmount) + " so'm" });
    if (snapshot.debtAmount != null) rows.push({ label: "Qarz", value: fmtNum(snapshot.debtAmount) + " so'm" });
    if (snapshot.notes) rows.push({ label: "Izoh", value: snapshot.notes });
  } else if (entity === "Expense") {
    const cats: Record<string, string> = { ELECTRICITY: "Elektr", WAGES: "Ish haqi", FOOD: "Ovqat", MISC: "Boshqa" };
    rows.push({ label: "Kategoriya", value: cats[snapshot.category] || snapshot.category });
    rows.push({ label: "Summa", value: fmtNum(snapshot.amount) + " so'm" });
    if (snapshot.notes) rows.push({ label: "Izoh", value: snapshot.notes });
  } else if (entity === "RawMaterial") {
    if (snapshot.supplier?.name) rows.push({ label: "Ta'minotchi", value: snapshot.supplier.name });
    if (snapshot.weightKg != null) rows.push({ label: "Og'irlik", value: snapshot.weightKg + " kg" });
    if (snapshot.totalAmount != null) rows.push({ label: "Jami summa", value: fmtNum(snapshot.totalAmount) + " so'm" });
    if (snapshot.debtAmount != null) rows.push({ label: "Qarz", value: fmtNum(snapshot.debtAmount) + " so'm" });
  } else if (entity === "Production") {
    if (snapshot.rawUsedKg != null) rows.push({ label: "Sarflangan seryo", value: snapshot.rawUsedKg + " kg" });
    if (snapshot.totalBaskets != null) rows.push({ label: "Jami korzinka", value: snapshot.totalBaskets + " ta" });
    if (snapshot.items) {
      snapshot.items.forEach((item: any) => {
        rows.push({ label: `Razmer ${item.size}`, value: `${item.count} ta / ${item.weightGrams}g` });
      });
    }
  } else if (entity === "SupplierPayment") {
    if (snapshot.amount != null) rows.push({ label: "Summa", value: fmtNum(snapshot.amount) + " so'm" });
    if (snapshot.notes) rows.push({ label: "Izoh", value: snapshot.notes });
  } else if (entity === "CustomerReturn") {
    const customerName = snapshot.customerId && customersMap ? customersMap[snapshot.customerId] : null;
    if (customerName) rows.push({ label: "Kimdan (Mijoz)", value: customerName });
    else if (snapshot.customerId != null) rows.push({ label: "Mijoz ID", value: String(snapshot.customerId) });
    
    if (snapshot.totalAmount != null) rows.push({ label: "Qaytarilgan summa", value: fmtNum(snapshot.totalAmount) + " so'm" });
    if (snapshot.notes) rows.push({ label: "Izoh", value: snapshot.notes });
    if (snapshot.items) {
      snapshot.items.forEach((item: any) => {
        rows.push({ label: `Razmer ${item.size}`, value: `${item.count} ta / ${fmtNum(item.unitPrice)} so'm` });
      });
    }
  } else {
    Object.entries(snapshot).forEach(([k, v]) => {
      if (typeof v !== "object" && v != null) rows.push({ label: k, value: String(v) });
    });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
      {rows.map((row, i) => (
        <div key={i} style={{ background: "var(--bg-hover)", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>
            {row.label}
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function getLogSummary(log: LogEntry, customersMap: Record<number, string>) {
  const s = log.snapshot || {};
  const fmtNum = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n));

  switch (log.entity) {
    case "Sale": {
      const custName = s.customer?.name || "";
      const itemsStr = s.items?.map((it: any) => `R${it.size}×${it.count}`).join(", ") || "";
      const amtStr = s.totalAmount != null ? fmtNum(s.totalAmount) + " so'm" : "";
      return [custName, itemsStr, amtStr].filter(Boolean).join(" | ");
    }
    case "CustomerReturn": {
      const custName = s.customerId && customersMap ? customersMap[s.customerId] : (s.customer?.name || "");
      const itemsStr = s.items?.map((it: any) => `R${it.size}×${it.count}`).join(", ") || "";
      const amtStr = s.totalAmount != null ? fmtNum(s.totalAmount) + " so'm" : "";
      return `Vozvrat: ${[custName, itemsStr, amtStr].filter(Boolean).join(" | ")}`;
    }
    case "Production": {
      const raw = s.rawUsedKg != null ? `${s.rawUsedKg} kg seryo` : "";
      const baskets = s.totalBaskets != null ? `${s.totalBaskets} ta korzinka` : "";
      const itemsStr = s.items?.map((it: any) => `R${it.size}×${it.count}`).join(", ") || "";
      return [raw, baskets, itemsStr].filter(Boolean).join(" | ");
    }
    case "Expense": {
      const cats: Record<string, string> = { ELECTRICITY: "Elektr", WAGES: "Ish haqi", FOOD: "Ovqat", MISC: "Boshqa" };
      const cat = cats[s.category] || s.category || "";
      const amt = s.amount != null ? fmtNum(s.amount) + " so'm" : "";
      return [cat, amt, s.notes].filter(Boolean).join(" | ");
    }
    case "CustomerPayment": {
      const custName = s.customerId && customersMap ? customersMap[s.customerId] : (s.customer?.name || "");
      const amt = s.amount != null ? fmtNum(s.amount) + " so'm" : "";
      return [custName, amt, s.notes].filter(Boolean).join(" | ");
    }
    case "SupplierPayment": {
      const suppName = s.supplier?.name || "";
      const amt = s.amount != null ? fmtNum(s.amount) + " so'm" : "";
      return [suppName, amt, s.notes].filter(Boolean).join(" | ");
    }
    case "RawMaterial": {
      const suppName = s.supplier?.name || "";
      const weight = s.weightKg != null ? `${s.weightKg} kg` : "";
      const amt = s.totalAmount != null ? fmtNum(s.totalAmount) + " so'm" : "";
      return [suppName, weight, amt].filter(Boolean).join(" | ");
    }
    case "Customer": {
      return s.name || "";
    }
    case "Supplier": {
      return s.name || "";
    }
    default:
      return "";
  }
}

export default function TarixPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [customersMap, setCustomersMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/activity-log").then(r => r.json()),
      fetch("/api/customers").then(r => r.json())
    ]).then(([logsData, customersData]) => {
      setLogs(Array.isArray(logsData) ? logsData : []);
      const cMap: Record<number, string> = {};
      if (Array.isArray(customersData)) {
        customersData.forEach((c: any) => cMap[c.id] = c.name);
      }
      setCustomersMap(cMap);
      setLoading(false);
    });
  }, []);

  const entityTypes = ["ALL", ...Array.from(new Set(logs.map(l => l.entity)))];
  const entityFilterLabels: Record<string, string> = {
    ALL: "Barchasi", Sale: "Savdo", Expense: "Xarajat", RawMaterial: "Seryo",
    Production: "Ishlab Chiqarish", SupplierPayment: "Ta'minotchi To'lovi",
    CustomerPayment: "Mijoz To'lovi", Customer: "Mijoz", Supplier: "Ta'minotchi",
    CustomerReturn: "Vozvrat",
  };
  const filtered = filter === "ALL" ? logs : logs.filter(l => l.entity === filter);

  return (
    <div>
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
        borderRadius: "20px", padding: "1.75rem 2rem", marginBottom: "1.5rem",
        color: "white", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>📋 Audit Tizimi</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>Amallar Tarixi</div>
          <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: "0.4rem" }}>Barcha o'chirilgan va yaratilgan ma'lumotlarning to'liq tarixi</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {entityTypes.map(type => (
          <button key={type} onClick={() => setFilter(type)} style={{
            padding: "0.35rem 0.9rem", borderRadius: "20px",
            border: `2px solid ${filter === type ? (entityColors[type] || "#4f46e5") : "var(--border)"}`,
            background: filter === type ? (entityBg[type] || "#ede9fe") : "transparent",
            color: filter === type ? (entityColors[type] || "#4f46e5") : "var(--text-secondary)",
            fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.2s ease"
          }}>
            {entityFilterLabels[type] || type}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>Yuklanmoqda...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <History size={48} />
          <div style={{ marginTop: "0.5rem", fontWeight: 600 }}>Hali hech qanday amal qayd etilmagan</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Biror yozuv o'chirilganda, u bu yerda saqlanib qoladi
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map(log => {
            const Icon = entityIcons[log.entity] || History;
            const color = entityColors[log.entity] || "#4f46e5";
            const bg = entityBg[log.entity] || "#ede9fe";
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} style={{
                background: "var(--bg-card)",
                border: `1px solid ${isExpanded ? color + "40" : "var(--border)"}`,
                borderRadius: "14px", overflow: "hidden",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                boxShadow: isExpanded ? `0 4px 12px ${color}20` : "var(--shadow)"
              }}>
                <div onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)" }}>{log.entityLabel}</span>
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "20px",
                        background: log.action === "DELETE" ? "#fee2e2" : "#d1fae5",
                        color: log.action === "DELETE" ? "#b91c1c" : "#065f46"
                      }}>{log.actionLabel}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>#{log.entityId}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{fmtDate(log.createdAt)}</span>
                      {getLogSummary(log, customersMap) && (
                        <>
                          <span style={{ fontSize: "0.75rem", color: "var(--border)" }}>|</span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 600 }}>
                            {getLogSummary(log, customersMap)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${color}20` }}>
                    <div style={{ paddingTop: "1rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                        {log.action === "DELETE" ? "O'chirilgan paytdagi ma'lumotlar" : "Saqlangan ma'lumotlar"}
                      </div>
                      <SnapshotViewer snapshot={log.snapshot} entity={log.entity} customersMap={customersMap} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
