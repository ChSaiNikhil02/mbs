import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpendingData {
  [category: string]: number;
}

interface BudgetChartProps {
  month: number;
  year: number;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  "Food & Dining": "#FF6B6B",
  "Shopping": "#4ECDC4",
  "Transportation": "#45B7D1",
  "Bills & Utilities": "#96CEB4",
  "Entertainment": "#FFEAA7",
  "Health & Fitness": "#DDA0DD",
  "Travel": "#98D8C8",
  "Income": "#90EE90",
  "Transfer": "#ADD8E6",
  "Other": "#D3D3D3",
  "Uncategorized": "#808080",
};

export default function BudgetChart({ month, year }: BudgetChartProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [spending, setSpending] = useState<SpendingData>({});
  const [loading, setLoading] = useState(true);

  const fetchSpending = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data: { spending: SpendingData } = await apiClient(
        `api/budgets/spending-by-category?month=${month}&year=${year}`,
        { token }
      );
      setSpending(data.spending);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to load spending data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, month, year, toast]);

  useEffect(() => {
    fetchSpending();
  }, [fetchSpending]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const totalSpending = Object.values(spending).reduce((sum, val) => sum + val, 0);

  const sortedCategories = Object.entries(spending)
    .sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        ) : sortedCategories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No spending data for this month.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map(([category, amount]) => {
              const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
              const color = CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"];
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">{category}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Spending</span>
                <span className="text-xl font-bold">{formatCurrency(totalSpending)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
