"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
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
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>

        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "categories" && <CategoriesTab userId={user?.id || ""} token={session?.access_token || ""} />}
        {activeTab === "rules" && <RulesTab userId={user?.id || ""} token={session?.access_token || ""} />}
        {activeTab === "budgets" && <BudgetsTab userId={user?.id || ""} token={session?.access_token || ""} />}
      </div>
    </AppLayout>
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

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{categories.length} categorías</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {showForm ? "Cancelar" : "Nueva categoría"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "income" | "expense")}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Icono (emoji o clase)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {cat.icon && <span className="text-xl">{cat.icon}</span>}
              <div>
                <p className="font-medium text-gray-900">{cat.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${cat.type === "expense" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {cat.type === "expense" ? "Gasto" : "Ingreso"}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay categorías. Crea una para comenzar.
          </div>
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

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-amber-800">
          Las reglas se usan para categorizar automáticamente las transacciones importadas desde CSV.
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{rules.length} reglas</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {showForm ? "Cancelar" : "Nueva regla"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Palabra clave (ej. PAGO MOVIL)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === "expense" ? "Gasto" : "Ingreso"})
                </option>
              ))}
            </select>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-800">{rule.keyword}</code>
                <span className="text-gray-400">→</span>
                <span className="text-sm font-medium text-gray-900">{rule.category?.name || "N/A"}</span>
              </div>
            </div>
            <button onClick={() => handleDelete(rule.id)} className="text-red-500 hover:text-red-700 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay reglas. Crea una para automatizar la categorización.
          </div>
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
    const { data, error } = await supabase
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

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          Los presupuestos se muestran en USD. Las barras de progreso usan Verde (&lt;80%), Amarillo (80-99%), Rojo (≥100%).
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{budgets.length} presupuestos</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {showForm ? "Cancelar" : "Nuevo presupuesto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.filter((c) => c.type === "expense").map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <input
                type="number"
                step="0.01"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="Monto límite"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "USD" | "VES")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="VES">VES</option>
              </select>
            </div>
            <div className="flex gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {budgets.map((budget) => {
          const cat = categories.find((c) => c.id === budget.category_id);
          return (
            <div key={budget.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{cat?.name || "Sin categoría"}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(0, budget.month - 1).toLocaleString("es", { month: "long" })} {budget.year}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {budget.currency} {budget.limit_amount}
                  </span>
                  <button onClick={() => handleDelete(budget.id)} className="text-red-500 hover:text-red-700 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {budgets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay presupuestos. Define límites mensuales para controlar tus gastos.
          </div>
        )}
      </div>
    </div>
  );
}
