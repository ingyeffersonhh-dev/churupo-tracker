"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getRecurringExpenses,
  createRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
  getCategories,
  getExchangeRate,
} from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category_id: string | null;
  day_of_month: number;
  is_active: boolean;
  last_executed: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

function formatUSD(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function getNextExecutionDate(dayOfMonth: number, lastExecuted: string | null): string {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Check if already executed this month
  if (lastExecuted) {
    const [year, month] = lastExecuted.split("-").map(Number);
    if (year === currentYear && month === currentMonth + 1) {
      // Already executed this month, next is next month
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      return new Date(nextYear, nextMonth, dayOfMonth).toLocaleDateString("es-VE", {
        day: "2-digit", month: "short", year: "numeric",
      });
    }
  }

  // Not executed this month yet
  const targetDate = new Date(currentYear, currentMonth, dayOfMonth);
  if (targetDate < now) {
    // Day already passed this month, next is next month
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return new Date(nextYear, nextMonth, dayOfMonth).toLocaleDateString("es-VE", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  return targetDate.toLocaleDateString("es-VE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatLastExecuted(lastExecuted: string | null): string {
  if (!lastExecuted) return "Nunca";
  const [year, month] = lastExecuted.split("-").map(Number);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[month - 1]} ${year}`;
}

export default function GastosFijosPage() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  // Form state
  const [form, setForm] = useState({
    description: "",
    amount: "",
    currency: "USD",
    category_id: "",
    day_of_month: "1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [expData, catData, rateData] = await Promise.all([
        getRecurringExpenses(),
        getCategories(),
        getExchangeRate().catch(() => null),
      ]);
      setExpenses(expData);
      setCategories(catData.filter((c: Category) => c.type === "expense"));
      if (rateData?.rate) setBcvRate(rateData.rate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    try {
      if (editingExpense) {
        await import("@/lib/api").then(({ updateRecurringExpense }) =>
          updateRecurringExpense(editingExpense.id, {
            description: form.description,
            amount: parseFloat(form.amount),
            currency: form.currency,
            category_id: form.category_id || undefined,
            day_of_month: parseInt(form.day_of_month),
          })
        );
      } else {
        await createRecurringExpense({
          description: form.description,
          amount: parseFloat(form.amount),
          currency: form.currency,
          category_id: form.category_id || undefined,
          day_of_month: parseInt(form.day_of_month),
        });
      }
      setForm({ description: "", amount: "", currency: "USD", category_id: "", day_of_month: "1" });
      setShowForm(false);
      setEditingExpense(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error creando gasto recurrente");
    }
  };

  const openEditForm = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      currency: expense.currency,
      category_id: expense.category_id || "",
      day_of_month: String(expense.day_of_month),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este gasto recurrente?")) return;
    try {
      await deleteRecurringExpense(id);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error eliminando");
    }
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      await toggleRecurringExpense(id);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error actualizando");
    } finally {
      setToggling(null);
    }
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return "Sin categoría";
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : "Sin categoría";
  };

  const activeExpenses = expenses.filter((e) => e.is_active);
  const totalUSD = activeExpenses.reduce((sum, e) => {
    if (e.currency === "USD") return sum + Number(e.amount);
    if (e.currency === "VES" && bcvRate) return sum + Number(e.amount) / bcvRate;
    return sum;
  }, 0);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Gastos Fijos</h1>
            <p className="page-subtitle">Gastos recurrentes que se registran automáticamente cada mes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancelar" : "＋ Nuevo Gasto Fijo"}
          </button>
        </div>

        {/* Summary Card */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="stat-card">
            <div className="stat-label">Gastos Fijos Activos</div>
            <div className="stat-value text-accent">{activeExpenses.length}</div>
            <div className="stat-sub">de {expenses.length} totales</div>
            <div className="stat-icon">🔄</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Mensual Estimado</div>
            <div className="stat-value text-red">{formatUSD(totalUSD)}</div>
            <div className="stat-sub">
              {bcvRate ? `Tasa BCV: Bs. ${bcvRate.toLocaleString("de-DE")} / USD` : "Cargando tasa..."}
            </div>
            <div className="stat-icon">📅</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Anual Estimado</div>
            <div className="stat-value text-yellow">{formatUSD(totalUSD * 12)}</div>
            <div className="stat-sub">Proyección 12 meses</div>
            <div className="stat-icon">📊</div>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24, borderLeft: "3px solid var(--accent)" }}>
            <h3 className="text-lg font-bold mb-4">{editingExpense ? "Editar Gasto Recurrente" : "Nuevo Gasto Recurrente"}</h3>
            <form onSubmit={handleSubmit} className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label className="form-label">Descripción *</label>
                <input
                  className="form-input"
                  placeholder="Ej: Netflix, Alquiler, Internet..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Monto *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Moneda</label>
                <select
                  className="form-select"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="VES">VES (Bs)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Día del mes (1-28) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="28"
                  value={form.day_of_month}
                  onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  {editingExpense ? "✓ Actualizar" : "✓ Guardar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--radius-md)", padding: "14px 18px", color: "var(--accent-red)", marginBottom: 24,
          }}>
            ⚠️ {error} — <button onClick={load} style={{ color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer" }}>Reintentar</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            Cargando gastos recurrentes...
          </div>
        )}

        {/* Empty State */}
        {!loading && expenses.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
            <h3 className="text-lg font-bold mb-2">No hay gastos recurrentes</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Define gastos que se repiten cada mes como Netflix, alquiler, internet, etc.
              <br />Se registrarán automáticamente el día que configures.
            </p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              ＋ Crear primer gasto fijo
            </button>
          </div>
        )}

        {/* Expenses List */}
        {!loading && expenses.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-sidebar)", borderBottom: "2px solid var(--border)" }}>
                  <th style={thStyle}>Estado</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Descripción</th>
                  <th style={thStyle}>Categoría</th>
                  <th style={thStyle}>Monto</th>
                  <th style={thStyle}>Día</th>
                  <th style={thStyle}>Última Ejecución</th>
                  <th style={thStyle}>Próxima Ejecución</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} style={{
                    borderBottom: "1px solid var(--border)",
                    opacity: exp.is_active ? 1 : 0.5,
                    transition: "opacity 0.2s",
                  }}>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button
                        onClick={() => handleToggle(exp.id)}
                        disabled={toggling === exp.id}
                        style={{
                          background: "none", border: "none", cursor: "pointer", fontSize: 20,
                          filter: toggling === exp.id ? "grayscale(1)" : "none",
                        }}
                        title={exp.is_active ? "Desactivar" : "Activar"}
                      >
                        {exp.is_active ? "✅" : "⏸️"}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {exp.description}
                      {!exp.is_active && (
                        <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: 10 }}>Pausado</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span className="badge badge-gray">{getCategoryName(exp.category_id)}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      {exp.currency === "USD" ? "$" : "Bs."}{Number(exp.amount).toFixed(2)}
                      <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>{exp.currency}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 32, height: 32, borderRadius: "50%",
                        background: "rgba(99,102,241,0.1)", color: "var(--accent-light)",
                        fontWeight: 700, fontSize: 14,
                      }}>
                        {exp.day_of_month}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                      {formatLastExecuted(exp.last_executed)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", fontSize: 12, fontWeight: 600 }}>
                      {exp.is_active ? (
                        <span style={{ color: "var(--accent-green)" }}>
                          {getNextExecutionDate(exp.day_of_month, exp.last_executed)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div className="flex gap-1" style={{ justifyContent: "center" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditForm(exp)}
                          style={{ color: "var(--accent-yellow)", fontSize: 12 }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDelete(exp.id)}
                          style={{ color: "var(--accent-red)", fontSize: 12 }}
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Card */}
        {!loading && expenses.length > 0 && (
          <div className="card" style={{
            marginTop: 24, background: "rgba(99,102,241,0.05)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}>
            <h4 className="font-bold mb-2">💡 ¿Cómo funcionan los gastos fijos?</h4>
            <ul style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Cada gasto activo se registra <strong>automáticamente</strong> en la fecha indicada.</li>
              <li>Puedes <strong>pausar</strong> un gasto sin eliminarlo haciendo clic en el icono de estado.</li>
              <li>El día máximo es <strong>28</strong> para evitar problemas con meses cortos (febrero).</li>
              <li>Los gastos se registran en la moneda seleccionada, convirtiendo a USD con la tasa BCV del día.</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-secondary)",
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 14,
};
