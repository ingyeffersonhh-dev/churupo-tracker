"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { getCategories, createCategory, deleteCategory } from "@/lib/api";

interface Category { id: string; name: string; type: string; icon?: string; }

const ICONS = [
  "🛒","🍔","🚗","🏠","💊","🎓","🎮","✈️","👗","⚡","📱","💰","💼","🎁","🐾",
  "🏥","💡","📺","🛠️","🏋️","🎬","📚","🎵","🛒","🍕","☕","🍺","🛁","👶",
  "💳","🏦","📈","🎯","🎲","🧹","🎂","🎊","🏨","🅿️","🚕","🚂","🚢","🛩️",
  "📦","🎒","👠","💇","💅","🦷","👓","🪒","🧴","🧵","🎸","⚽","🏀","🎳","🎪"
];

export default function CategoriasPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [icon, setIcon] = useState("🛒");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setCats(await getCategories()); }
    catch (e: unknown) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true); setFormError("");
    try {
      await createCategory({ name, type, icon });
      setShowModal(false); setName(""); setType("expense"); setIcon("🛒");
      await load();
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : "Error"); }
    finally { setFormLoading(false); }
  }

  const expenses = cats.filter((c) => c.type === "expense");
  const incomes  = cats.filter((c) => c.type === "income");

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Categorías</h1>
            <p className="page-subtitle">{cats.length} categorías configuradas</p>
          </div>
          <button id="btn-new-category" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nueva Categoría
          </button>
        </div>

        {loading ? (
          <div style={{ opacity: 0.6 }}>
            {[ "Gastos", "Ingresos" ].map((label) => (
              <div key={label} style={{ marginBottom: 32 }}>
                <div className="skeleton-line" style={{ width: 120, height: 24, marginBottom: 16 }} />
                <div className="grid-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="skeleton-line" style={{ width: 40, height: 40, borderRadius: 4 }} />
                        <div>
                          <div className="skeleton-line" style={{ width: 100, height: 14, marginBottom: 8 }} />
                          <div className="skeleton-line" style={{ width: 60, height: 12 }} />
                        </div>
                      </div>
                      <div className="skeleton-line" style={{ width: 24, height: 24, borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {[{ label: "Gastos", items: expenses, color: "var(--accent-red)" },
              { label: "Ingresos", items: incomes, color: "var(--accent-green)" }].map(({ label, items, color }) => (
              <div key={label} style={{ marginBottom: 32 }}>
                <h2 className="text-lg font-bold mb-4" style={{ color }}>{label}</h2>
                {items.length === 0 ? (
                  <p className="text-muted text-sm">No hay categorías de {label.toLowerCase()} aún.</p>
                ) : (
                  <div className="grid-3">
                    {items.map((c) => (
                      <div key={c.id} className="card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span style={{ 
                            fontSize: 28, 
                            background: "var(--bg-card)", 
                            borderRadius: "var(--radius-sm)",
                            padding: "4px 8px",
                            border: "1px solid var(--border)"
                          }}>{c.icon || "📁"}</span>
                          <div>
                            <div className="font-semibold">{c.name}</div>
                            <span className={`badge ${c.type === "expense" ? "badge-red" : "badge-green"}`}>
                              {c.type === "expense" ? "Gasto" : "Ingreso"}
                            </span>
                          </div>
                        </div>
                        <button
                          id={`btn-delete-cat-${c.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar "${c.name}"?`)) return;
                            await deleteCategory(c.id);
                            setCats((prev) => prev.filter((x) => x.id !== c.id));
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <h2 className="modal-title">Nueva Categoría</h2>
              <p className="modal-subtitle">Organiza tus finanzas con categorías</p>
              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 4 }}>
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input id="cat-name" type="text" className="form-input" placeholder="Ej: Alimentación" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select id="cat-type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="expense">💸 Gasto</option>
                    <option value="income">💵 Ingreso</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ícono</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8, marginTop: 4 }}>
                    {ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        style={{
                          fontSize: 22, width: "100%", aspectRatio: "1", borderRadius: "var(--radius-md)",
                          border: `2px solid ${icon === ic ? "var(--accent)" : "var(--border)"}`,
                          background: icon === ic ? "var(--accent)" : "var(--bg-card)",
                          color: icon === ic ? "white" : "inherit",
                          cursor: "pointer", transition: "var(--transition)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                {formError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "var(--accent-red)" }}>⚠️ {formError}</div>}
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button id="btn-save-category" type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? "Guardando..." : "💾 Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
