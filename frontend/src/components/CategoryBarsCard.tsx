"use client";

import { useEffect, useRef, useState } from "react";

interface CategoryBar {
  name: string;
  amount: number;
  budget?: number | null;
  status?: "green" | "yellow" | "red" | "none";
  color: string;
}

interface CategoryBarsCardProps {
  categories: CategoryBar[];
  totalExpenses: number;
  monthLabel: string;
}

const BAR_COLORS = [
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#06B6D4", // Cyan
];

export default function CategoryBarsCard({ categories, totalExpenses, monthLabel }: CategoryBarsCardProps) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimated(true), 150);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const maxAmount = Math.max(...categories.map((c) => c.amount), 1);

  return (
    <div className="card" ref={ref} style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "24px 28px 16px",
          borderBottom: "2px solid var(--border)",
          background: "var(--bg-sidebar)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-secondary)",
            marginBottom: 8,
          }}
        >
          Distribución de Gastos
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--text-main)",
              fontFamily: "var(--font-heading)",
            }}
          >
            ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
            {monthLabel}
          </span>
        </div>
      </div>

      {/* Bars */}
      <div style={{ padding: "24px 28px 28px" }}>
        {categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
            📭 Sin gastos registrados
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {categories.map((cat, i) => {
              const hasBudget = cat.budget !== undefined && cat.budget !== null && cat.budget > 0;
              
              const pctMax = (cat.amount / maxAmount) * 100;
              const budgetPct = hasBudget ? (cat.amount / cat.budget!) * 100 : null;
              
              const targetWidth = hasBudget ? Math.min(budgetPct!, 100) : pctMax;
              const globalPct = totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(1) : "0";

              let barColor = cat.color;
              if (hasBudget) {
                if (cat.status === "red") barColor = "var(--accent-red)";
                else if (cat.status === "yellow") barColor = "var(--accent-yellow)";
                else barColor = "var(--accent-green)";
              }

              const rightAmountLabel = hasBudget 
                ? `$${cat.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $${cat.budget!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${cat.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

              const rightBadgeLabel = hasBudget
                ? `${budgetPct!.toFixed(1)}% ppto`
                : `${globalPct}% total`;

              return (
                <div key={cat.name}>
                  {/* Label row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                      flexWrap: "wrap",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          background: barColor,
                          border: "1.5px solid var(--border)",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--text-main)",
                        }}
                      >
                        {cat.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--text-main)",
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {rightAmountLabel}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          background: "var(--bg-sidebar)",
                          padding: "2px 6px",
                          border: "1px solid var(--border-light)",
                          borderRadius: 2,
                        }}
                      >
                        {rightBadgeLabel}
                      </span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div
                    style={{
                      height: 18,
                      background: "var(--bg-sidebar)",
                      border: "2px solid var(--border)",
                      borderRadius: 2,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: animated ? `${targetWidth}%` : "0%",
                        background: barColor,
                        transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s`,
                        borderRadius: 0,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
