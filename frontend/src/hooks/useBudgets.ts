import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  month: number;
  year: number;
}

export function useBudgets(month: number, year: number) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["budgets", month, year],
    queryFn: () =>
      apiClient<Budget[]>(`api/budgets/?month=${month}&year=${year}`, { token }),
    enabled: !!token,
  });

  const createOrUpdateBudget = useMutation({
    mutationFn: (data: any) =>
      apiClient("api/budgets/", {
        method: "POST",
        token,
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] }); // Refresh alerts as budget changes might trigger them
    },
  });

  const deleteBudget = useMutation({
    mutationFn: (id: number) =>
      apiClient(`api/budgets/${id}/`, {
        method: "DELETE",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  return { ...query, createOrUpdateBudget, deleteBudget };
}
