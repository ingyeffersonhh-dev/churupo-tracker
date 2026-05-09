"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard",      icon: "📊", label: "Dashboard" },
  { href: "/transacciones",  icon: "💳", label: "Transacciones" },
  { href: "/presupuestos",   icon: "🎯", label: "Presupuestos" },
  { href: "/categorias",     icon: "🏷️",  label: "Categorías" },
  { href: "/configuracion",  icon: "⚙️",  label: "Configuración" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💸</div>
        <div>
          <div className="sidebar-logo-text">Churupo Tracker</div>
          <div className="sidebar-logo-sub">Panel de control</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Menú Principal</div>

        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname.startsWith(item.href) ? "active" : ""}`}
          >
            <span className="nav-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="nav-section-title" style={{ marginTop: "auto" }}>Cuenta</div>

        <button
          onClick={toggleTheme}
          className="nav-link"
          style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}
        >
          <span className="nav-link-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
          {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
        </button>

        <button
          onClick={handleLogout}
          className="nav-link"
          style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%", color: "var(--accent-red)" }}
        >
          <span className="nav-link-icon">🚪</span>
          Cerrar sesión
        </button>
      </nav>

      {/* Bot Badge */}
      <div style={{
        marginTop: 16,
        padding: "12px 14px",
        background: "rgba(99,102,241,0.08)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        fontSize: 12,
        color: "var(--text-secondary)",
      }}>
        <div style={{ fontWeight: 700, color: "var(--accent-light)", marginBottom: 4 }}>
          🤖 Bot de Telegram
        </div>
        <div>Registra gastos desde cualquier lugar con el bot.</div>
        <Link
          href="/configuracion#bot"
          style={{ color: "var(--accent)", textDecoration: "none", fontSize: 11, marginTop: 6, display: "block" }}
        >
          Configurar bot →
        </Link>
      </div>
    </aside>
  );
}
