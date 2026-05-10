"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuthStore, initAuth } from "@/store/auth";
import type { Category, MerchantRule, Budget } from "@/types";

const tabs = [
  { id: "categories", label: "Categorías" },
  { id: "rules", label: "Reglas de Comercio" },
  { id: "budgets", label: "Presupuestos" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("categories");
  const { user, session } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Gestiona tus preferencias</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 32, borderBottom: "2px solid var(--border)", paddingBottom: 0 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 20px",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid var(--accent)" : "3px solid transparent",
                color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                marginBottom: -2,
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "categories" && <CategoriesTab userId={user?.id || ""} token={session?.access_token || ""} />}
        {activeTab === "rules" && <RulesTab userId={user?.id || ""} token={session?.access_token || ""} />}
        {activeTab === "budgets" && <BudgetsTab userId={user?.id || ""} token={session?.access_token || ""} />}
      </main>
    </div>
  );
}

function CategoriesTab({ userId, token }: { userId: string; token: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCategories(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase
      .from("categories")
      .insert({ user_id: userId, name, type, icon: icon || null })
      .select()
      .single();
    if (data) {
      setCategories([data, ...categories]);
      setShowForm(false);
      setName("");
      setIcon("");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    setCategories(categories.filter((c) => c.id !== id));
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Cargando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-secondary">{categories.length} categorías</span>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
          {showForm ? "Cancelar" : "+ Nueva categoría"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="form-input"
              required
            />
          </div>
          <div className="flex gap-3" style={{ marginBottom: 16 }}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expense")}
              className="form-select"
              style={{ flex: 1 }}
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Icono (emoji)"
              className="form-input"
              style={{ flex: 1 }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Guardar
          </button>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            No hay categorías. Crea una para comenzar.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Tipo</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {cat.icon && <span>{cat.icon}</span>}
                      <span className="font-semibold">{cat.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${cat.type === "expense" ? "badge-red" : "badge-green"}`}>
                      {cat.type === "expense" ? "Gasto" : "Ingreso"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", fontSize: 18 }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function RulesTab({ userId, token }: { userId: string; token: string }) {
  const [rules, setRules] = useState<MerchantRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [rulesRes, catsRes] = await Promise.all([
      supabase.from("merchant_rules").select("*, categories(name, type)").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("categories").select("*").eq("user_id", userId),
    ]);
    setRules(rulesRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase
      .from("merchant_rules")
      .insert({ user_id: userId, keyword, category_id: categoryId })
      .select("*, categories(name, type)")
      .single();
    if (data) {
      setRules([data, ...rules]);
      setShowForm(false);
      setKeyword("");
      setCategoryId("");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("merchant_rules").delete().eq("id", id);
    setRules(rules.filter((r) => r.id !== id));
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Cargando...</div>;

  return (
    <div>
      <div style={{ background: "var(--accent-light)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "var(--text-secondary)" }}>
        Las reglas se usan para categorizar automáticamente las transacciones importadas desde CSV.
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-secondary">{rules.length} reglas</span>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
          {showForm ? "Cancelar" : "+ Nueva regla"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Palabra clave</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ej. PAGO MOVIL"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === "expense" ? "Gasto" : "Ingreso"})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Guardar
          </button>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {rules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            No hay reglas. Crea una para automatizar la categorización.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Palabra clave</th>
                <th>Categoría</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <code style={{ background: "var(--bg-sidebar)", padding: "4px 8px", borderRadius: 2 }}>{rule.keyword}</code>
                  </td>
                  <td>
                    <span className="font-semibold">{rule.category?.name || "N/A"}</span>
                    <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 12 }}>
                      ({rule.category?.type === "expense" ? "Gasto" : "Ingreso"})
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(rule.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", fontSize: 18 }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BudgetsTab({ userId, token }: { userId: string; token: string }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [budgetsRes, catsRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", userId).order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("categories").select("*").eq("user_id", userId),
    ]);
    setBudgets(budgetsRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase
      .from("budgets")
      .upsert({
        user_id: userId,
        category_id: categoryId,
        limit_amount: parseFloat(limitAmount),
        currency,
        month,
        year,
      })
      .select()
      .single();
    if (data) {
      setBudgets([data, ...budgets.filter((b) => !(b.category_id === categoryId && b.month === month && b.year === year))]);
      setShowForm(false);
      setCategoryId("");
      setLimitAmount("");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("budgets").delete().eq("id", id);
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Cargando...</div>;

  return (
    <div>
      <div style={{ background: "var(--accent-light)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "var(--text-secondary)" }}>
        Los presupuestos se muestran en USD. Las barras de progreso usan Verde (&lt;80%), Amarillo (80-99%), Rojo (≥100%).
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-secondary">{budgets.length} presupuestos</span>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
          {showForm ? "Cancelar" : "+ Nuevo presupuesto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.filter((c) => c.type === "expense").map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Monto límite</label>
              <input
                type="number"
                step="0.01"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="0.00"
                className="form-input"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "USD" | "VES")}
                className="form-select"
              >
                <option value="USD">USD</option>
                <option value="VES">VES</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3" style={{ marginBottom: 16 }}>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="form-select"
              style={{ flex: 1 }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("es", { month: "long" })}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="form-input"
              style={{ width: 100 }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Guardar
          </button>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {budgets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            No hay presupuestos. Define límites mensuales para controlar tus gastos.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Período</th>
                <th>Monto</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => {
                const cat = categories.find((c) => c.id === budget.category_id);
                return (
                  <tr key={budget.id}>
                    <td className="font-semibold">{cat?.name || "Sin categoría"}</td>
                    <td>
                      {new Date(0, budget.month - 1).toLocaleString("es", { month: "long" })} {budget.year}
                    </td>
                    <td>
                      <span className="font-bold">{budget.currency} {budget.limit_amount}</span>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(budget.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", fontSize: 18 }}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
