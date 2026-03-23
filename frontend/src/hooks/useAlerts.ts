import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export interface Alert {
  id: number;
  type: "low_balance" | "bill_due" | "budget_exceeded";
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useAlerts() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts"],
    queryFn: () => apiClient<Alert[]>("api/alerts/", { token }),
    enabled: !!token,
    refetchInterval: 30000,
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
  });

  const markAsRead = useMutation({
    mutationFn: (id: number) =>
      apiClient(`api/alerts/${id}`, {
        method: "PATCH",
        token,
        data: { is_read: true },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () =>
      apiClient("api/alerts/mark-read", {
        method: "POST",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: (id: number) =>
      apiClient(`api/alerts/${id}`, {
        method: "DELETE",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  return { ...query, markAsRead, deleteAlert, markAllAsRead };
}
