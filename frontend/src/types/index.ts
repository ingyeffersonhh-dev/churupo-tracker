export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface MerchantRule {
  id: string;
  user_id: string;
  keyword: string;
  category_id: string;
  created_at: string;
  category?: {
    name: string;
    type: string;
  };
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  limit_amount: number;
  currency: "USD" | "VES";
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: "USD" | "VES";
  usd_equivalent: number | null;
  transaction_date: string;
  description: string | null;
  source: "manual" | "csv";
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  total_expenses_usd: number;
  total_income_usd: number;
  balance_usd: number;
  by_category: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_type: string;
  spent_usd: number;
  budget_usd: number | null;
  percentage: number | null;
  status: "none" | "green" | "yellow" | "red";
}

export interface CSVUploadResult {
  imported: number;
  categorized: number;
  uncategorized: number;
  errors: string[];
}

export interface ExchangeRate {
  id: string;
  date: string;
  bcv_rate: number;
  parallel_rate: number;
}
