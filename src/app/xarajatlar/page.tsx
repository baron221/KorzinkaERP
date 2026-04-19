"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, Receipt, Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  PERSONAL: { label: "Shaxsiy xarajatlar", emoji: "👤", color: "#ec4899" },
};


export default function XarajatlarPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const data = await fetch(`/api/expenses?month=${month}&t=${Date.now()}`).then((r) => r.json());
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

      {/* Total */}
      <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "3px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Biznes Xarajatlar ({month})</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-red)" }}>{fmtAmount(total - (byCategory["PERSONAL"] ?? 0))}</div>
          </div>
          {(byCategory["PERSONAL"] ?? 0) > 0 && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Shaxsiy Xarajatlar</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ec4899" }}>{fmtAmount(byCategory["PERSONAL"] ?? 0)}</div>
            </div>
          )}
        </div>
        <Receipt size={32} style={{ color: "var(--accent-red)", opacity: 0.4 }} />
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>Yuklanmoqda...</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state"><Receipt size={48} /><div>Bu oyda xarajat kiritilmagan</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {Object.entries(CATEGORIES).map(([cat, meta]) => {
            const catExpenses = expenses.filter(e => e.category === cat);
            const isOpen = expandedCategory === cat;
            const bgLight = `${meta.color}15`; // ~8% opacity hex equivalent
            const borderCol = isOpen ? meta.color : `${meta.color}30`;

            return (
              <div 
                key={cat}
                style={{
                  background: "white",
                  border: `1.5px solid ${borderCol}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: isOpen ? `0 4px 16px ${bgLight}` : "0 1px 4px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease"
                }}
              >
                {/* Header (Click to expand) */}
                <div
                  onClick={() => setExpandedCategory(isOpen ? null : cat)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "1.1rem 1.5rem", cursor: "pointer",
                    background: isOpen ? bgLight : "white",
                    transition: "background 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: bgLight, display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0, fontSize: "1.2rem"
                    }}>
                      {meta.emoji}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>
                        {catExpenses.length} ta xarajat
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      background: bgLight, color: meta.color, fontWeight: 800,
                      fontSize: "1.1rem", padding: "0.4rem 1rem", borderRadius: "10px"
                    }}>
                      {fmtAmount(byCategory[cat] ?? 0)}
                    </div>
                    {isOpen ? <ChevronUp size={18} color={meta.color} /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                  </div>
                </div>

                {/* Expanded Table area */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${borderCol}`, background: "#fafafa" }}>
                    {catExpenses.length === 0 ? (
                      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        Bu kategoriya bo'yicha xarajat topilmadi
                      </div>
                    ) : (
                      <div style={{ padding: "1rem 1.5rem" }}>
                        <div className="table-wrapper" style={{ background: "white", borderRadius: "12px", overflow: "hidden", border: `1px solid ${borderCol}`, marginBottom: 0 }}>
                          <table style={{ marginBottom: 0 }}>
                            <thead>
                              <tr>
                                <th>Sana</th>
                                <th>Summa</th>
                                <th>Izoh</th>
                                <th style={{ textAlign: "right" }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {catExpenses.map(e => (
                                <tr key={e.id}>
                                  <td className="text-muted" style={{ fontSize: "0.82rem" }}>
                                    {new Date(e.date).toLocaleDateString("uz-UZ")}
                                  </td>
                                  <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>
                                    {fmtAmount(e.amount)}
                                  </td>
                                  <td className="text-muted" style={{ fontSize: "0.82rem" }}>
                                    {e.notes ?? "—"}
                                  </td>
                                  <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                                    <button 
                                      className="btn btn-sm" 
                                      onClick={(ev) => { ev.stopPropagation(); handleDelete("expense", e.id); }} 
                                      style={{ color: "var(--accent-red)", padding: "0.4rem", opacity: 0.7 }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
