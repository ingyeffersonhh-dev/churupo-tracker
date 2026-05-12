const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return `https://churupo-backend.onrender.com`;
  }
  return "http://localhost:8000";
};

const API_URL = getApiUrl();

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      document.cookie =
        "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();
      window.location.replace("/login");
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    let msg = err.detail || "Error en la solicitud";
    if (typeof msg === "object") msg = JSON.stringify(msg);
    throw new Error(msg);
  }

  return res.json();
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getAnalyticsSummary = (month?: number, year?: number) => {
  const p = new URLSearchParams();
  if (month) p.append("month", String(month));
  if (year)  p.append("year",  String(year));
  const qs = p.toString();
  return fetchWithAuth(`/analytics/summary${qs ? `?${qs}` : ""}`);
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions = (params?: {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  source?: string;
  currency?: string;
  search?: string;
}) => {
  const q = new URLSearchParams();
  if (params?.start_date)  q.append("start_date",  params.start_date);
  if (params?.end_date)    q.append("end_date",    params.end_date);
  if (params?.category_id) q.append("category_id", params.category_id);
  if (params?.source)      q.append("source",      params.source);
  if (params?.currency)    q.append("currency",    params.currency);
  if (params?.search)      q.append("search",      params.search);
  
  const queryString = q.toString();
  return fetchWithAuth(`/transactions/${queryString ? `?${queryString}` : ""}`);
};

export const createTransaction = (data: {
  amount: number;
  currency: string;
  category_id?: string;
  description?: string;
  transaction_date: string;
}) => fetchWithAuth("/transactions/", { method: "POST", body: JSON.stringify(data) });

export const deleteTransaction = (id: string) =>
  fetchWithAuth(`/transactions/${id}`, { method: "DELETE" });

// ─── Categories ───────────────────────────────────────────────────────────────
export const getCategories = () => fetchWithAuth("/categories/");
export const createCategory = (data: { name: string; type: string; icon?: string }) =>
  fetchWithAuth("/categories/", { method: "POST", body: JSON.stringify(data) });
export const deleteCategory = (id: string) =>
  fetchWithAuth(`/categories/${id}`, { method: "DELETE" });

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const getBudgets = (month?: number, year?: number) => {
  const now = new Date();
  const m = month || (now.getMonth() + 1);
  const y = year || now.getFullYear();
  const p = new URLSearchParams();
  p.append("month", String(m));
  p.append("year",  String(y));
  return fetchWithAuth(`/budgets/?${p.toString()}`);
};
export const createBudget = (data: {
  category_id: string;
  limit_amount: number;
  currency: string;
  month: number;
  year: number;
}) => fetchWithAuth("/budgets/", { method: "POST", body: JSON.stringify(data) });
export const deleteBudget = (id: string) =>
  fetchWithAuth(`/budgets/${id}`, { method: "DELETE" });

// ─── Merchant Rules ───────────────────────────────────────────────────────────
export const getMerchantRules = () => fetchWithAuth("/merchant-rules/");
export const createMerchantRule = (data: { keyword: string; category_id: string }) =>
  fetchWithAuth("/merchant-rules/", { method: "POST", body: JSON.stringify(data) });
export const deleteMerchantRule = (id: string) =>
  fetchWithAuth(`/merchant-rules/${id}`, { method: "DELETE" });

// ─── Recurring Expenses ───────────────────────────────────────────────────────
export const getRecurringExpenses = () => fetchWithAuth("/recurring/");
export const createRecurringExpense = (data: {
  description: string;
  amount: number;
  currency: string;
  category_id?: string;
  day_of_month: number;
}) => fetchWithAuth("/recurring/", { method: "POST", body: JSON.stringify(data) });
export const updateRecurringExpense = (id: string, data: {
  description?: string;
  amount?: number;
  currency?: string;
  category_id?: string;
  day_of_month?: number;
  is_active?: boolean;
}) => fetchWithAuth(`/recurring/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteRecurringExpense = (id: string) =>
  fetchWithAuth(`/recurring/${id}`, { method: "DELETE" });
export const toggleRecurringExpense = (id: string) =>
  fetchWithAuth(`/recurring/${id}/toggle`, { method: "POST" });

// ─── Export Reports ───────────────────────────────────────────────────────────
export const downloadReport = async (format: "xlsx" | "pdf", month?: number, year?: number) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const params = new URLSearchParams();
  if (month) params.append("month", String(month));
  if (year) params.append("year", String(year));
  const qs = params.toString();

  const res = await fetch(`${API_URL}/export/${format}${qs ? `?${qs}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Error descargando reporte");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const contentDisposition = res.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  a.download = filenameMatch ? filenameMatch[1] : `reporte.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// ─── Exchange Rate ──────────────────────────────────────────────────────────────
export const getExchangeRate = () => fetchWithAuth("/exchange-rate");
