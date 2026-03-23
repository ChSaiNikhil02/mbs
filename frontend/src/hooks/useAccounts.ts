import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export interface Account {
  id: number;
  user_id?: number;
  bank_name: string;
  account_number: string;
  account_type: string;
  masked_account: string;
  currency: string;
  balance: number;
  created_at: string;
}

export function useAccounts() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient<Account[]>("users/me/accounts/", { token }),
    enabled: !!isAuthenticated && !!token,
  });
}
