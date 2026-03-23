import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { parseISO, isValid } from "date-fns";

// Bill types matched to Backend/DB
export interface Bill {
  id: number;
  bill_name: string;
  amount: number;
  currency: string;
  category: string;
  due_date: string;
  status: "upcoming" | "paid" | "overdue" | "pending";
  is_paid: boolean;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BillFormData {
  bill_name: string;
  amount: number;
  due_date: string;
  status?: string;
  auto_pay?: boolean;
}

const safeDate = (dateStr: any) => {
  if (!dateStr) return new Date();
  const d = parseISO(dateStr);
  return isValid(d) ? d : new Date();
};

export function useBills() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const data = await apiClient<any[]>("api/bills/", { token });
      return data.map(item => ({
        id: item.id,
        bill_name: item.bill_name || item.biller_name || "Unnamed Bill",
        amount: Number(item.amount || item.amount_due || 0),
        currency: item.currency || "INR",
        category: item.category || "General",
        due_date: item.due_date || new Date().toISOString(),
        status: item.status || "pending",
        is_paid: !!(item.is_paid || item.paid || item.status === "paid"),
        paid_at: item.paid_at,
        notes: item.notes || "",
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      })) as Bill[];
    },
    enabled: !!token,
  });

  const createBill = useMutation({
    mutationFn: (data: BillFormData) => apiClient<Bill>("api/bills/", { token, data, method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const updateBill = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BillFormData> }) =>
      apiClient<Bill>(`api/bills/${id}/`, { token, data, method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const deleteBill = useMutation({
    mutationFn: (id: number) => apiClient(`api/bills/${id}/`, { token, method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const markAsPaid = useMutation({
    mutationFn: (id: number) => apiClient<Bill>(`api/bills/${id}/pay/`, { token, method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const getUpcomingBills = () => {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return (query.data || []).filter(bill => {
      if (bill.is_paid) return false;
      const dueDate = safeDate(bill.due_date);
      return dueDate >= now && dueDate <= sevenDaysLater;
    });
  };

  const getOverdueBills = () => {
    const now = new Date();
    return (query.data || []).filter(bill => {
      if (bill.is_paid) return false;
      const dueDate = safeDate(bill.due_date);
      return dueDate < now;
    });
  };

  return {
    ...query,
    bills: query.data || [],
    createBill,
    updateBill,
    deleteBill,
    markAsPaid,
    getUpcomingBills,
    getOverdueBills,
  };
}

// Rewards hook remains unchanged
export interface Reward {
    id: number;
    program_name: string;
    points_balance: number;
    last_updated: string;
}

export interface RedemptionPayload {
  reward_id: number;
  points?: number;
  redemption_type: "money" | "bill";
  account_id?: number;
  bill_id?: number;
}

export function useRewards() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["rewards"],
    queryFn: () => apiClient<Reward[]>("api/rewards/", { token }),
    enabled: !!token,
  });

  const redeemMutation = useMutation({
    mutationFn: (data: RedemptionPayload) => 
      apiClient("api/rewards/redeem", { 
        token, 
        data, 
        method: "POST" 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return { ...query, redeemMutation };
}

// Currency rates hook remains unchanged
export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  symbol: string;
}

interface CurrencyRatesResponse {
    rates: { [key: string]: number };
    last_updated: string;
}

const SYMBOL_MAP: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", AUD: "A$", INR: "₹", CNY: "¥"
}

const NAME_MAP: Record<string, string> = {
    USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen", CAD: "Canadian Dollar", AUD: "Australian Dollar", INR: "Indian Rupee", CNY: "Chinese Yuan"
}


export function useCurrencyRates() {
  const { token } = useAuth();
  const query = useQuery({
    queryKey: ["currencyRates"],
    queryFn: () => apiClient<CurrencyRatesResponse>("api/currency/rates/", { token }),
    enabled: !!token,
    select: (data) => {
        const rates: CurrencyRate[] = Object.entries(data.rates).map(([code, rate]) => ({
            code,
            rate,
            symbol: SYMBOL_MAP[code] || code,
            name: NAME_MAP[code] || code
        }));
        return {
            rates,
            lastUpdated: data.last_updated
        }
    }
  });

  const convertAmount = (amount: number, from: string, to: string): number => {
    // If base is INR, rates are [Target]/[INR]
    // To get INR from USD: Amount / Rate_of_USD
    const fromRate = query.data?.rates.find(r => r.code === from)?.rate || 1;
    const toRate = query.data?.rates.find(r => r.code === to)?.rate || 1;
    return (amount / fromRate) * toRate;
  };

  return { ...query, rates: query.data?.rates || [], lastUpdated: query.data?.lastUpdated || new Date().toISOString(), convertAmount };
}
