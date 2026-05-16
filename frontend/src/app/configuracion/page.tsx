"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { getMerchantRules, createMerchantRule, deleteMerchantRule, getCategories } from "@/lib/api";

interface MerchantRule { id: string; keyword: string; category_id: string; }
interface Category { id: string; name: string; }

export default function ConfiguracionPage() {
  const [rules, setRules] = useState<MerchantRule[]>([]);
  const [cats,  setCats]  = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  }

  // Form reglas
  const [keyword, setKeyword] = useState("");
  const [catId,   setCatId]   = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rData, cData] = await Promise.all([getMerchantRules(), getCategories()]);
      setRules(rData); setCats(cData);
    } catch (e: unknown) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true); setFormError("");
    try {
      await createMerchantRule({ keyword, category_id: catId });
      setKeyword(""); setCatId("");
      await load();
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : "Error"); }
    finally { setFormLoading(false); }
  }

  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Reglas de categorización automática y configuración del bot</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* ─── Reglas de Categorización ───────────────────────────────── */}
          <div className="card">
            <h2 className="text-lg font-bold mb-2">🏷️ Reglas de Categorización Automática</h2>
            <p className="text-secondary text-sm mb-6">
              Si la descripción de una transacción contiene la palabra clave, se asignará automáticamente a esa categoría.
            </p>

            <form onSubmit={handleCreateRule} className="flex gap-3 items-center mb-6" style={{ flexWrap: "wrap" }}>
              <input
                id="rule-keyword"
                type="text"
                className="form-input"
                placeholder="Palabra clave (ej: UBER)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
                style={{ maxWidth: 220 }}
              />
              <select
                id="rule-category"
                className="form-select"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                required
                style={{ maxWidth: 200 }}
              >
                <option value="">Seleccionar categoría...</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button id="btn-add-rule" type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? "..." : "+ Agregar Regla"}
              </button>
              {formError && <span style={{ color: "var(--accent-red)", fontSize: 13 }}>⚠️ {formError}</span>}
            </form>

            {loading ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Palabra Clave</th>
                      <th>Categoría Asignada</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2].map((i) => (
                      <tr key={i}>
                        <td><div className="skeleton-line" style={{ width: 120, height: 18 }} /></td>
                        <td><div className="skeleton-line" style={{ width: 80, height: 20, borderRadius: 10 }} /></td>
                        <td><div className="skeleton-line" style={{ width: 24, height: 24, borderRadius: 4 }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : rules.length === 0 ? (
              <p className="text-muted text-sm">No hay reglas configuradas.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Palabra Clave</th>
                      <th>Categoría Asignada</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id}>
                        <td><code style={{ background: "var(--bg-secondary)", padding: "3px 8px", borderRadius: 4, fontSize: 13 }}>{r.keyword}</code></td>
                        <td><span className="badge badge-blue">{catMap[r.category_id] || "?"}</span></td>
                        <td>
                          <button
                            id={`btn-delete-rule-${r.id}`}
                            className="btn btn-danger btn-sm"
                            onClick={async () => {
                              if (!confirm("¿Eliminar esta regla?")) return;
                              await deleteMerchantRule(r.id);
                              setRules((prev) => prev.filter((x) => x.id !== r.id));
                            }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─── App Móvil (PWA) ───────────────────────────────────────── */}
          <div className="card">
            <h2 className="text-lg font-bold mb-2">📲 Aplicación Móvil</h2>
            <p className="text-secondary text-sm mb-6">
              Instala Churupo en tu pantalla de inicio para acceso rápido sin abrir el navegador.
            </p>

            <div style={{ background: "var(--bg-sidebar)", border: "2px solid var(--border)", padding: 32, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="flex items-center gap-4 mb-2">
                  <div style={{ fontSize: 40, background: "var(--accent)", color: "var(--accent-text)", padding: 12, border: "2px solid var(--border)", boxShadow: "4px 4px 0px var(--border)", display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64 }}>💸</div>
                  <div>
                    <div className="font-bold text-xl uppercase italic">Churupo Tracker</div>
                    <div className="text-secondary text-sm" style={{ fontWeight: 600 }}>{isInstalled ? "✅ Ya instalada" : "Disponible para instalar"}</div>
                  </div>
                </div>

                {!isInstalled && (
                  <button
                    id="btn-install-pwa"
                    className="btn btn-primary"
                    onClick={handleInstall}
                    disabled={!deferredPrompt}
                    style={{
                      width: "fit-content",
                      padding: "14px 32px",
                      fontSize: 15,
                      opacity: deferredPrompt ? 1 : 0.6,
                    }}
                  >
                    ⬇️ Instalar Aplicación
                  </button>
                )}

                {isInstalled && (
                  <div style={{ padding: 16, border: "2px solid var(--accent-green)", background: "rgba(0,204,102,0.08)" }}>
                    <span style={{ fontWeight: 700, color: "var(--accent-green)" }}>
                      ✅ Churupo está instalada en tu dispositivo
                    </span>
                  </div>
                )}

                {!isInstalled && !deferredPrompt && (
                  <div style={{ padding: 16, border: "2px solid var(--border-light)", background: "var(--bg-main)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📋 Instalación manual:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      <div style={{ border: "1px solid var(--border-light)", padding: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 12, color: "var(--accent)" }}>Android / Chrome</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Toca ⋮ → "Instalar aplicación" o "Agregar a pantalla de inicio"</div>
                      </div>
                      <div style={{ border: "1px solid var(--border-light)", padding: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 12, color: "var(--accent)" }}>iPhone / Safari</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Toca Compartir → "Agregar a pantalla de inicio"</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Bot de Telegram ─────────────────────────────────────────── */}
          <div id="bot" className="card">
            <h2 className="text-lg font-bold mb-2">🤖 Bot de Telegram</h2>
            <p className="text-secondary text-sm mb-6">
              Vincula tu cuenta de Telegram para registrar gastos desde el chat en segundos.
            </p>

            <div style={{ background: "var(--bg-sidebar)", border: "2px solid var(--border)", padding: 32, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="flex items-center gap-4 mb-2">
                  <div style={{ fontSize: 40, background: "var(--accent)", color: "var(--accent-text)", padding: 12, border: "2px solid var(--border)", boxShadow: "4px 4px 0px var(--border)" }}>📱</div>
                  <div>
                    <div className="font-bold text-xl uppercase italic">Cómo vincular el bot</div>
                    <div className="text-secondary text-sm" style={{ fontWeight: 600 }}>Sigue estos pasos para activar el control por chat</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                  {[
                    { n: "1", text: "Busca @Churupo_Track_bot en Telegram" },
                    { n: "2", text: 'Presiona Iniciar o escribe /start' },
                    { n: "3", text: "Usa tu email y clave para vincular" },
                    { n: "4", text: "¡Envía gastos en lenguaje natural!" },
                  ].map((step) => (
                    <div key={step.n} style={{ border: "2px solid var(--border)", padding: 16, background: "var(--bg-main)", boxShadow: "3px 3px 0px var(--border)" }}>
                      <div style={{ width: 28, height: 28, background: "var(--border)", color: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
                        {step.n}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 32, textAlign: "center" }}>
                <a
                  href="https://t.me/Churupo_Track_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    padding: "16px 40px",
                    fontSize: 16,
                    background: "#229ED9", /* Telegram Blue */
                    color: "white",
                    width: "fit-content"
                  }}
                >
                  <span>✈️</span> ABRIR EN TELEGRAM
                </a>
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                  Enlace directo: <a href="https://t.me/Churupo_Track_bot" style={{ color: "var(--text-main)", textDecoration: "underline" }}>t.me/Churupo_Track_bot</a>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 24, border: "2px solid var(--border)", background: "var(--accent-light)" }}>
              <div className="font-bold mb-4 uppercase italic">💡 Comandos Rápidos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                {[
                  ["Comida 15 USD", "Gasto de $15 en comida"],
                  ["Gasolina 50000 VES", "Gasto en Bs. (Tasa automática)"],
                  ["/presupuestos", "Estado de tus límites"],
                  ["/ultimos 10", "Tus últimas transacciones"],
                  ["/grafico", "Visualiza tu mes"],
                  ["/tasa", "Tasa oficial BCV"],
                ].map(([cmd, desc]) => (
                  <div key={cmd} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: 8 }}>
                    <code style={{ background: "var(--border)", color: "var(--bg-main)", padding: "2px 6px", fontWeight: 700 }}>{cmd}</code>
                    <span style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
