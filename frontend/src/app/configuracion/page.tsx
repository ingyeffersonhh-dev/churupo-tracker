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

          {/* ─── Bot de Telegram ─────────────────────────────────────────── */}
          <div id="bot" className="card">
            <h2 className="text-lg font-bold mb-2">🤖 Bot de Telegram</h2>
            <p className="text-secondary text-sm mb-6">
              Vincula tu cuenta de Telegram para registrar gastos desde el chat.
            </p>

            <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="flex items-center gap-4">
                  <div style={{ fontSize: 48 }}>📱</div>
                  <div>
                    <div className="font-bold text-lg">Cómo vincular el bot</div>
                    <div className="text-secondary text-sm" style={{ marginTop: 4 }}>Sigue estos pasos para empezar a usar el bot</div>
                  </div>
                </div>

                {[
                  { n: "1", text: "Abre Telegram y busca el bot: @Churupo_Track_bot" },
                  { n: "2", text: 'Haz clic en el botón de abajo o escribe /start para iniciar' },
                  { n: "3", text: "Ingresa tu email y contraseña de esta aplicación cuando el bot lo solicite" },
                  { n: "4", text: "¡Listo! Ya puedes registrar gastos escribiendo en lenguaje natural" },
                ].map((step) => (
                  <div key={step.n} className="flex gap-3 items-center">
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--grad-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {step.n}
                    </div>
                    <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{step.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <a
                  href="https://t.me/Churupo_Track_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "12px 32px",
                    fontSize: 16,
                    background: "#229ED9",
                    border: "none",
                    width: "fit-content"
                  }}
                >
                  <span>✈️</span> Abrir @Churupo_Track_bot
                </a>
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
                  Enlace directo: <a href="https://t.me/Churupo_Track_bot" style={{ color: "var(--accent-light)", textDecoration: "underline" }}>t.me/Churupo_Track_bot</a>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(99,102,241,0.08)", border: "1px solid var(--border-hover)", borderRadius: "var(--radius-md)" }}>
              <div className="font-semibold mb-2">💡 Ejemplos de comandos del bot</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                {[
                  ["Comida 15 USD", "Registra gasto de $15"],
                  ["Gasolina 50000 VES", "Registra gasto en bolívares"],
                  ["/presupuestos", "Ver estado de presupuestos"],
                  ["/ultimos 10", "Ver últimas 10 transacciones"],
                  ["/grafico", "Ver gráfico del mes (imagen)"],
                  ["/tasa", "Ver tasa BCV actual"],
                ].map(([cmd, desc]) => (
                  <div key={cmd}>
                    <code style={{ color: "var(--accent-light)", fontSize: 12 }}>{cmd}</code>
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{desc}</div>
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
