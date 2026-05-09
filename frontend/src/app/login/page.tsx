"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    // Guardar token para el API client
    if (data.session?.access_token) {
      localStorage.setItem("access_token", data.session.access_token);
      // Guardar también como cookie para que el middleware de Next.js lo detecte
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400`;
    }

    router.push("/dashboard");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💸</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Churupo Tracker</div>
            <div className="text-secondary text-xs">Sistema bi-monetario</div>
          </div>
        </div>

        <h1 className="auth-title">Bienvenido de nuevo</h1>
        <p className="auth-subtitle">Ingresa a tu cuenta para continuar</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--accent-red)",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión →"}
          </button>
        </form>

        <div className="auth-divider">o</div>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-secondary)" }}>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="auth-link">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
