"use client";
import { useEffect, useMemo, useRef, useState } from "react";

interface Option {
  id: number;
  name: string;
  phone?: string | null;
}

// "Ali Karimov" uchun: "ali", "kar", "ak" (bosh harflar) va telefon bo'yicha topadi.
function matchRank(c: Option, q: string): number {
  const name = c.name.toLowerCase();
  const words = name.split(/\s+/).filter(Boolean);
  const initials = words.map((w) => w[0]).join("");
  if (name.startsWith(q)) return 0;
  if (words.some((w) => w.startsWith(q))) return 1;
  if (initials.startsWith(q.replace(/\s+/g, ""))) return 2;
  if (name.includes(q)) return 3;
  if ((c.phone ?? "").includes(q)) return 4;
  return -1;
}

export default function CustomerSelect({ customers, value, onChange }: {
  customers: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = customers.find((c) => String(c.id) === value);
  const [text, setText] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Tashqaridan tanlov o'zgarsa (masalan, tahrirlash oynasi ochilganda) matnni moslaymiz
  useEffect(() => {
    if (selected) setText(selected.name);
  }, [selected]);

  const results = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q || (selected && selected.name === text)) return customers;
    return customers
      .map((c) => ({ c, rank: matchRank(c, q) }))
      .filter((r) => r.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.c.name.localeCompare(b.c.name))
      .map((r) => r.c);
  }, [customers, text, selected]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (c: Option) => {
    onChange(String(c.id));
    setText(c.name);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        className="input"
        value={text}
        placeholder="Ism yoki bosh harflarini yozing..."
        autoComplete="off"
        onFocus={(e) => { setOpen(true); setActive(0); e.target.select(); }}
        onBlur={() => {
          setOpen(false);
          // Tanlanmagan matn qolib ketmasin
          setText(selected?.name ?? "");
        }}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
          if (value) onChange("");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && open && results[active]) { e.preventDefault(); pick(results[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <div
          ref={listRef}
          style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, maxHeight: 220, overflowY: "auto", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
        >
          {results.length === 0 ? (
            <div style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Mijoz topilmadi</div>
          ) : results.map((c, i) => (
            <div
              key={c.id}
              // onMouseDown: input blur bo'lishidan oldin tanlab olish uchun
              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
              onMouseEnter={() => setActive(i)}
              style={{ padding: "0.55rem 0.75rem", cursor: "pointer", fontSize: "0.9rem", display: "flex", justifyContent: "space-between", gap: "0.5rem", background: i === active ? "var(--bg-secondary)" : "transparent" }}
            >
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              {c.phone && <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{c.phone}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
