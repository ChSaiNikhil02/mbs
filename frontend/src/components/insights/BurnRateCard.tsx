import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
          <CardTitle className="font-display text-lg">Financial Health</CardTitle>
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
    <div className="space-y-6">
      {/* Block 1: Monthly Cashflow */}
      <Card className="shadow-banking border-none">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center justify-between">
            Monthly Cashflow
            <span className="text-xs font-normal text-muted-foreground">Income vs Spending</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground flex items-center gap-1">
                Income: ₹{cashflow.income.toLocaleString()}
              </span>
              <span className={`font-bold ${cashflow.is_over_pacing ? "text-destructive" : "text-success"}`}>
                {cashflow.usage_percent.toFixed(0)}% Used
              </span>
            </div>
            <Progress 
              value={Math.min(cashflow.usage_percent, 100)} 
              className={`h-2 ${cashflow.is_over_pacing ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} 
            />
            <div className="flex justify-between text-[10px] text-muted-foreground italic">
              <span>Month Progress: {month_progress_percent.toFixed(0)}%</span>
              <span>Spent: ₹{cashflow.spent.toLocaleString()}</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-xl flex items-center gap-3 ${cashflow.is_over_pacing ? "bg-destructive/5" : "bg-success/5"}`}>
            {cashflow.is_over_pacing ? (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            )}
            <p className="text-xs font-medium">
              {cashflow.is_over_pacing 
                ? "You are spending faster than your income." 
                : "Your spending is well within your income."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Block 2: Budget Adherence */}
      <Card className="shadow-banking border-none">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center justify-between">
            Budget Adherence
            <span className="text-xs font-normal text-muted-foreground">Category Targets</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budget_adherence.limit > 0 ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Budgeted: ₹{budget_adherence.limit.toLocaleString()}
                  </span>
                  <span className={`font-bold ${budget_adherence.is_over_pacing ? "text-destructive" : "text-success"}`}>
                    {budget_adherence.usage_percent.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(budget_adherence.usage_percent, 100)} 
                  className={`h-2 ${budget_adherence.is_over_pacing ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} 
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Spent in categories: ₹{budget_adherence.spent.toLocaleString()}</span>
                  <span>Rem: ₹{Math.max(0, budget_adherence.limit - budget_adherence.spent).toLocaleString()}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl flex items-center gap-3 ${budget_adherence.is_over_pacing ? "bg-destructive/5" : "bg-success/5"}`}>
                <TrendingUp className={`h-4 w-4 shrink-0 ${budget_adherence.is_over_pacing ? "text-destructive" : "text-success"}`} />
                <p className="text-xs font-medium">
                  {budget_adherence.is_over_pacing 
                    ? "Budget exceeded for set categories." 
                    : "On track with your category goals."}
                </p>
              </div>
            </>
          ) : (
            <div className="h-[100px] flex flex-col items-center justify-center text-center text-muted-foreground">
              <p className="text-xs">No specific category budgets set.</p>
              <Button variant="link" className="text-[10px] h-auto p-0" onClick={() => window.location.href='/budgets'}>
                Set Budgets
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Burn Rate Stat */}
      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Avg Daily Burn</p>
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <p className="text-2xl font-bold mt-1">₹{daily_burn_rate.toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground mt-1 italic">Average spending per day this month</p>
      </div>
    </div>
  );
}
