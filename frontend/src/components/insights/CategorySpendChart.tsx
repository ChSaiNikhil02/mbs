import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategorySpendData } from "@/hooks/useInsights";
import { PieChart as PieChartIcon } from "lucide-react";

interface CategorySpendChartProps {
  data: CategorySpendData[];
  isLoading: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--info))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

export default function CategorySpendChart({ data, isLoading }: CategorySpendChartProps) {
  return (
    <Card className="shadow-banking border-none">
      <CardHeader>
        <CardTitle className="font-display text-lg">Spending by Category</CardTitle>
        <p className="text-sm text-muted-foreground">Category breakdown</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground animate-fade-in">
            <PieChartIcon className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">No categories available</p>
            <p className="text-xs">Your spending patterns will show here.</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total_amount"
                  nameKey="category"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => `₹${value.toFixed(2)}`}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
