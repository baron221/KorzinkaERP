"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, ChevronDown, ChevronUp, Truck, Package, UserPlus, CreditCard } from "lucide-react";
import MobileFab from "@/components/MobileFab";


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

const fmt = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(n)) + " so'm";

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
        <MaterialsTable materials={materials} />
      ) : tab === "suppliers" ? (
        <SuppliersTable suppliers={suppliers} materials={materials} />
      ) : (
        <PaymentsTable payments={payments} />
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
    </div>

  );
}

function MaterialsTable({ materials }: { materials: RawMaterial[] }) {
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
              <td style={{ fontWeight: 600 }}>{m.weightKg} kg</td>
              <td>{fmt(m.pricePerKg)}</td>
              <td style={{ fontWeight: 700 }}>{fmt(m.totalAmount)}</td>
              <td className="text-green">{fmt(m.paidAmount)}</td>
              <td>
                {m.debtAmount > 0 ? (
                  <span className="badge badge-red">{fmt(m.debtAmount)}</span>
                ) : (
                  <span className="badge badge-green">To'liq</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuppliersTable({ suppliers, materials }: { suppliers: Supplier[]; materials: RawMaterial[] }) {
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
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  {s.phone ?? "—"} · {sm.length} ta kirimi · Jami: {fmt(totalPurchase)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {totalDebt > 0 ? (
                  <span className="badge badge-red">Qarz: {fmt(totalDebt)}</span>
                ) : (
                  <span className="badge badge-green">Hisob-kitob to'liq</span>
                )}
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
                        <td>{m.weightKg} kg</td>
                        <td>{fmt(m.totalAmount)}</td>
                        <td className="text-green">{fmt(m.paidAmount)}</td>
                        <td>{m.debtAmount > 0 ? <span className="badge badge-red">{fmt(m.debtAmount)}</span> : <span className="badge badge-green">✓</span>}</td>
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

function PaymentsTable({ payments }: { payments: SupplierPayment[] }) {
  if (payments.length === 0)
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
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="text-muted">{new Date(p.date).toLocaleDateString("uz-UZ")}</td>
              <td style={{ fontWeight: 500 }}>{p.supplier.name}</td>
              <td className="text-green" style={{ fontWeight: 700 }}>{fmt(p.amount)}</td>
              <td className="text-muted">{p.notes ?? "—"}</td>
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

  const submit = async () => {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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
  const [form, setForm] = useState({ supplierId: "", weightKg: "", pricePerKg: "", paidAmount: "0", notes: "", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = parseFloat(form.weightKg || "0") * parseFloat(form.pricePerKg || "0");
  const debt = total - parseFloat(form.paidAmount || "0");

  const submit = async () => {
    if (!form.supplierId || !form.weightKg || !form.pricePerKg) { setError("Barcha majburiy maydonlarni to'ldiring"); return; }
    setSaving(true);
    const res = await fetch("/api/raw-materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
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
          <div className="form-group"><label>Og'irlik (kg) *</label><input type="number" className="input" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="1000" /></div>
          <div className="form-group"><label>1 kg narxi (so'm) *</label><input type="number" className="input" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} placeholder="5000" /></div>
        </div>
        {total > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: "1rem" }}>
            Jami summa: <strong>{fmt(total)}</strong>{debt > 0 && <> | Qarz: <strong className="text-red">{fmt(debt)}</strong></>}
          </div>
        )}
        <div className="form-group"><label>To'langan summa (so'm)</label><input type="number" className="input" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} placeholder="0" /></div>
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

  const filteredMaterials = materials.filter((m) => m.supplierId === parseInt(form.supplierId) && m.debtAmount > 0);

  const submit = async () => {
    setSaving(true);
    await fetch("/api/supplier-payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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
              {filteredMaterials.map((m) => <option key={m.id} value={m.id}>{new Date(m.date).toLocaleDateString("uz-UZ")} — Qarz: {fmt(m.debtAmount)}</option>)}
            </select>
          </div>
        )}
        <div className="grid-2">
          <div className="form-group"><label>Summa (so'm) *</label><input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500000" /></div>
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
