"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, Users, Search, UserPlus, ShoppingCart, Wallet, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import MobileFab from "@/components/MobileFab";
import NumericInput from "@/components/NumericInput";
import { fmtAmount } from "@/lib/utils";
import { useToast } from "@/components/ToastContext";





interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  sales: Array<{ date: string; totalAmount: number; paidAmount: number; debtAmount: number; notes?: string | null; items?: Array<{ size: number; count: number }> }>;
  customerPayments?: Array<{ amount: number }>;
}
interface Stock {
  size12Count: number;
  size14Count: number;
  size16Count: number;
}


type Tab = "list" | "sell" | "debt";

export default function MijozlarPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    const [c, dash] = await Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ]);
    setCustomers(c);
    setStock(dash.stock);
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

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
  );

  const debtCustomers = customers.filter((c) =>
    c.sales.some((s) => s.debtAmount > 0)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mijozlar va Savdo</div>
          <div className="page-sub">Mijozlar boshqaruvi va savdo kiritish</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCustomer(true)}>
            <Plus size={14} /> Mijoz
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowSell(true)}>
            <Plus size={14} /> Savdo
          </button>
          <button className="btn btn-success btn-sm" onClick={() => setShowPayment(true)}>
            <Plus size={14} /> Qarz To'lovi
          </button>
        </div>
      </div>

      <div className="tabs">
        {(["list", "sell", "debt"] as Tab[]).map((t) => (
          <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t === "list" ? `👥 Mijozlar (${customers.length})` : t === "sell" ? "🛒 Savdolar" : `⚠️ Qarzdorlar (${debtCustomers.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>Yuklanmoqda...</div>
      ) : tab === "list" ? (
        <CustomerList customers={filtered} search={search} setSearch={setSearch} onDelete={handleDelete} onSelectCustomer={setSelectedCustomerId} />
      ) : tab === "sell" ? (
        <SalesList onDelete={handleDelete} />
      ) : (
        <DebtList customers={debtCustomers} />
      )}

      {showAddCustomer && (
        <AddCustomerModal onClose={() => setShowAddCustomer(false)} onSuccess={() => { setShowAddCustomer(false); loadAll(); }} />
      )}
      {showSell && (
        <AddSaleModal customers={customers} stock={stock} onClose={() => setShowSell(false)} onSuccess={() => { setShowSell(false); loadAll(); }} />
      )}
      {showPayment && (
        <AddPaymentModal customers={customers} onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); loadAll(); }} />
      )}
      {selectedCustomerId && (
        <CustomerDetailsModal customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
      )}

      {/* Mobile FAB */}
      <MobileFab
        items={[
          { icon: <UserPlus size={20} />, label: "Yangi Mijoz", onClick: () => setShowAddCustomer(true) },
          { icon: <ShoppingCart size={20} />, label: "Savdo Kiritish", onClick: () => setShowSell(true) },
          { icon: <Wallet size={20} />, label: "Qarz To'lovi", onClick: () => setShowPayment(true) },
        ]}
      />
    </div>

  );
}

function CustomerList({ customers, search, setSearch, onDelete, onSelectCustomer }: { customers: Customer[]; search: string; setSearch: (s: string) => void; onDelete: (type: string, id: number) => void; onSelectCustomer: (id: number) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div className="search-bar" style={{ maxWidth: 400, flex: 1 }}>
          <Search size={14} className="search-icon" style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input className="input" style={{ paddingLeft: "2.2rem" }} placeholder="Ism yoki telefon orqali qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="empty-state"><Users size={48} /><div>Mijoz topilmadi</div></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {customers.map((c) => {
            const totalBuy = c.sales.reduce((s, sale) => s + sale.totalAmount, 0);
            const totalPaid = c.customerPayments?.reduce((s, p) => s + p.amount, 0) || 0;
            const balance = totalBuy - totalPaid;

            let r12 = 0, r14 = 0, r16 = 0;
            c.sales.forEach(sale => {
              sale.items?.forEach(item => {
                if (item.size === 12) r12 += item.count;
                if (item.size === 14) r14 += item.count;
                if (item.size === 16) r16 += item.count;
              });
            });

            return (
              <div key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", cursor: "pointer", transition: "background 0.2s" }}
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div className="avatar" style={{ width: 42, height: 42, borderRadius: "12px", background: "var(--accent-primary-light)", color: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem" }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{c.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{c.phone ?? "Tel kiritilmagan"}</span>
                        <span>•</span>
                        <span>{c.sales.length} ta savdo</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.1rem" }}>Balans</div>
                      {balance > 0 ? (
                        <span className="badge badge-red" style={{ fontWeight: 700 }}>{fmtAmount(balance)}</span>
                      ) : balance < 0 ? (
                        <span className="badge badge-green" style={{ fontWeight: 700 }}>Haqdor: {fmtAmount(Math.abs(balance))}</span>
                      ) : (
                        <span className="badge badge-green">✓</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                       <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={(e) => { e.stopPropagation(); onSelectCustomer(c.id); }}
                        style={{ padding: "0.4rem 0.7rem", fontSize: "0.75rem" }}
                      >
                        Tarix
                      </button>
                      <button 
                        className="btn btn-sm" 
                        onClick={(e) => { e.stopPropagation(); onDelete("customer", c.id); }} 
                        style={{ color: "var(--accent-red)", padding: "0.4rem" }}
                      >
                        <Trash2 size={18} />
                      </button>
                      {expanded === c.id ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                    </div>
                  </div>
                </div>

                {expanded === c.id && (
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderTop: "1px dashed var(--border)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                      <div className="card" style={{ padding: "0.75rem", background: "var(--bg-primary)" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Jami Xarid</div>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{fmtAmount(totalBuy)}</div>
                      </div>
                      <div className="card" style={{ padding: "0.75rem", background: "var(--bg-primary)" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>To'lovlar</div>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--accent-green)" }}>{fmtAmount(totalPaid)}</div>
                      </div>
                      {(r12 > 0 || r14 > 0 || r16 > 0) && (
                        <div className="card" style={{ padding: "0.75rem", background: "var(--bg-primary)" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Savatlar soni</div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                            {r12 > 0 && <span className="badge badge-blue">R12: {r12}</span>}
                            {r14 > 0 && <span className="badge badge-blue">R14: {r14}</span>}
                            {r16 > 0 && <span className="badge badge-blue">R16: {r16}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {c.sales.length > 0 ? (
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Oxirgi savdolar:</div>
                        <div className="table-wrapper" style={{ margin: 0, background: "var(--bg-primary)", borderRadius: "8px" }}>
                          <table style={{ fontSize: "0.85rem" }}>
                            <thead>
                              <tr>
                                <th>Sana</th>
                                <th>Mahsulot</th>
                                <th>Jami</th>
                                <th>Holat</th>
                                <th>Izoh</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.sales.slice(0, 3).map((s, idx) => (
                                <tr key={idx}>
                                  <td>{new Date(s.date).toLocaleDateString("uz-UZ")}</td>
                                  <td>
                                    {s.items?.map((it, i) => (
                                      <span key={i} style={{ marginRight: "0.4rem" }}>R{it.size}×{it.count}</span>
                                    ))}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>{fmtAmount(s.totalAmount)}</td>
                                  <td>
                                    {s.debtAmount > 0 ? (
                                      <span className="text-red">Qarz: {fmtAmount(s.debtAmount)}</span>
                                    ) : (
                                      <span className="text-green">To'langan ✓</span>
                                    )}
                                  </td>
                                  <td className="text-muted" style={{ fontSize: "0.82rem", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.notes ?? ""}>
                                    {s.notes || <span style={{ opacity: 0.35 }}>—</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Savdo qilinmagan</div>
                    )}
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

function SalesList({ onDelete }: { onDelete: (type: string, id: number) => void }) {
  const [sales, setSales] = useState<Array<{
    id: number; date: string; totalAmount: number; paidAmount: number; debtAmount: number; cogs: number; netProfit: number;
    notes: string | null;
    customer: { name: string };
    items: Array<{ size: number; count: number; unitPrice: number }>;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sales").then(r => r.json()).then(d => { setSales(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>Yuklanmoqda...</div>;
  if (sales.length === 0) return <div className="empty-state"><div>Hali savdo kiritilmagan</div></div>;

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Sana</th>
            <th>Mijoz</th>
            <th>Mahsulotlar</th>
            <th>Jami</th>
            <th>To'langan</th>
            <th>Qarz</th>
            <th>Tannarxi</th>
            <th>Sof Foyda</th>
            <th>Izoh</th>
            <th>Amal</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td className="text-muted">{new Date(s.date).toLocaleDateString("uz-UZ")}</td>
              <td style={{ fontWeight: 600 }}>{s.customer.name}</td>
              <td>
                {s.items.map((item, i) => (
                  <span key={i} className="badge badge-blue" style={{ marginRight: "0.25rem" }}>
                    R{item.size}×{item.count}
                  </span>
                ))}
              </td>
              <td style={{ fontWeight: 700 }}>{fmtAmount(s.totalAmount)}</td>
              <td className="text-green">{fmtAmount(s.paidAmount)}</td>
              <td>{s.debtAmount > 0 ? <span className="badge badge-red">{fmtAmount(s.debtAmount)}</span> : <span className="badge badge-green">✓</span>}</td>
              <td className="text-muted">{fmtAmount(s.cogs)}</td>
              <td style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>{fmtAmount(s.netProfit)}</td>
              <td className="text-muted" style={{ fontSize: "0.85rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.notes ?? ""}>
                {s.notes || <span style={{ opacity: 0.35 }}>—</span>}
              </td>
              <td>
                <button className="btn btn-sm" onClick={() => onDelete("sale", s.id)} style={{ color: "var(--accent-red)", padding: "0.4rem" }}>
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

function DebtList({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) return <div className="empty-state"><Users size={48} /><div>Barcha mijozlar hisob-kitobda ✓</div></div>;
  return (
    <div className="table-wrapper">
      <table>
        <thead><tr><th>Mijoz</th><th>Telefon</th><th>Jami Qarz</th></tr></thead>
        <tbody>
          {customers.map((c) => {
            const totalBuy = c.sales.reduce((s, sale) => s + sale.totalAmount, 0);
            const totalPaid = c.customerPayments?.reduce((s, p) => s + p.amount, 0) || 0;
            const balance = totalBuy - totalPaid;
            if (balance <= 0) return null;
            return (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td className="text-muted">{c.phone ?? "—"}</td>
                <td><span className="badge badge-red" style={{ fontSize: "0.85rem", padding: "0.3rem 0.7rem" }}>{fmtAmount(balance)}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AddCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const submit = async () => {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    showToast("Mijoz muvaffaqiyatli qo'shildi!");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>👤 Yangi Mijoz</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="form-group"><label>Ism *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mijoz ismi" /></div>
        <div className="form-group"><label>Telefon</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998..." /></div>
        <div className="form-group"><label>Manzil</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>{saving ? "..." : "Saqlash"}</button>
        </div>
      </div>
    </div>
  );
}

function AddSaleModal({ customers, stock, onClose, onSuccess }: {
  customers: Customer[];
  stock: Stock | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ size: 12, count: 0, unitPrice: 0 }]);
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const totalAmount = items.reduce((s, i) => s + i.count * i.unitPrice, 0);
  const debt = totalAmount - parseFloat(paidAmount || "0");

  const addItem = () => setItems([...items, { size: 12, count: 0, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: field === "size" ? parseInt(val) : parseFloat(val) || 0 } : item));

  const submit = async () => {
    if (!customerId) { setError("Mijozni tanlang"); return; }
    const filtered = items.filter((i) => i.count > 0 && i.unitPrice > 0);
    if (filtered.length === 0) { setError("Kamida bitta mahsulot kiriting"); return; }
    setSaving(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, items: filtered, paidAmount, notes, date }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    showToast("Savdo muvaffaqiyatli saqlandi!");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-title">
          <span>🛒 Savdo Kiritish</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}
        {stock && (
          <div className="alert alert-warning" style={{ marginBottom: "1rem" }}>
            Ombor: R12: <strong>{stock.size12Count}</strong> | R14: <strong>{stock.size14Count}</strong> | R16: <strong>{stock.size16Count}</strong>
          </div>
        )}
        <div className="grid-2">
          <div className="form-group">
            <label>Mijoz *</label>
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Tanlang...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Sana</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ marginBottom: 0 }}>Mahsulotlar</label>
            <button className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={12} /> Qo'shish</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", gap: "0.4rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Razmer</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Soni (ta)</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Narx (1 ta)</span>
            <span />
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
              <select className="input" value={item.size} onChange={(e) => updateItem(i, "size", e.target.value)}>
                <option value={12}>Razmer 12</option>
                <option value={14}>Razmer 14</option>
                <option value={16}>Razmer 16</option>
              </select>
              <div style={{ flex: 1 }}><NumericInput value={item.count || ""} onChange={(val) => updateItem(i, "count", val)} allowDecimals={false} placeholder="0" /></div>
              <div style={{ flex: 1 }}>
                <NumericInput value={item.unitPrice || ""} onChange={(val) => updateItem(i, "unitPrice", val)} placeholder="Narx" />
                {item.unitPrice > 0 && <div style={{ fontSize: "0.65rem", color: "var(--accent-primary)", marginTop: "2px" }}>{fmtAmount(item.unitPrice)}</div>}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(i)} style={{ padding: "0.35rem" }}><X size={12} /></button>
            </div>
          ))}
        </div>

        {totalAmount > 0 && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            Jami: <strong>{fmtAmount(totalAmount)}</strong>
            {debt > 0 && <> | Qarz qoladi: <strong style={{ color: "var(--accent-red)" }}>{fmtAmount(debt)}</strong></>}
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label>To'langan summa</label>
            <NumericInput value={paidAmount} onChange={(val) => setPaidAmount(val)} placeholder="0" />
            {paidAmount && <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: "0.25rem" }}>{fmtAmount(parseFloat(paidAmount))}</div>}
          </div>
          <div className="form-group"><label>Izoh</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        </div>
      </div>
    </div>
  );
}

function AddPaymentModal({ customers, onClose, onSuccess }: {
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [sales, setSales] = useState<Array<{ id: number; date: string; debtAmount: number }>>([]);
  const [saleId, setSaleId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadSales = useCallback(async (cid: string) => {
    if (!cid) { setSales([]); return; }
    const cust = await fetch(`/api/customers/${cid}`).then(r => r.json());
    setSales((cust.sales ?? []).filter((s: { debtAmount: number }) => s.debtAmount > 0));
  }, []);

  useEffect(() => { loadSales(customerId); }, [customerId, loadSales]);

  const submit = async () => {
    setSaving(true);
    await fetch("/api/customer-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, saleId: saleId || null, amount, notes, date }),
    });
    showToast("To'lov muvaffaqiyatli saqlandi!");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>💰 Qarz To'lovi</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="form-group">
          <label>Mijoz *</label>
          <select className="input" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setSaleId(""); }}>
            <option value="">Tanlang...</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {sales.length > 0 && (
          <div className="form-group">
            <label>Qaysi savdo uchun (ixtiyoriy)</label>
            <select className="input" value={saleId} onChange={(e) => setSaleId(e.target.value)}>
              <option value="">Umumiy to'lov</option>
              {sales.map((s) => <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString("uz-UZ")} — Qarz: {fmtAmount(s.debtAmount)}</option>)}
            </select>
          </div>
        )}
        <div className="grid-2">
          <div className="form-group">
            <label>Summa (so'm) *</label>
            <NumericInput value={amount} onChange={(val) => setAmount(val)} placeholder="1000000" />
            {amount && <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: "0.25rem" }}>{fmtAmount(parseFloat(amount))}</div>}
          </div>
          <div className="form-group"><label>Sana</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="form-group"><label>Izoh</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>{saving ? "..." : "Saqlash"}</button>
        </div>
      </div>
    </div>
  );
}

export function CustomerDetailsModal({ customerId, onClose }: { customerId: number; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${customerId}`).then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [customerId]);

  let history: any[] = [];
  if (data) {
    data.sales?.forEach((s: any) => {
      history.push({
        type: "sale",
        id: `s-${s.id}`,
        date: s.date,
        createdAt: s.createdAt,
        amount: s.totalAmount, 
        items: s.items,
        notes: s.notes ? `🛒 Savdo — ${s.notes}` : `🛒 Savdo (Mahsulot berildi)`,
      });
      // NOTE: We no longer add s.paidAmount to history here 
      // because all payments (including upfront ones) are now 
      // represented in data.customerPayments.
    });
    data.customerPayments?.forEach((p: any) => {
      history.push({
        type: "payment",
        id: `p-${p.id}`,
        date: p.date,
        createdAt: p.createdAt,
        amount: p.amount,
        notes: p.notes || "💸 Qarz to'lovi / Avans olindi",
      });
    });

    // Sort chronologically: Business date first, then use createdAt for precise timing
    history.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return timeA - timeB;
    });
  }

  let runningBalance = 0;

  const formatDateTime = (dateStr: string, createdAt?: string) => {
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString("uz-UZ");
    if (createdAt) {
      const c = new Date(createdAt);
      const timePart = c.toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' });
      return (
        <div style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem" }}>
          <span>{datePart}</span>
          <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{timePart}</span>
        </div>
      );
    }
    return datePart;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, padding: 0, overflow: "hidden" }}>
        <div className="modal-title" style={{ padding: "1rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} /> Tarix: {data?.name || "Yuklanmoqda..."}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>Yuklanmoqda...</div>
        ) : (
          <div className="table-wrapper" style={{ maxHeight: "65vh", overflowY: "auto", margin: 0 }}>
            <table style={{ width: "100%", textAlign: "left" }}>
              <thead style={{ position: "sticky", top: 0, background: "var(--bg-secondary)", zIndex: 1 }}>
                <tr>
                  <th>Sana / Vaqt</th>
                  <th>Amaliyot (Razmerlar)</th>
                  <th style={{ textAlign: "right" }}>Sotildi (Qarz)</th>
                  <th style={{ textAlign: "right" }}>To'lov (Keldi)</th>
                  <th style={{ textAlign: "right", borderLeft: "1px solid var(--border)" }}>Holat (Qoldiq)</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>Hali o'zaro oldi-berdi yo'q</td></tr>
                ) : (
                  history.map((h) => {
                    if (h.type === "sale") runningBalance += h.amount;
                    else runningBalance -= h.amount;

                    return (
                      <tr key={h.id}>
                        <td>{formatDateTime(h.date, h.createdAt)}</td>
                        <td>
                          <div style={{ color: h.type === "payment" ? "var(--accent-green)" : "inherit", marginBottom: h.items ? "0.25rem" : "0" }}>
                            {h.notes}
                          </div>
                          {h.items && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {h.items.map((item: any, i: number) => (
                                <div key={i} style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                  <span className="badge badge-blue">R{item.size}</span>
                                  <span style={{ fontWeight: 500 }}>{item.count} ta</span>
                                  <span className="text-muted">× {fmtAmount(item.unitPrice)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: h.type === "sale" ? 600 : 400 }}>
                          {h.type === "sale" ? fmtAmount(h.amount) : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: h.type === "payment" ? 600 : 400, color: h.type === "payment" ? "var(--accent-green)" : "inherit" }}>
                          {h.type === "payment" ? `+ ${fmtAmount(h.amount)}` : "—"}
                        </td>
                        <td style={{ textAlign: "right", borderLeft: "1px solid var(--border)", fontWeight: 700 }}>
                          {runningBalance > 0 ? (
                            <span className="badge badge-red">Qarz: {fmtAmount(runningBalance)}</span>
                          ) : runningBalance < 0 ? (
                            <span className="badge badge-green">Avans (Sizda): {fmtAmount(Math.abs(runningBalance))}</span>
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
        )}
      </div>
    </div>
  );
}
