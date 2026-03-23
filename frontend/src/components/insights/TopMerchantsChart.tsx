import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopMerchantData } from "@/hooks/useInsights";
import { ShoppingBag } from "lucide-react";

interface TopMerchantsChartProps {
  data: TopMerchantData[];
  isLoading: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--info))",
];

export default function TopMerchantsChart({ data, isLoading }: TopMerchantsChartProps) {
  return (
    <Card className="shadow-banking border-none">
      <CardHeader>
        <CardTitle className="font-display text-lg">Top Merchants</CardTitle>
        <p className="text-sm text-muted-foreground">Most frequent spending</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground animate-fade-in">
            <ShoppingBag className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">No merchants found</p>
            <p className="text-xs">Your top spending locations will appear here.</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  hide 
                />
                <YAxis 
                  dataKey="merchant" 
                  type="category" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => `₹${value.toFixed(2)}`}
                />
                <Bar dataKey="total_amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
