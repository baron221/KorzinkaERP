"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, Receipt, Edit3, Trash2 } from "lucide-react";
import MobileFab from "@/components/MobileFab";
import NumericInput from "@/components/NumericInput";
import { fmtAmount } from "@/lib/utils";
import { useToast } from "@/components/ToastContext";





interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  notes: string | null;
}

const CATEGORIES: Record<string, { label: string; emoji: string; color: string }> = {
  ELECTRICITY: { label: "Elektr energiya", emoji: "⚡", color: "#f59e0b" },
  WAGES: { label: "Ishchilar oyligi", emoji: "👷", color: "#6366f1" },
  FOOD: { label: "Ovqatlanish", emoji: "🍱", color: "#10b981" },
  MISC: { label: "Mayda xarajatlar", emoji: "📎", color: "#94a3b8" },
};


export default function XarajatlarPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const data = await fetch(`/api/expenses?month=${month}`).then((r) => r.json());
    setExpenses(data.expenses);
    setTotal(data.total);
    setByCategory(data.byCategory);
    setLoading(false);
  }, [month]);

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
          <div className="page-title">Xarajatlar</div>
          <div className="page-sub">Ishlab chiqarish va operatsion xarajatlar</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="month" className="input" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Xarajat
          </button>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        {Object.entries(CATEGORIES).map(([cat, meta]) => (
          <div key={cat} className="stat-card" style={{ borderLeft: `3px solid ${meta.color}` }}>
            <div className="stat-label">{meta.emoji} {meta.label}</div>
            <div className="stat-value" style={{ fontSize: "1.1rem" }}>{fmtAmount(byCategory[cat] ?? 0)}</div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "3px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Jami Xarajat ({month})</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-red)" }}>{fmtAmount(total)}</div>
        </div>
        <Receipt size={32} style={{ color: "var(--accent-red)", opacity: 0.4 }} />
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>Yuklanmoqda...</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state"><Receipt size={48} /><div>Bu oyda xarajat kiritilmagan</div></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Kategoriya</th>
                <th>Summa</th>
                <th>Izoh</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const meta = CATEGORIES[e.category];
                return (
                  <tr key={e.id}>
                    <td className="text-muted">{new Date(e.date).toLocaleDateString("uz-UZ")}</td>
                    <td>
                      <span className="badge" style={{ background: `${meta?.color}20`, color: meta?.color }}>
                        {meta?.emoji} {meta?.label ?? e.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>{fmtAmount(e.amount)}</td>
                    <td className="text-muted">{e.notes ?? "—"}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => handleDelete("expense", e.id)} style={{ color: "var(--accent-red)", padding: "0.4rem" }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddExpenseModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); loadAll(); }} />
      )}

      {/* Mobile FAB */}
      <MobileFab
        items={[
          { icon: <Edit3 size={20} />, label: "Xarajat Qo'shish", onClick: () => setShowAdd(true) },
        ]}
      />
    </div>

  );
}

function AddExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ category: "ELECTRICITY", amount: "", notes: "", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const submit = async () => {
    if (!form.amount) return;
    setSaving(true);
    await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    showToast("Xarajat muvaffaqiyatli saqlandi!");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>📊 Xarajat Qo'shish</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="form-group">
          <label>Kategoriya *</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {Object.entries(CATEGORIES).map(([cat, meta]) => (
              <option key={cat} value={cat}>{meta.emoji} {meta.label}</option>
            ))}
          </select>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Summa (so'm) *</label>
            <NumericInput value={form.amount} onChange={(val) => setForm({ ...form, amount: val })} placeholder="500000" />
            {form.amount && <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: "0.25rem" }}>{fmtAmount(parseFloat(form.amount))}</div>}
          </div>
          <div className="form-group"><label>Sana</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Izoh</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ixtiyoriy" /></div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        </div>
      </div>
    </div>
  );
}
