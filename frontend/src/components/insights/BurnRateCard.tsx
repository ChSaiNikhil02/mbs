import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BurnRateData } from "@/hooks/useInsights";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

interface BurnRateCardProps {
  data?: BurnRateData;
  isLoading: boolean;
}

export default function BurnRateCard({ data, isLoading }: BurnRateCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-banking border-none">
        <CardHeader>
          <CardTitle className="font-display text-lg">Burn Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const {
    cashflow,
    budget_adherence,
    month_progress_percent,
    daily_burn_rate,
  } = data as any;

  return (
    <Card className="shadow-banking border-none overflow-hidden">
      <CardHeader className="pb-4 border-b bg-muted/20">
        <CardTitle className="font-display text-xl flex items-center justify-between">
          Burn Rate
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-primary">₹{daily_burn_rate.toLocaleString()}</span>
            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Avg. Daily Spent</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border">
        {/* Section 1: Monthly Cashflow */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${cashflow.is_over_pacing ? "bg-destructive" : "bg-success"}`} />
              Monthly Cashflow
            </h4>
            <span className="text-[10px] text-muted-foreground italic">Income vs Spending</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Income: ₹{cashflow.income.toLocaleString()}</span>
              <span className={`font-bold ${cashflow.is_over_pacing ? "text-destructive" : "text-success"}`}>
                {cashflow.usage_percent.toFixed(0)}% Used
              </span>
            </div>
            <Progress 
              value={Math.min(cashflow.usage_percent, 100)} 
              className={`h-1.5 ${cashflow.is_over_pacing ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} 
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Month Progress: {month_progress_percent.toFixed(0)}%</span>
              <span>Spent: ₹{cashflow.spent.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Budget Adherence */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${budget_adherence.is_over_pacing ? "bg-destructive" : "bg-success"}`} />
              Budget Adherence
            </h4>
            <span className="text-[10px] text-muted-foreground italic">Category Targets</span>
          </div>

          {budget_adherence.limit > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Limit: ₹{budget_adherence.limit.toLocaleString()}</span>
                <span className={`font-bold ${budget_adherence.is_over_pacing ? "text-destructive" : "text-success"}`}>
                  {budget_adherence.usage_percent.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={Math.min(budget_adherence.usage_percent, 100)} 
                className={`h-1.5 ${budget_adherence.is_over_pacing ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} 
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Spent in categories: ₹{budget_adherence.spent.toLocaleString()}</span>
                <span>Remaining: ₹{Math.max(0, budget_adherence.limit - budget_adherence.spent).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center">
              <p className="text-[10px] text-muted-foreground">No category budgets set.</p>
              <Button variant="link" className="text-[10px] h-auto p-0" onClick={() => window.location.href='/budgets'}>
                Set Budgets
              </Button>
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className={`px-5 py-3 flex items-center gap-3 ${
          (cashflow.is_over_pacing || budget_adherence.is_over_pacing) ? "bg-destructive/5" : "bg-success/5"
        }`}>
          {(cashflow.is_over_pacing || budget_adherence.is_over_pacing) ? (
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          )}
          <p className="text-[11px] font-medium leading-tight">
            {(cashflow.is_over_pacing || budget_adherence.is_over_pacing)
              ? "Your spending pace is currently exceeding your targets."
              : "You are managing your finances well this month."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
