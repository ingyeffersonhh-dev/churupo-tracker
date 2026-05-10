"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuthStore, initAuth } from "@/store/auth";
import type { Budget, Category, AnalyticsSummary } from "@/types";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const now = new Date();
    const [budgetsRes, catsRes, analyticsRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user?.id).eq("month", now.getMonth() + 1).eq("year", now.getFullYear()),
      supabase.from("categories").select("*").eq("user_id", user?.id),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/summary`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }).then((r) => r.json()),
    ]);

    setBudgets(budgetsRes.data || []);
    setCategories(catsRes.data || []);
    setAnalytics(analyticsRes);
    setLoading(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "green": return { class: "badge-green", bar: "progress-green" };
      case "yellow": return { class: "badge-yellow", bar: "progress-yellow" };
      case "red": return { class: "badge-red", bar: "progress-red" };
      default: return { class: "badge-gray", bar: "progress-green" };
    }
  };

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Cargando...</div>
      </main>
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Presupuestos</h1>
            <p className="page-subtitle">Controla tus gastos mensuales</p>
          </div>
        </div>

        {analytics && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Gastado</div>
              <div className="stat-value text-red">${analytics.total_expenses_usd.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Disponible</div>
              <div className="stat-value text-green">${analytics.balance_usd.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Ingresos</div>
              <div className="stat-value text-accent">${analytics.total_income_usd.toFixed(2)}</div>
            </div>
          </div>
        )}

        <div className="card">
          {budgets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              🎯 No hay presupuestos para este mes
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {budgets.map((budget) => {
                const cat = categories.find((c) => c.id === budget.category_id);
                const catBreakdown = analytics?.by_category.find((b) => b.category_id === budget.category_id);
                const spent = catBreakdown?.spent_usd || 0;
                const percentage = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0;
                const status = percentage >= 100 ? "red" : percentage >= 80 ? "yellow" : "green";
                const cfg = getStatusConfig(status);

                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{cat?.name || "Sin categoría"}</span>
                      <span className={`badge ${cfg.class}`}>{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${cfg.bar}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      <span>${spent.toFixed(2)} gastado</span>
                      <span>de ${budget.limit_amount.toFixed(2)} USD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
