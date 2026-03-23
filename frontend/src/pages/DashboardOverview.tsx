import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/integrations/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, ArrowLeftRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import CurrencyRates from "@/components/CurrencyRates";

interface Account {
  id: number;
  account_number: string;
  balance: number;
  currency: string;
  account_type: string;
}

interface Transaction {
  id: number;
  txn_type: string;
  amount: number;
  description: string | null;
  category: string | null;
  currency: string;
  merchant: string | null;
  txn_date: string;
}

interface MonthlySummary {
  month: string;
  credit: number;
  debit: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl text-xs">
        <p className="font-semibold mb-1 text-foreground">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: ${p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

import { useInsights } from "@/hooks/useInsights";

export default function DashboardOverview() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { cashflow, burnRate } = useInsights();

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [accountsData, recentTxnData] = await Promise.all([
        apiClient("users/me/accounts/", { token }).catch(() => []),
        apiClient("transactions/me/", { token }).catch(() => []),
      ]);
      
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransactions(Array.isArray(recentTxnData) ? recentTxnData.slice(0, 5) : []);

    } catch (error: any) {
      toast({ 
        title: "Error fetching dashboard data", 
        description: "Failed to load your latest financial data.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, toast]);

  useEffect(() => {
    fetchData();

    // Step 4: Add Real-Time Feel (Auto-refresh every 60 seconds)
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const monthlyData = useMemo(() => {
    if (!cashflow.data) return [];
    const months: Record<string, { month: string; credit: number; debit: number }> = {};
    cashflow.data.forEach((item) => {
      const date = new Date(item.month);
      const monthLabel = date.toLocaleString('default', { month: 'short' });
      if (!months[monthLabel]) {
        months[monthLabel] = { month: monthLabel, credit: 0, debit: 0 };
      }
      if (item.txn_type === "credit") months[monthLabel].credit += item.total_amount;
      else months[monthLabel].debit += item.total_amount;
    });
    return Object.values(months).slice(-6); // Last 6 months
  }, [cashflow.data]);

  const totalBalance = useMemo(() => 
    accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
  , [accounts]);

  const formatCurrency = useCallback((amount: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">
          Welcome back, {user?.username || "there"}
        </h1>
        <p className="text-muted-foreground mt-1">Here's your financial overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-banking hover:shadow-xl transition-all duration-300 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
                <p className="text-3xl font-display font-bold mt-1 tabular-nums">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-banking hover:shadow-xl transition-all duration-300 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Linked Accounts</p>
                <p className="text-3xl font-display font-bold mt-1 tabular-nums">{accounts.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-banking hover:shadow-xl transition-all duration-300 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">KYC Status</p>
                <p className="text-3xl font-display font-bold mt-1 capitalize">{user?.kyc_status || "Pending"}</p>
              </div>
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${
                user?.kyc_status === "approved" ? "bg-success/10" : "bg-warning/10"
              }`}>
                <div className={`h-3 w-3 rounded-full animate-pulse ${
                  user?.kyc_status === "approved" ? "bg-success" : "bg-warning"
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-banking border-none h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-display flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Monthly Expenditure
              </CardTitle>
              <p className="text-sm text-muted-foreground">Credits vs Debits (last 6 months)</p>
            </CardHeader>
            <CardContent className="pt-4">
              {monthlyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                  <p>No transaction data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData} barCategoryGap="30%" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)", radius: 6 }} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: 20, fontSize: 12 }}
                      formatter={(value) => <span className="text-muted-foreground capitalize">{value}</span>}
                    />
                    <Bar dataKey="credit" name="credit" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="debit" name="debit" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <CurrencyRates />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-banking border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-display">Recent Transactions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Your latest activity</p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5" onClick={() => navigate("/dashboard/transactions")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <ArrowLeftRight className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No transactions yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/40 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
                        txn.txn_type === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}>
                        {txn.txn_type === "credit" ? (
                          <ArrowDownRight className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{txn.description || "No description"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="capitalize">{txn.merchant || txn.category || "General"}</span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          <span>{formatDate(txn.txn_date)}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${
                      txn.txn_type === "credit" ? "text-success" : "text-destructive"
                    }`}>
                      {txn.txn_type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(txn.amount), txn.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
