import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export interface CashflowData {
  month: string;
  txn_type: "credit" | "debit";
  total_amount: number;
}

export interface CategorySpendData {
  category: string;
  total_amount: number;
}

export interface TopMerchantData {
  merchant: string;
  total_amount: number;
}

export interface BurnRateData {
  total_budget: number;
  total_spent: number;
  budget_usage_percent: number;
  month_progress_percent: number;
  is_over_pacing: boolean;
  daily_burn_rate: number;
}

export function useInsights() {
  const { token } = useAuth();

  const cashflow = useQuery({
    queryKey: ["insights", "cashflow"],
    queryFn: () => apiClient<CashflowData[]>("api/insights/cash-flow", { token }),
    enabled: !!token,
  });

  const categorySpend = useQuery({
    queryKey: ["insights", "category-spend"],
    queryFn: () => apiClient<CategorySpendData[]>("api/insights/category-spend", { token }),
    enabled: !!token,
  });

  const topMerchants = useQuery({
    queryKey: ["insights", "top-merchants"],
    queryFn: () => apiClient<TopMerchantData[]>("api/insights/top-merchants", { token }),
    enabled: !!token,
  });

  const burnRate = useQuery({
    queryKey: ["insights", "burn-rate"],
    queryFn: () => apiClient<BurnRateData>("api/insights/burn-rate", { token }),
    enabled: !!token,
  });

  return {
    cashflow,
    categorySpend,
    topMerchants,
    burnRate,
  };
}
