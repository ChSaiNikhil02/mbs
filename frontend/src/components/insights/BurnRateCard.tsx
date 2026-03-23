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

  if (!data || data.total_budget === 0) {
    return (
      <Card className="shadow-banking border-none">
        <CardHeader>
          <CardTitle className="font-display text-lg">Burn Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] flex flex-col items-center justify-center text-center text-muted-foreground">
            <p>No budget data for this month.</p>
            <p className="text-xs mt-1">Set a budget to track your burn rate.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    budget_usage_percent,
    month_progress_percent,
    is_over_pacing,
    total_spent,
    total_budget,
    daily_burn_rate,
  } = data;

  return (
    <Card className="shadow-banking border-none">
      <CardHeader>
        <CardTitle className="font-display text-lg">Burn Rate</CardTitle>
        <p className="text-sm text-muted-foreground">Budget usage vs month progress</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">Month Progress</span>
            <span className="font-bold">{month_progress_percent.toFixed(0)}%</span>
          </div>
          <Progress value={month_progress_percent} className="h-2 bg-muted" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">Budget Used</span>
            <span className={`font-bold ${is_over_pacing ? "text-destructive" : "text-success"}`}>
              {budget_usage_percent.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={Math.min(budget_usage_percent, 100)} 
            className={`h-2 ${is_over_pacing ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} 
          />
        </div>

        <div className="pt-4 border-t flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            is_over_pacing ? "bg-destructive/10" : "bg-success/10"
          }`}>
            {is_over_pacing ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-success" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {is_over_pacing ? "Over Pacing" : "Healthy Pacing"}
            </p>
            <p className="text-xs text-muted-foreground">
              {is_over_pacing 
                ? "You're spending faster than expected." 
                : "Your spending is currently within range."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Avg Daily</p>
            <p className="text-sm font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              ₹{daily_burn_rate.toFixed(2)}
            </p>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Remaining</p>
            <p className="text-sm font-bold">
              ₹{(total_budget - total_spent).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
