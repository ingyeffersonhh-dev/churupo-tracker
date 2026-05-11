"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { getBudgets, createBudget, deleteBudget, getCategories } from "@/lib/api";

interface Budget {
  id: string; category_id: string; limit_amount: number;
  currency: string; month: number; year: number;
}
interface Category { id: string; name: string; type: string; }

const MONTHS = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function PresupuestosPage() {
  const now = new Date();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [catId, setCatId] = useState("");
  const [limit, setLimit] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bData, cData] = await Promise.all([
        getBudgets(filterMonth, filterYear),
        getCategories()
      ]);
      setBudgets(bData);
      setCats(cData);
    } catch (e: unknown) { console.error(e); }
    finally { setLoading(false); }
  }, [filterMonth, filterYear]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await createBudget({ category_id: catId, limit_amount: parseFloat(limit), currency, month, year });
      setShowModal(false);
      setCatId(""); setLimit(""); setCurrency("USD");
      await load();
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : "Error"); }
    finally { setFormLoading(false); }
  }

  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Presupuestos</h1>
            <p className="page-subtitle">Define límites de gasto por categoría</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
            >
              {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
            </select>
            <button id="btn-new-budget" className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Nuevo Presupuesto
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid-3" style={{ opacity: 0.6 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="stat-card">
                <div className="skeleton-line" style={{ width: "60%", height: 12, marginBottom: 12 }} />
                <div className="skeleton-line" style={{ width: "40%", height: 32, marginBottom: 8 }} />
                <div className="skeleton-line" style={{ width: "50%", height: 10, marginBottom: 16 }} />
                <div className="skeleton-line" style={{ width: "100%", height: 32, borderRadius: 2 }} />
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <p style={{ color: "var(--text-muted)" }}>No hay presupuestos configurados para este mes.</p>
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              Crear primer presupuesto
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {budgets.map((b) => (
              <div key={b.id} className="stat-card">
                <div className="stat-label">{catMap[b.category_id] || "Sin cat."}</div>
                <div className="stat-value text-accent">${Number(b.limit_amount).toFixed(0)}</div>
                <div className="stat-sub">{b.currency} · {MONTHS[b.month]} {b.year}</div>
                <button
                  id={`btn-delete-budget-${b.id}`}
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={async () => {
                    if (!confirm("¿Eliminar este presupuesto?")) return;
                    await deleteBudget(b.id);
                    setBudgets((prev) => prev.filter((x) => x.id !== b.id));
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Nuevo Presupuesto</h2>
              <p className="modal-subtitle">Define un límite mensual por categoría</p>
              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select id="budget-category" className="form-select" value={catId} onChange={(e) => setCatId(e.target.value)} required>
                    <option value="">Seleccionar categoría...</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Límite</label>
                    <input id="budget-limit" type="number" step="0.01" min="0.01" className="form-input" placeholder="0.00" value={limit} onChange={(e) => setLimit(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Moneda</label>
                    <select id="budget-currency" className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="USD">USD 💵</option>
                      <option value="VES">VES 🇻🇪</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Mes</label>
                    <select id="budget-month" className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                      {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Año</label>
                    <select id="budget-year" className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                      {[2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                {formError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "var(--accent-red)" }}>⚠️ {formError}</div>}
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button id="btn-save-budget" type="submit" className="btn btn-primary" disabled={formLoading}>
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
