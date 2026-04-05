"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, ChevronDown, ChevronUp, Truck, Package, UserPlus, CreditCard, Trash2 } from "lucide-react";
import MobileFab from "@/components/MobileFab";
import NumericInput from "@/components/NumericInput";
import { fmtAmount, fmtWeight } from "@/lib/utils";
import { useToast } from "@/components/ToastContext";





interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
}
interface RawMaterial {
  id: number;
  supplierId: number;
  date: string;
  weightKg: number;
  pricePerKg: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  notes: string | null;
  supplier: Supplier;
}
interface SupplierPayment {
  id: number;
  supplierId: number;
  rawMaterialId: number | null;
  amount: number;
  date: string;
  notes: string | null;
  supplier: Supplier;
}


type Tab = "materials" | "suppliers" | "payments";

export default function OmborPage() {
  const [tab, setTab] = useState<Tab>("materials");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    const [s, m, p] = await Promise.all([
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/raw-materials").then((r) => r.json()),
      fetch("/api/supplier-payments").then((r) => r.json()),
    ]);
    setSuppliers(s);
    setMaterials(m);
    setPayments(p);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  const handleDelete = async (type: string, id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.")) return;
    try {
      const res = await fetch(`/api/delete?type=${type}&id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) alert(data.error);
      else loadAll();
    } catch (e) {
      alert("Xatolik yuz berdi");
    }
  };
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ta'minot va Ombor</div>
          <div className="page-sub">Xomashyo kirimi va ta'minotchilar bilan hisob-kitob</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddSupplier(true)}>
            <Plus size={14} /> Ta'minotchi
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddMaterial(true)}>
            <Plus size={14} /> Seryo Kirimi
          </button>
          <button className="btn btn-success btn-sm" onClick={() => setShowAddPayment(true)}>
            <Plus size={14} /> To'lov
          </button>
        </div>
      </div>

      <div className="tabs">
        {(["materials", "suppliers", "payments"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "materials" ? "📦 Seryo Kirimi" : t === "suppliers" ? "🚛 Ta'minotchilar" : "💳 To'lovlar"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
          Yuklanmoqda...
        </div>
      ) : tab === "materials" ? (
        <MaterialsTable materials={materials} onDelete={handleDelete} />
      ) : tab === "suppliers" ? (
        <SuppliersTable suppliers={suppliers} materials={materials} onDelete={handleDelete} onSelectSupplier={setSelectedSupplierId} />
      ) : (
        <PaymentsTable payments={payments} materials={materials} onDelete={handleDelete} />
      )}

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <AddSupplierModal
          onClose={() => setShowAddSupplier(false)}
          onSuccess={() => { setShowAddSupplier(false); loadAll(); }}
        />
      )}
      {/* Add Material Modal */}
      {showAddMaterial && (
        <AddMaterialModal
          suppliers={suppliers}
          onClose={() => setShowAddMaterial(false)}
          onSuccess={() => { setShowAddMaterial(false); loadAll(); }}
        />
      )}
      {/* Add Payment Modal */}
      {showAddPayment && (
        <AddPaymentModal
          suppliers={suppliers}
          materials={materials}
          onClose={() => setShowAddPayment(false)}
          onSuccess={() => { setShowAddPayment(false); loadAll(); }}
        />
      )}

      {/* Mobile FAB */}
      <MobileFab
        items={[
          { icon: <Package size={20} />, label: "Seryo Kirimi", onClick: () => setShowAddMaterial(true) },
          { icon: <UserPlus size={20} />, label: "Ta'minotchi", onClick: () => setShowAddSupplier(true) },
          { icon: <CreditCard size={20} />, label: "To'lov", onClick: () => setShowAddPayment(true) },
        ]}
      />
      {/* Supplier Details Modal */}
      {selectedSupplierId && (
        <SupplierDetailsModal
          supplierId={selectedSupplierId}
          onClose={() => setSelectedSupplierId(null)}
        />
      )}

    </div>
  );
}

function MaterialsTable({ materials, onDelete }: { materials: RawMaterial[]; onDelete: (type: string, id: number) => void }) {
  if (materials.length === 0)
    return (
      <div className="empty-state">
        <Truck size={48} />
        <div style={{ marginTop: "0.5rem" }}>Hali seryo kirimi kiritilmagan</div>
      </div>
    );
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Sana</th>
            <th>Ta'minotchi</th>
            <th>Og'irlik (kg)</th>
            <th>1 kg narxi</th>
            <th>Jami</th>
            <th>To'langan</th>
            <th>Qarz</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id}>
              <td className="text-muted">{new Date(m.date).toLocaleDateString("uz-UZ")}</td>
              <td style={{ fontWeight: 500 }}>{m.supplier.name}</td>
              <td style={{ fontWeight: 600 }}>{fmtWeight(m.weightKg)}</td>
              <td>{fmtAmount(m.pricePerKg)}</td>
              <td style={{ fontWeight: 700 }}>{fmtAmount(m.totalAmount)}</td>
              <td className="text-green">{fmtAmount(m.paidAmount)}</td>
              <td>
                {m.debtAmount > 0 ? (
                  <span className="badge badge-red">{fmtAmount(m.debtAmount)}</span>
                ) : (
                  <span className="badge badge-green">To'liq</span>
                )}
              </td>
              <td>
                <button className="btn btn-sm" onClick={() => onDelete("raw", m.id)} style={{ color: "var(--accent-red)", padding: "0.4rem" }}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuppliersTable({ suppliers, materials, onDelete, onSelectSupplier }: { suppliers: Supplier[]; materials: RawMaterial[]; onDelete: (type: string, id: number) => void; onSelectSupplier: (id: number) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (suppliers.length === 0)
    return (
      <div className="empty-state">
        <Truck size={48} />
        <div>Hali ta'minotchi qo'shilmagan</div>
      </div>
    );
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {suppliers.map((s) => {
        const sm = materials.filter((m) => m.supplierId === s.id);
        const totalDebt = sm.reduce((sum, m) => sum + m.debtAmount, 0);
        const totalPurchase = sm.reduce((sum, m) => sum + m.totalAmount, 0);
        return (
          <div key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1rem", cursor: "pointer" }}
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <div>
                <div 
                  style={{ fontWeight: 600, textDecoration: "underline", color: "var(--accent-primary)", cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); onSelectSupplier(s.id); }}
                >
                  {s.name}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  {s.phone ?? "—"} · {sm.length} ta kirimi · Jami: {fmtAmount(totalPurchase)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {totalDebt > 0 ? (
                  <span className="badge badge-red">Qarz: {fmtAmount(totalDebt)}</span>
                ) : (
                  <span className="badge badge-green">Hisob-kitob to'liq</span>
                )}
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onDelete("supplier", s.id); }} style={{ color: "var(--accent-red)", padding: "0.4rem" }}>
                  <Trash2 size={16} />
                </button>
                {expanded === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expanded === s.id && sm.length > 0 && (
              <div style={{ background: "var(--bg-secondary)", padding: "0.5rem 1rem 1rem" }}>
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Sana</th>
                      <th>Og'irlik</th>
                      <th>Jami</th>
                      <th>To'langan</th>
                      <th>Qarz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sm.map((m) => (
                      <tr key={m.id}>
                         <td>{new Date(m.date).toLocaleDateString("uz-UZ")}</td>
                        <td>{fmtWeight(m.weightKg)}</td>
                        <td>{fmtAmount(m.totalAmount)}</td>
                        <td className="text-green">{fmtAmount(m.paidAmount)}</td>
                        <td>{m.debtAmount > 0 ? <span className="badge badge-red">{fmtAmount(m.debtAmount)}</span> : <span className="badge badge-green">✓</span>}</td>
                        <td>
                          <button className="btn btn-sm" onClick={() => onDelete("raw", m.id)} style={{ color: "var(--accent-red)", padding: "0.2rem" }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentsTable({ payments, materials, onDelete }: { payments: SupplierPayment[]; materials: RawMaterial[]; onDelete: (type: string, id: number) => void }) {
  const derivedPayments = materials.map(m => {
    const linkedPayments = payments.filter((p) => p.rawMaterialId === m.id);
    const sumLinked = linkedPayments.reduce((s, p) => s + p.amount, 0);
    const upfrontPayment = m.paidAmount - sumLinked;
    if (upfrontPayment > 0) {
      return {
        id: `upfront-${m.id}`,
        isUpfront: true,
        amount: upfrontPayment,
        date: m.date,
        notes: "Seryo kirimi vaqtidagi to'lov",
        supplier: m.supplier
      };
    }
    return null;
  }).filter(Boolean) as any[];

  const allPayments = [...payments, ...derivedPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allPayments.length === 0)
    return (
      <div className="empty-state">
        <div>Hali to'lov kiritilmagan</div>
      </div>
    );
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Sana</th>
            <th>Ta'minotchi</th>
            <th>Summa</th>
            <th>Izoh</th>
            <th>Amal</th>
          </tr>
        </thead>
        <tbody>
          {allPayments.map((p) => (
            <tr key={p.id}>
              <td className="text-muted">{new Date(p.date).toLocaleDateString("uz-UZ")}</td>
              <td style={{ fontWeight: 500 }}>{p.supplier.name}</td>
              <td className="text-green" style={{ fontWeight: 700 }}>{fmtAmount(p.amount)}</td>
              <td className="text-muted">{p.notes ?? "—"}</td>
              <td>
                {!p.isUpfront && (
                  <button className="btn btn-sm" onClick={() => onDelete("supplier-payment", p.id)} style={{ color: "var(--accent-red)", padding: "0.4rem" }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddSupplierModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const submit = async () => {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    showToast("Ta'minotchi muvaffaqiyatli qo'shildi!");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>Ta'minotchi Qo'shish</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="form-group"><label>Ism *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ta'minotchi ismi" /></div>
        <div className="form-group"><label>Telefon</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998..." /></div>
        <div className="form-group"><label>Manzil</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Shahar, ko'cha..." /></div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        </div>
      </div>
    </div>
  );
}

function AddMaterialModal({ suppliers, onClose, onSuccess }: { suppliers: Supplier[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ supplierId: "", weightKg: "", pricePerKg: "", paidAmount: "", notes: "", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [prepaymentBalance, setPrepaymentBalance] = useState(0);
  const { showToast } = useToast();

  const total = parseFloat(form.weightKg || "0") * parseFloat(form.pricePerKg || "0");
  const debt = total - parseFloat(form.paidAmount || "0");
  const debtAfterPrepayment = Math.max(0, debt - prepaymentBalance);

  // Fetch unlinked payments (prepayments) for selected supplier
  useEffect(() => {
    if (!form.supplierId) { setPrepaymentBalance(0); return; }
    fetch(`/api/supplier-payments?supplierId=${form.supplierId}&unlinked=true`)
      .then((r) => r.json())
      .then((payments: { amount: number }[]) => {
        if (Array.isArray(payments)) {
          setPrepaymentBalance(payments.reduce((s, p) => s + p.amount, 0));
        }
      })
      .catch(() => setPrepaymentBalance(0));
  }, [form.supplierId]);

  const submit = async () => {
    if (!form.supplierId || !form.weightKg || !form.pricePerKg) { setError("Barcha majburiy maydonlarni to'ldiring"); return; }
    setSaving(true);
    const res = await fetch("/api/raw-materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    showToast("Seryo kirimi muvaffaqiyatli saqlandi!");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>📦 Seryo Kirimi</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* Prepayment notice */}
        {prepaymentBalance > 0 && (
          <div className="alert alert-success" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            💰 Bu ta'minotchida <strong style={{ marginLeft: 4 }}>{fmtAmount(prepaymentBalance)}</strong>&nbsp;avans to'lov mavjud — yangi kirimga avtomatik qo'llanadi.
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label>Ta'minotchi *</label>
            <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Tanlang...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Sana</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Og'irlik (kg) *</label>
            <NumericInput value={form.weightKg} onChange={(val) => setForm({ ...form, weightKg: val })} placeholder="1000" />
            {form.weightKg && <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: "0.25rem" }}>{fmtWeight(parseFloat(form.weightKg))}</div>}
          </div>
          <div className="form-group">
            <label>1 kg narxi (so'm) *</label>
            <NumericInput value={form.pricePerKg} onChange={(val) => setForm({ ...form, pricePerKg: val })} placeholder="5000" />
            {form.pricePerKg && <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: "0.25rem" }}>{fmtAmount(parseFloat(form.pricePerKg))}</div>}
          </div>
        </div>
        {total > 0 && (
          <div className="alert" style={{ marginBottom: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--border)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span>Jami summa:</span>
              <strong style={{ fontSize: "1.05rem" }}>{fmtAmount(total)}</strong>
            </div>
            
            {prepaymentBalance > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "var(--accent-green)" }}>
                <span>Avans hisobidan chegiriladi:</span>
                <strong>- {fmtAmount(Math.min(debt, prepaymentBalance))}</strong>
              </div>
            )}
            
            {parseFloat(form.paidAmount || "0") > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "var(--accent-primary)" }}>
                <span>Hozir to'lanadigan:</span>
                <strong>- {fmtAmount(parseFloat(form.paidAmount || "0"))}</strong>
              </div>
            )}
            
            <div style={{ borderTop: "1px dashed var(--border)", margin: "0.5rem 0", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Qolgan qarz:</span>
              <strong className={debtAfterPrepayment > 0 ? "text-red" : "text-green"}>
                {debtAfterPrepayment > 0 ? fmtAmount(debtAfterPrepayment) : "0 so'm (To'liq qoplandi)"}
              </strong>
            </div>
          </div>
        )}
        <div className="form-group">
          <label>To'langan summa (so'm)</label>
          <NumericInput value={form.paidAmount} onChange={(val) => setForm({ ...form, paidAmount: val })} placeholder="0" />
          {form.paidAmount && <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: "0.25rem" }}>{fmtAmount(parseFloat(form.paidAmount))}</div>}
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

function AddPaymentModal({ suppliers, materials, onClose, onSuccess }: { suppliers: Supplier[]; materials: RawMaterial[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ supplierId: "", rawMaterialId: "", amount: "", notes: "", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const filteredMaterials = materials.filter((m) => m.supplierId === parseInt(form.supplierId) && m.debtAmount > 0);

  const submit = async () => {
    setSaving(true);
    await fetch("/api/supplier-payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    showToast("To'lov muvaffaqiyatli saqlandi!");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>💳 Ta'minotchiga To'lov</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="form-group">
          <label>Ta'minotchi *</label>
          <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value, rawMaterialId: "" })}>
            <option value="">Tanlang...</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {filteredMaterials.length > 0 && (
          <div className="form-group">
            <label>Qaysi kirimi uchun (ixtiyoriy)</label>
            <select className="input" value={form.rawMaterialId} onChange={(e) => setForm({ ...form, rawMaterialId: e.target.value })}>
              <option value="">Umumiy to'lov</option>
              {filteredMaterials.map((m) => <option key={m.id} value={m.id}>{new Date(m.date).toLocaleDateString("uz-UZ")} — Qarz: {fmtAmount(m.debtAmount)}</option>)}
            </select>
          </div>
        )}
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

export function SupplierDetailsModal({ supplierId, onClose }: { supplierId: number; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/suppliers/${supplierId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [supplierId]);

  if (!data && loading) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  let history: any[] = [];
  if (data) {
    data.rawMaterials?.forEach((m: any) => {
      history.push({
        type: "material",
        id: `m-${m.id}`,
        date: m.date,
        amount: m.totalAmount,
        notes: `📦 Seryo kirimi (${fmtWeight(m.weightKg)} × ${fmtAmount(m.pricePerKg)})`,
      });
    });
    data.supplierPayments?.forEach((p: any) => {
      history.push({
        type: "payment",
        id: `p-${p.id}`,
        date: p.date,
        amount: p.amount,
        notes:
          p.notes && p.notes.includes("Kirim vaqtidagi")
            ? "💸 Seryo kiritilgandagi to'lov"
            : p.notes || "💸 Qarz to'lovi / Avans kiritilishi",
      });
    });
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  let runningBalance = 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, padding: 0, overflow: "hidden" }}>
        <div className="modal-title" style={{ padding: "1rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Truck size={18} /> Tarix: {data?.name || "Yuklanmoqda..."}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="table-wrapper" style={{ maxHeight: "65vh", overflowY: "auto", margin: 0 }}>
          <table style={{ width: "100%", textAlign: "left" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-secondary)", zIndex: 1 }}>
              <tr>
                <th>Sana</th>
                <th>Turi / Izoh</th>
                <th style={{ textAlign: "right" }}>Summa (Qarz)</th>
                <th style={{ textAlign: "right" }}>Yoki To'lov (Avans)</th>
                <th style={{ textAlign: "right", borderLeft: "1px solid var(--border)" }}>Holat (Qoldiq)</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                    Hali o'zaro oldi-berdi yo'q
                  </td>
                </tr>
              ) : (
                history.map((h) => {
                  if (h.type === "material") {
                    runningBalance += h.amount;
                  } else {
                    runningBalance -= h.amount;
                  }
                  return (
                    <tr key={h.id}>
                      <td className="text-muted">{new Date(h.date).toLocaleDateString("uz-UZ")}</td>
                      <td>
                        <span style={{ color: h.type === "payment" ? "var(--accent-green)" : "inherit" }}>{h.notes}</span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: h.type === "material" ? 600 : 400 }}>
                        {h.type === "material" ? fmtAmount(h.amount) : "—"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: h.type === "payment" ? 600 : 400,
                          color: h.type === "payment" ? "var(--accent-green)" : "inherit",
                        }}
                      >
                        {h.type === "payment" ? `+ ${fmtAmount(h.amount)}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", borderLeft: "1px solid var(--border)", fontWeight: 700 }}>
                        {runningBalance > 0 ? (
                          <span className="badge badge-red">Qarz: {fmtAmount(runningBalance)}</span>
                        ) : runningBalance < 0 ? (
                          <span className="badge badge-green">Avans: {fmtAmount(Math.abs(runningBalance))}</span>
                        ) : (
                          <span className="badge" style={{ background: "var(--bg-secondary)" }}>Nol (0)</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
