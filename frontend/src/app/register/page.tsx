"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 className="auth-title">¡Cuenta creada!</h2>
          <p className="auth-subtitle" style={{ marginBottom: 24 }}>
            Revisa tu email para confirmar tu cuenta, luego inicia sesión.
          </p>
          <Link href="/login" className="btn btn-primary">
            Ir al Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💸</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Churupo Tracker</div>
            <div className="text-secondary text-xs">Sistema bi-monetario</div>
          </div>
        </div>

        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Empieza a controlar tus finanzas hoy</p>

        <form className="auth-form" onSubmit={handleRegister}>
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
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              className="form-input"
              placeholder="Repite tu contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
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
            {loading ? "Creando cuenta..." : "Crear Cuenta →"}
          </button>
        </form>

        <div className="auth-divider">o</div>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-secondary)" }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="auth-link">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
