"use client";

import { useEffect, useState, useCallback } from "react";
import { getAnalyticsSummary } from "@/lib/api";
import CategoryBarsCard from "@/components/CategoryBarsCard";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

interface CategoryData {
  category_id: string;
  category_name: string;
  spent_usd: number;
  budget_usd: number | null;
  percentage: number | null;
  status: "green" | "yellow" | "red" | "none";
}

interface Summary {
  total_expenses_usd: number;
  total_income_usd: number;
  balance_usd: number;
  by_category: CategoryData[];
}

const STATUS_CONFIG = {
  green:  { label: "OK",        class: "badge-green",  bar: "progress-green"  },
  yellow: { label: "Atención",  class: "badge-yellow", bar: "progress-yellow" },
  red:    { label: "Excedido",  class: "badge-red",    bar: "progress-red"    },
  none:   { label: "Sin límite",class: "badge-gray",   bar: "progress-green"  },
};

const MONTHS = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const BAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#3B82F6", "#EF4444", "#14B8A6",
];

function formatUSD(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function getPrevMonthYear(m: number, y: number) {
  return m === 1 ? { pm: 12, py: y - 1 } : { pm: m - 1, py: y };
}

function delta(curr: number, prev: number) {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [summary,     setSummary]     = useState<Summary | null>(null);
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { pm, py } = getPrevMonthYear(month, year);
    try {
      // First, get current summary
      const data = await getAnalyticsSummary(month, year);
      setSummary(data);
      
      // Try to get previous summary, but don't fail if it doesn't exist
      try {
        const prev = await getAnalyticsSummary(pm, py);
        setPrevSummary(prev);
      } catch (e) {
        console.warn("No se pudo cargar el resumen del mes anterior", e);
        setPrevSummary(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const barData = (summary?.by_category || [])
    .filter((c) => c.spent_usd > 0 || (c.budget_usd !== null && c.budget_usd > 0))
    .sort((a, b) => b.spent_usd - a.spent_usd)
    .slice(0, 8)
    .map((c, i) => ({
      name: c.category_name,
      amount: c.spent_usd,
      budget: c.budget_usd,
      status: c.status,
      color: BAR_COLORS[i % BAR_COLORS.length],
    }));

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Resumen de tus finanzas personales</p>
          </div>
          {/* Month Selector */}
          <div className="flex gap-2 items-center">
            <select
              id="month-select"
              className="form-select"
              style={{ width: 130 }}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              id="year-select"
              className="form-select"
              style={{ width: 100 }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ opacity: 0.6 }}>
            {/* Skeleton KPI Cards */}
            <div className="stats-grid">
              {[0, 1, 2, 3].map((i) => (
                <div className="stat-card" key={i} style={{ overflow: "hidden" }}>
                  <div className="skeleton-line" style={{ width: "40%", height: 12, marginBottom: 16 }} />
                  <div className="skeleton-line" style={{ width: "60%", height: 32, marginBottom: 12 }} />
                  <div className="skeleton-line" style={{ width: "50%", height: 10 }} />
                </div>
              ))}
            </div>

            {/* Skeleton Chart + Budgets */}
            <div className="grid-2" style={{ gap: 24 }}>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "24px 28px 16px", borderBottom: "2px solid var(--border)", background: "var(--bg-sidebar)" }}>
                  <div className="skeleton-line" style={{ width: "50%", height: 12, marginBottom: 12 }} />
                  <div className="skeleton-line" style={{ width: "35%", height: 28 }} />
                </div>
                <div style={{ padding: "24px 28px" }}>
                  {[90, 65, 40].map((w, i) => (
                    <div key={i} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div className="skeleton-line" style={{ width: "30%", height: 12 }} />
                        <div className="skeleton-line" style={{ width: "20%", height: 12 }} />
                      </div>
                      <div className="skeleton-bar">
                        <div className="skeleton-bar-fill" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                  <div className="skeleton-line" style={{ width: "40%", height: 16 }} />
                  <div className="skeleton-line" style={{ width: "20%", height: 28, borderRadius: 2 }} />
                </div>
                {[80, 55, 35].map((w, i) => (
                  <div key={i} style={{ marginBottom: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div className="skeleton-line" style={{ width: "35%", height: 12 }} />
                      <div className="skeleton-line" style={{ width: "15%", height: 12 }} />
                    </div>
                    <div className="skeleton-bar">
                      <div className="skeleton-bar-fill" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--radius-md)", padding: "14px 18px", color: "var(--accent-red)", marginBottom: 24,
          }}>
            ⚠️ {error} — <button onClick={load} style={{ color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer" }}>Reintentar</button>
          </div>
        )}

        {summary && !loading && (
          <>
            {/* KPI Cards */}
            <div className="stats-grid">
              {/* Gastos */}
              <div className="stat-card">
                <div className="stat-label">Total Gastado</div>
                <div className="stat-value text-red">{formatUSD(summary.total_expenses_usd)}</div>
                <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                  <span className="stat-sub">{MONTHS[month]} {year}</span>
                  {prevSummary && (() => {
                    const d = delta(summary.total_expenses_usd, prevSummary.total_expenses_usd);
                    if (d === null) return null;
                    const up = d > 0;
                    return (
                      <span className={`badge ${up ? "badge-red" : "badge-green"}`} style={{ fontSize: 10 }}>
                        {up ? "↑" : "↓"} {Math.abs(d).toFixed(0)}% vs mes ant.
                      </span>
                    );
                  })()}
                </div>
                <div className="stat-icon">💸</div>
              </div>

              {/* Ingresos */}
              <div className="stat-card">
                <div className="stat-label">Total Ingresos</div>
                <div className="stat-value text-green">{formatUSD(summary.total_income_usd)}</div>
                <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                  <span className="stat-sub">Registrados este mes</span>
                  {prevSummary && (() => {
                    const d = delta(summary.total_income_usd, prevSummary.total_income_usd);
                    if (d === null) return null;
                    const up = d > 0;
                    return (
                      <span className={`badge ${up ? "badge-green" : "badge-red"}`} style={{ fontSize: 10 }}>
                        {up ? "↑" : "↓"} {Math.abs(d).toFixed(0)}% vs mes ant.
                      </span>
                    );
                  })()}
                </div>
                <div className="stat-icon">💵</div>
              </div>

              {/* Balance */}
              <div className="stat-card">
                <div className="stat-label">Balance</div>
                <div className={`stat-value ${summary.balance_usd >= 0 ? "text-green" : "text-red"}`}>
                  {formatUSD(summary.balance_usd)}
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                  <span className="stat-sub">Ingresos - Gastos</span>
                  {prevSummary && prevSummary.balance_usd !== 0 && (() => {
                    const curr = summary.balance_usd;
                    const prev = prevSummary.balance_usd;
                    const improved = curr > prev;
                    return (
                      <span className={`badge ${improved ? "badge-green" : "badge-red"}`} style={{ fontSize: 10 }}>
                        {improved ? "↑" : "↓"} vs mes ant.
                      </span>
                    );
                  })()}
                </div>
                <div className="stat-icon">⚖️</div>
              </div>

              {/* Categorías activas */}
              <div className="stat-card">
                <div className="stat-label">Categorías activas</div>
                <div className="stat-value text-accent">
                  {summary.by_category.filter((c) => c.spent_usd > 0).length}
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                  <span className="stat-sub">Con gastos este mes</span>
                  {prevSummary && (() => {
                    const curr = summary.by_category.filter((c) => c.spent_usd > 0).length;
                    const prev = prevSummary.by_category.filter((c) => c.spent_usd > 0).length;
                    if (prev === 0) return null;
                    const diff = curr - prev;
                    if (diff === 0) return <span className="badge badge-gray" style={{ fontSize: 10 }}>= mes ant.</span>;
                    return (
                      <span className={`badge ${diff > 0 ? "badge-yellow" : "badge-green"}`} style={{ fontSize: 10 }}>
                        {diff > 0 ? `+${diff}` : diff} vs mes ant.
                      </span>
                    );
                  })()}
                </div>
                <div className="stat-icon">🏷️</div>
              </div>
            </div>

            {/* Charts + Budgets row */}
            <div className="grid-2" style={{ gap: 24 }}>
              {/* Category Distribution */}
              <CategoryBarsCard
                categories={barData}
                totalExpenses={summary.total_expenses_usd}
                monthLabel={`${MONTHS[month]} ${year}`}
              />

              {/* Budget Progress */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Presupuestos</h2>
                  <Link href="/presupuestos" className="btn btn-secondary btn-sm">Ver todos</Link>
                </div>
                {summary.by_category.filter((c) => c.budget_usd).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                    🎯 No hay presupuestos configurados
                    <br />
                    <Link href="/presupuestos" className="auth-link" style={{ fontSize: 13, marginTop: 8, display: "inline-block" }}>
                      Crear presupuestos →
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {summary.by_category
                      .filter((c) => c.budget_usd)
                      .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
                      .slice(0, 6)
                      .map((cat) => {
                        const cfg = STATUS_CONFIG[cat.status];
                        const pct = Math.min(cat.percentage ?? 0, 100);
                        return (
                          <div key={cat.category_id}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">{cat.category_name}</span>
                              <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${cfg.bar}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-2" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              <span>{formatUSD(cat.spent_usd)} gastado</span>
                              <span>{cat.percentage?.toFixed(0)}% de {formatUSD(cat.budget_usd!)}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
