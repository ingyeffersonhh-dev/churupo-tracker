const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  // Obtener token de localStorage (guardado al hacer login)
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
    // Token expirado → redirigir a login
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
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
