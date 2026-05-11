"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from "recharts";

interface CategorySlice {
  name: string;
  amount: number;
  budget?: number | null;
  status?: "green" | "yellow" | "red" | "none";
  color: string;
}

interface DonutChartProps {
  categories: CategorySlice[];
  totalExpenses: number;
  monthLabel: string;
}

const renderActiveShape = (props: unknown) => {
  const p = props as {
    cx: number; cy: number; innerRadius: number; outerRadius: number;
    startAngle: number; endAngle: number; fill: string;
    payload: CategorySlice; percent: number; value: number;
  };
  return (
    <g>
      <text x={p.cx} y={p.cy - 12} textAnchor="middle" fill="var(--text-main)" fontSize={22} fontWeight={800}>
        ${p.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </text>
      <text x={p.cx} y={p.cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize={12}>
        {(p.percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={p.cx}
        cy={p.cy}
        innerRadius={p.innerRadius}
        outerRadius={p.outerRadius + 6}
        startAngle={p.startAngle}
        endAngle={p.endAngle}
        fill={p.fill}
      />
      <Sector
        cx={p.cx}
        cy={p.cy}
        innerRadius={p.outerRadius + 10}
        outerRadius={p.outerRadius + 14}
        startAngle={p.startAngle}
        endAngle={p.endAngle}
        fill={p.fill}
        opacity={0.25}
      />
    </g>
  );
};

const formatUSD = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function CategoryDonutChart({ categories, totalExpenses, monthLabel }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [hoveredSlice, setHoveredSlice] = useState<CategorySlice | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const sorted = [...categories].sort((a, b) => b.amount - a.amount);
  const others = sorted.slice(7);
  const main = sorted.slice(0, 7);

  const chartData = others.length > 0
    ? [...main, { name: "Otros", amount: others.reduce((s, c) => s + c.amount, 0), color: "#6B7280" }]
    : main;

  const COLORS = [
    "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B",
    "#10B981", "#3B82F6", "#EF4444", "#6B7280",
  ];

  const activeItem = activeIndex >= 0 ? chartData[activeIndex] : null;

  const handleMouseEnter = (_: unknown, index: number, e: React.MouseEvent) => {
    setHoveredSlice(chartData[index]);
    setHoverPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredSlice(null);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "24px 28px 16px",
        borderBottom: "2px solid var(--border)",
        background: "var(--bg-sidebar)",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: 8,
        }}>
          Distribución de Gastos
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em",
            color: "var(--text-main)", fontFamily: "var(--font-heading)",
          }}>
            ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
            {monthLabel}
          </span>
        </div>
      </div>

      <div style={{ padding: "20px 16px 8px" }}>
        {categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            📭 Sin gastos registrados
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="amount"
                  activeIndex={activeIndex >= 0 ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, idx) => { setActiveIndex(idx); }}
                  onMouseLeave={() => setActiveIndex(-1)}
                  stroke="var(--border)"
                  strokeWidth={2}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color || COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {activeItem && (
              <div style={{
                textAlign: "center", marginTop: -8, marginBottom: 12,
              }}>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>
                  {activeItem.name}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
                  {formatUSD(activeItem.amount)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <div style={{
          padding: "8px 28px 24px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {categories.slice(0, 6).map((cat) => {
            const pct = totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100) : 0;
            return (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: cat.color || COLORS[0], flexShrink: 0,
                  border: "1.5px solid var(--border)",
                }} />
                <span style={{ flex: 1, fontSize: 13, color: "var(--text-main)", fontWeight: 600 }}>
                  {cat.name}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
                  {pct.toFixed(1)}%
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 800, color: "var(--text-main)",
                  fontFamily: "var(--font-heading)",
                  minWidth: 70, textAlign: "right",
                }}>
                  {formatUSD(cat.amount)}
                </span>
              </div>
            );
          })}
          {categories.length > 6 && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 4 }}>
              +{categories.length - 6} categorías más
            </div>
          )}
        </div>
      )}
    </div>
  );
}
