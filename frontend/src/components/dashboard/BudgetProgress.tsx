import * as Progress from "@radix-ui/react-progress";

interface BudgetProgressProps {
  name: string;
  icon?: string | null;
  spent: number;
  limit: number;
  currency: string;
}

export default function BudgetProgress({ name, icon, spent, limit, currency }: BudgetProgressProps) {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  const getStatusColor = () => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTextColor = () => {
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  const remaining = Math.max(limit - spent, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">
              {currency} {spent.toFixed(2)} / {limit.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${getTextColor()}`}>
            {limit > 0 ? percentage.toFixed(0) : 0}%
          </span>
          <p className="text-xs text-gray-400">
            {remaining > 0 ? `${currency} ${remaining.toFixed(2)} restante` : "Excedido"}
          </p>
        </div>
      </div>

      <Progress.Root
        value={percentage}
        className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
      >
        <Progress.Indicator
          className={`h-full rounded-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </Progress.Root>

      {percentage >= 100 && (
        <div className="mt-2 flex items-center gap-1 text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">Presupuesto excedido</span>
        </div>
      )}
    </div>
  );
}
