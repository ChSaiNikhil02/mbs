import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashflowData } from "@/hooks/useInsights";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";

interface CashflowChartProps {
  data: CashflowData[];
  isLoading: boolean;
}

export default function CashflowChart({ data, isLoading }: CashflowChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];

    const months: Record<string, { month: string; credit: number; debit: number }> = {};

    data.forEach((item) => {
      const monthName = format(new Date(item.month), "MMM yyyy");
      if (!months[monthName]) {
        months[monthName] = { month: monthName, credit: 0, debit: 0 };
      }
      if (item.txn_type === "credit") {
        months[monthName].credit += item.total_amount;
      } else {
        months[monthName].debit += item.total_amount;
      }
    });

    return Object.values(months).sort((a, b) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime();
    });
  }, [data]);

  return (
    <Card className="shadow-banking border-none">
      <CardHeader>
        <CardTitle className="font-display text-lg">Cash Flow</CardTitle>
        <p className="text-sm text-muted-foreground">Income vs Expenses</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground animate-fade-in">
            <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">No transactions available</p>
            <p className="text-xs">Your cash flow will appear here.</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Bar dataKey="credit" name="Income" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debit" name="Expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
