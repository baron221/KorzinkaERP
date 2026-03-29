"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, Factory, PackagePlus, Trash2 } from "lucide-react";
import MobileFab from "@/components/MobileFab";
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
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Sarflangan Seryo</th>
                <th>Jami Korzinka</th>
                <th>R12</th>
                <th>R14</th>
                <th>R16</th>
                <th>Izoh</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const s12 = b.items.filter((i) => i.size === 12).reduce((s, i) => s + i.count, 0);
                const s14 = b.items.filter((i) => i.size === 14).reduce((s, i) => s + i.count, 0);
                const s16 = b.items.filter((i) => i.size === 16).reduce((s, i) => s + i.count, 0);
                return (
                  <tr key={b.id}>
                    <td className="text-muted">{new Date(b.date).toLocaleDateString("uz-UZ")}</td>
                    <td style={{ fontWeight: 600 }}>{fmtWeight(b.rawUsedKg)}</td>
                    <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{b.totalBaskets} ta</td>
                    <td>{s12 > 0 ? <span className="badge badge-blue">{s12}</span> : "—"}</td>
                    <td>{s14 > 0 ? <span className="badge badge-blue">{s14}</span> : "—"}</td>
                    <td>{s16 > 0 ? <span className="badge badge-blue">{s16}</span> : "—"}</td>
                    <td className="text-muted">{b.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
              <input type="number" className="input" placeholder="Soni (ta)" value={item.count || ""} onChange={(e) => updateItem(i, "count", e.target.value)} />
              <div>
                <input type="number" className="input" placeholder="Og'irligi (g)" value={item.weightGrams || ""} onChange={(e) => updateItem(i, "weightGrams", e.target.value)} />
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
