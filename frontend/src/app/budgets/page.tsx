"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  if (loading) return <AppLayout><div className="p-6 text-center text-gray-500">Cargando...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Presupuestos</h1>

        {analytics && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Gastado</p>
              <p className="text-xl font-bold text-red-600 mt-1">${analytics.total_expenses_usd.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Disponible</p>
              <p className="text-xl font-bold text-green-600 mt-1">${analytics.balance_usd.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Ingresos</p>
              <p className="text-xl font-bold text-blue-600 mt-1">${analytics.total_income_usd.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {budgets.map((budget) => {
            const cat = categories.find((c) => c.id === budget.category_id);
            const catBreakdown = analytics?.by_category.find((b) => b.category_id === budget.category_id);
            const spent = catBreakdown?.spent_usd || 0;
            const percentage = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0;
            const status = percentage >= 100 ? "red" : percentage >= 80 ? "yellow" : "green";

            return (
              <div key={budget.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{cat?.name || "Sin categoría"}</p>
                    <p className="text-sm text-gray-500">
                      ${spent.toFixed(2)} / ${budget.limit_amount.toFixed(2)} USD
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${status === "red" ? "text-red-600" : status === "yellow" ? "text-yellow-600" : "text-green-600"}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getStatusColor(status)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {budgets.length === 0 && (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 font-medium">No hay presupuestos para este mes</p>
              <p className="text-sm text-gray-400 mt-1">Define límites en Configuración</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
