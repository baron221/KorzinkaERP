"use client";
import { useEffect, useState, useCallback } from "react";
import { 
  ShoppingCart, 
  Factory, 
  Truck, 
  Receipt, 
  Trash2, 
  AlertCircle,
  Search,
  Calendar
} from "lucide-react";
import { fmtAmount, fmtWeight } from "@/lib/utils";
import { useToast } from "@/components/ToastContext";

type HistoryTab = "sales" | "production" | "materials" | "expenses";

export default function TarixPage() {
  const [tab, setTab] = useState<HistoryTab>("sales");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    let endpoint = "";
    switch (tab) {
      case "sales": endpoint = "/api/sales"; break;
      case "production": endpoint = "/api/production"; break;
      case "materials": endpoint = "/api/raw-materials"; break;
      case "expenses": endpoint = "/api/expenses"; break;
    }

    try {
      const res = await fetch(endpoint);
      const d = await res.json();
      // Expense API returns {expenses: [...], total: ...}
      setData(tab === "expenses" ? d.expenses : d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (type: string, id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.")) return;
    
    try {
      const res = await fetch(`/api/delete?type=${type}&id=${id}`, { method: "DELETE" });
      const result = await res.json();
      
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast("Muvaffaqiyatli o'chirildi!");
        loadData();
      }
    } catch (e) {
      showToast("Xatolik yuz berdi", "error");
    }
  };

  const filteredData = data.filter((item) => {
    const s = search.toLowerCase();
    if (tab === "sales") return item.customer?.name.toLowerCase().includes(s);
    if (tab === "materials") return item.supplier?.name.toLowerCase().includes(s);
    if (tab === "expenses") return item.category.toLowerCase().includes(s) || (item.notes ?? "").toLowerCase().includes(s);
    if (tab === "production") return (item.notes ?? "").toLowerCase().includes(s);
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Amallar Tarixi</div>
          <div className="page-sub">Barcha yozuvlarni ko'rish va boshqarish</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "sales" ? "active" : ""}`} onClick={() => setTab("sales")}>
          <ShoppingCart size={15} style={{ marginRight: "0.5rem" }} /> Savdolar
        </button>
        <button className={`tab ${tab === "production" ? "active" : ""}`} onClick={() => setTab("production")}>
          <Factory size={15} style={{ marginRight: "0.5rem" }} /> Ishlab chiqarish
        </button>
        <button className={`tab ${tab === "materials" ? "active" : ""}`} onClick={() => setTab("materials")}>
          <Truck size={15} style={{ marginRight: "0.5rem" }} /> Seryo Kirimi
        </button>
        <button className={`tab ${tab === "expenses" ? "active" : ""}`} onClick={() => setTab("expenses")}>
          <Receipt size={15} style={{ marginRight: "0.5rem" }} /> Xarajatlar
        </button>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input 
              className="input" 
              placeholder="Qidirish..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
             <Calendar size={14} /> Jami: {filteredData.length} ta yozuv
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
          Yuklanmoqda...
        </div>
      ) : filteredData.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <div style={{ marginTop: "1rem" }}>Hech qanday ma'lumot topilmadi</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              {tab === "sales" && (
                <tr>
                  <th>Sana</th>
                  <th>Mijoz</th>
                  <th>Jami</th>
                  <th>To'langan</th>
                  <th>Qarz</th>
                  <th>Amal</th>
                </tr>
              )}
              {tab === "production" && (
                <tr>
                  <th>Sana</th>
                  <th>Sarflangan Seryo</th>
                  <th>Jami Mahsulot</th>
                  <th>Izoh</th>
                  <th>Amal</th>
                </tr>
              )}
              {tab === "materials" && (
                <tr>
                  <th>Sana</th>
                  <th>Ta'minotchi</th>
                  <th>Og'irlik</th>
                  <th>Jami Summa</th>
                  <th>To'langan</th>
                  <th>Amal</th>
                </tr>
              )}
              {tab === "expenses" && (
                <tr>
                  <th>Sana</th>
                  <th>Kategoriya</th>
                  <th>Summa</th>
                  <th>Izoh</th>
                  <th>Amal</th>
                </tr>
              )}
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td className="text-muted">{new Date(item.date).toLocaleDateString("uz-UZ")}</td>
                  
                  {tab === "sales" && (
                    <>
                      <td style={{ fontWeight: 600 }}>{item.customer?.name}</td>
                      <td style={{ fontWeight: 700 }}>{fmtAmount(item.totalAmount)}</td>
                      <td className="text-green">{fmtAmount(item.paidAmount)}</td>
                      <td>
                        {item.debtAmount > 0 ? (
                          <span className="badge badge-red">{fmtAmount(item.debtAmount)}</span>
                        ) : (
                          <span className="badge badge-green">To'liq</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-sm" onClick={() => handleDelete("sale", item.id)} style={{ color: "var(--accent-red)" }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}

                  {tab === "production" && (
                    <>
                      <td style={{ fontWeight: 600 }}>{fmtWeight(item.rawUsedKg)}</td>
                      <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{item.totalBaskets} ta</td>
                      <td className="text-muted">{item.notes ?? "—"}</td>
                      <td>
                        <button className="btn btn-sm" onClick={() => handleDelete("production", item.id)} style={{ color: "var(--accent-red)" }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}

                  {tab === "materials" && (
                    <>
                      <td style={{ fontWeight: 600 }}>{item.supplier?.name}</td>
                      <td>{fmtWeight(item.weightKg)}</td>
                      <td style={{ fontWeight: 700 }}>{fmtAmount(item.totalAmount)}</td>
                      <td className="text-green">{fmtAmount(item.paidAmount)}</td>
                      <td>
                        <button className="btn btn-sm" onClick={() => handleDelete("raw", item.id)} style={{ color: "var(--accent-red)" }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}

                  {tab === "expenses" && (
                    <>
                      <td>{item.category}</td>
                      <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>{fmtAmount(item.amount)}</td>
                      <td className="text-muted">{item.notes ?? "—"}</td>
                      <td>
                        <button className="btn btn-sm" onClick={() => handleDelete("expense", item.id)} style={{ color: "var(--accent-red)" }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
