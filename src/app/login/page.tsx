"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, User, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Iltimos, maydonlarni to'ldiring.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Tizimga kirishda xatolik");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-secondary)",
      padding: "1rem"
    }}>
      <div style={{
        background: "white",
        width: "100%",
        maxWidth: "420px",
        borderRadius: "24px",
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.08)",
        border: "1px solid var(--border)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "18px", 
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem"
          }}>
            <span style={{ fontSize: "1.75rem" }}>🧺</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>
            Xush Kelibsiz
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Korzinka ERP direktor portaliga kirish
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fee2e2", color: "#b91c1c", padding: "0.85rem 1rem", 
            borderRadius: "12px", fontSize: "0.85rem", fontWeight: 600, 
            marginBottom: "1.5rem", border: "1px solid #fecaca", textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Loginingiz</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                type="text"
                autoComplete="username"
                className="input"
                style={{ paddingLeft: "2.75rem", paddingRight: "1rem", height: "48px", background: "#f8fafc" }}
                placeholder="Login"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Maxfiy so'z</label>
            <div style={{ position: "relative" }}>
              <KeyRound size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                type="password"
                autoComplete="current-password"
                className="input"
                style={{ paddingLeft: "2.75rem", paddingRight: "1rem", height: "48px", background: "#f8fafc" }}
                placeholder="Parol"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: loading ? "#a5b4fc" : "var(--accent-primary)",
              color: "white", width: "100%", height: "48px", borderRadius: "12px",
              fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", 
              justifyContent: "center", gap: "0.5rem", border: "none", cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {loading ? (
              <><Loader2 size={18} className="spin" /> Kutilmoqda...</>
            ) : (
              <>Tizimga kirish <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
