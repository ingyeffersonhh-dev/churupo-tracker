"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/transacciones", label: "Transacciones", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { href: "/presupuestos", label: "Presupuestos", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/categorias", label: "Categorías", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
  { href: "/gastos-fijos", label: "Gastos Fijos", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  { href: "/configuracion", label: "Config", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
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
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💸</div>
          <div>
            <div className="sidebar-logo-text">Churupo Tracker</div>
            <div className="sidebar-logo-sub">Panel de control</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menú Principal</div>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${(pathname || "").startsWith(item.href) ? "active" : ""}`}
            >
              <span className="nav-link-icon">{getEmojiForHref(item.href)}</span>
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

      <header className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
          <span style={{ fontSize: 28 }}>💸</span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, textTransform: "uppercase", letterSpacing: "-0.03em" }}>Churupo</span>
        </div>
      </header>

      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${(pathname || "").startsWith(item.href) ? "active" : ""}`}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

function getEmojiForHref(href: string): string {
  const emojis: Record<string, string> = {
    "/dashboard": "📊",
    "/transacciones": "💳",
    "/presupuestos": "🎯",
    "/categorias": "🏷️",
    "/gastos-fijos": "🔄",
    "/configuracion": "⚙️",
  };
  return emojis[href] || "📌";
}
