"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6"];

interface ExpenseData {
  name: string;
  value: number;
  percentage: number;
}

interface ExpensesPieChartProps {
  data: ExpenseData[];
  emptyMessage?: string;
}

export default function ExpensesPieChart({ data, emptyMessage }: ExpensesPieChartProps) {
  if (!data.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución de gastos</h2>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p className="text-sm">{emptyMessage || "No hay gastos para mostrar"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución de gastos</h2>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/2 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown) => `$${Number(value).toFixed(2)}`}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full md:w-1/2 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">${item.value.toFixed(2)}</span>
                <span className="text-xs text-gray-400 ml-1">({item.percentage.toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
