"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, Factory, PackagePlus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Fragment } from "react";
import MobileFab from "@/components/MobileFab";
import NumericInput from "@/components/NumericInput";
import { fmtAmount, fmtWeight } from "@/lib/utils";
import { useToast } from "@/components/ToastContext";





interface ProductionItem {
  size: number;
  count: number;
  weightGrams: number;
}
interface ProductionBatch {
  id: number;
  date: string;
  rawUsedKg: number;
  totalBaskets: number;
  notes: string | null;
  items: ProductionItem[];
}
interface Stock {
  rawStockKg: number;
  size12Count: number;
  size14Count: number;
  size16Count: number;
}


export default function IslabChiqarishPage() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedBatchId, setExpandedBatchId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    const [b, dash] = await Promise.all([
      fetch("/api/production").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ]);
    setBatches(b);
    setStock(dash.stock);
    setLoading(false);
  }, []);

  const handleDelete = async (type: string, id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/delete?type=${type}&id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) alert(data.error);
      else loadAll();
    } catch (e) {
      alert("Xatolik yuz berdi");
    }
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ishlab Chiqarish</div>
          <div className="page-sub">Xomashyoni tayyor mahsulotga aylantirish</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Yangi Partiya
        </button>
      </div>

      {/* Stock overview */}
      {stock && (
        <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card" style={{ borderLeft: "3px solid #6366f1" }}>
            <div className="stat-label">🌾 Xomashyo (Seryo)</div>
            <div className="stat-value">{fmtWeight(stock.rawStockKg)}</div>
            <div className="stat-sub">omborda</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid #10b981" }}>
            <div className="stat-label">🧺 Razmer 12</div>
            <div className="stat-value">{stock.size12Count} ta</div>
            <div className="stat-sub">tayyor</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid #f59e0b" }}>
            <div className="stat-label">🧺 Razmer 14</div>
            <div className="stat-value">{stock.size14Count} ta</div>
            <div className="stat-sub">tayyor</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid #ef4444" }}>
            <div className="stat-label">🧺 Razmer 16</div>
            <div className="stat-value">{stock.size16Count} ta</div>
            <div className="stat-sub">tayyor</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>Yuklanmoqda...</div>
      ) : batches.length === 0 ? (
        <div className="empty-state">
          <Factory size={48} />
          <div>Hali ishlab chiqarish kiritilmagan</div>
        </div>
      ) : (() => {
        const sizeGroups: Record<number, { count: number; rows: { date: string; batchId: number; count: number; weightGrams: number; notes: string | null }[] }> = {};
        batches.forEach(b => {
          b.items.forEach(item => {
            if (!sizeGroups[item.size]) sizeGroups[item.size] = { count: 0, rows: [] };
            sizeGroups[item.size].count += item.count;
            sizeGroups[item.size].rows.push({ date: b.date, batchId: b.id, count: item.count, weightGrams: item.weightGrams, notes: b.notes });
          });
        });
        const sizes = [12, 14, 16];
        const sc: Record<number, { bg: string; color: string; border: string; light: string }> = {
          12: { bg: "#e0e7ff", color: "#4338ca", border: "#c7d2fe", light: "#f5f3ff" },
          14: { bg: "#fef3c7", color: "#b45309", border: "#fde68a", light: "#fffbeb" },
          16: { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca", light: "#fff5f5" },
        };
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {sizes.map(size => {
              const group = sizeGroups[size];
              if (!group) return null;
              const isOpen = expandedBatchId === size;
              const c = sc[size];
              return (
                <div key={size} style={{ background: "white", border: `1.5px solid ${isOpen ? c.color : c.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: isOpen ? `0 4px 16px ${c.bg}` : "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.2s ease" }}>
                  <div
                    onClick={() => setExpandedBatchId(isOpen ? null : size)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.1rem 1.5rem", cursor: "pointer", background: isOpen ? c.light : "white", transition: "background 0.2s ease" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "1rem", fontWeight: 900, color: c.color }}>R{size}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>Razmer {size}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>
                          {group.rows.length} ta partiya · Jami: <strong style={{ color: c.color }}>{group.count} ta</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ background: c.bg, color: c.color, fontWeight: 800, fontSize: "1.1rem", padding: "0.4rem 1rem", borderRadius: "10px" }}>
                        {group.count} ta
                      </div>
                      {isOpen ? <ChevronUp size={18} color={c.color} /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${c.border}`, background: c.light }}>
                      <div style={{ padding: "1rem 1.5rem" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                          Razmer {size} — Barcha partiyalar tarixi
                        </div>
                        <div className="table-wrapper" style={{ background: "white", borderRadius: "12px", overflow: "hidden", border: `1px solid ${c.border}`, marginBottom: 0 }}>
                          <table style={{ marginBottom: 0 }}>
                            <thead>
                              <tr>
                                <th>Sana</th>
                                <th>Soni</th>
                                <th>Og&apos;irligi</th>
                                <th>Izoh</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.rows.sort((a, b) => {
                                const d = new Date(b.date).getTime() - new Date(a.date).getTime();
                                if (d !== 0) return d;
                                return b.batchId - a.batchId;
                              }).map((row, idx) => (
                                <tr key={idx}>
                                  <td className="text-muted" style={{ fontSize: "0.82rem" }}>{new Date(row.date).toLocaleDateString("uz-UZ")}</td>
                                  <td style={{ fontWeight: 700, color: c.color }}>{row.count} ta</td>
                                  <td>
                                    <span style={{ background: c.bg, color: c.color, padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 600 }}>{row.weightGrams}g</span>
                                  </td>
                                  <td className="text-muted" style={{ fontSize: "0.82rem" }}>{row.notes ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {showAdd && (
        <AddProductionModal
          currentStock={stock?.rawStockKg ?? 0}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); loadAll(); }}
        />
      )}

      {/* Mobile FAB */}
      <MobileFab
        items={[
          { icon: <PackagePlus size={20} />, label: "Yangi Partiya", onClick: () => setShowAdd(true) },
        ]}
      />
    </div>

  );
}

function AddProductionModal({
  currentStock,
  onClose,
  onSuccess,
}: {
  currentStock: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ size: number; count: number; weightGrams: number }>>([
    { size: 12, count: 0, weightGrams: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const addItem = () => setItems([...items, { size: 12, count: 0, weightGrams: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: field === "size" ? parseInt(val) : parseFloat(val) || 0 } : item));

  const totalKg = items.reduce((s, i) => s + (i.count * i.weightGrams) / 1000, 0);
  const totalBaskets = items.reduce((s, i) => s + i.count, 0);

  const submit = async () => {
    const filteredItems = items.filter((i) => i.count > 0 && i.weightGrams > 0);
    if (filteredItems.length === 0) { setError("Kamida bitta mahsulot kiriting"); return; }
    if (totalKg > currentStock) { setError(`Omborda yetarli seryo yo'q! Mavjud: ${currentStock.toFixed(1)} kg, kerak: ${totalKg.toFixed(2)} kg`); return; }
    setSaving(true);
    const res = await fetch("/api/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, notes, items: filteredItems }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    showToast("Mahsulotlar muvaffaqiyatli qo'shildi!");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-title">
          <span>🏭 Yangi Ishlab Chiqarish Partiyasi</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}
        <div className="alert alert-warning" style={{ marginBottom: "1rem" }}>
          Mavjud seryo: <strong>{fmtWeight(currentStock)}</strong>
          {totalKg > 0 && <> | Sarflanadi: <strong>{fmtWeight(totalKg)}</strong></>}
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Sana</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="form-group"><label>Izoh</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ixtiyoriy" /></div>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ marginBottom: 0 }}>Mahsulotlar</label>
            <button className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={12} /> Qo'shish</button>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
              <select className="input" value={item.size} onChange={(e) => updateItem(i, "size", e.target.value)}>
                <option value={12}>Razmer 12</option>
                <option value={14}>Razmer 14</option>
                <option value={16}>Razmer 16</option>
              </select>
              <div style={{ flex: 1 }}>
                <NumericInput 
                  value={item.count || ""} 
                  onChange={(val) => updateItem(i, "count", val)} 
                  allowDecimals={false} 
                  placeholder="Soni (ta)" 
                />
              </div>
              <div style={{ flex: 1 }}>
                <NumericInput 
                  value={item.weightGrams || ""} 
                  onChange={(val) => updateItem(i, "weightGrams", val)} 
                  placeholder="Og'irligi (g)" 
                />
                {item.weightGrams > 0 && <div style={{ fontSize: "0.65rem", color: "var(--accent-primary)" }}>{(item.weightGrams / 1000).toFixed(3)} kg</div>}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(i)} style={{ padding: "0.35rem" }}><X size={12} /></button>
            </div>
          ))}
        </div>

        {totalBaskets > 0 && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            Jami: <strong>{totalBaskets} ta korzinka</strong> | Sarflanadi: <strong>{fmtWeight(totalKg)}</strong>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        </div>
      </div>
    </div>
  );
}
