import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";

interface BudgetCardProps {
  id: number;
  category: string;
  monthly_limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  onEdit?: () => void;
  onDelete?: (id: number) => void;
}

export default function BudgetCard({
  id,
  category,
  monthly_limit,
  spent,
  remaining,
  percentage,
  onEdit,
  onDelete,
}: BudgetCardProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const isOverBudget = percentage >= 100;
  const isWarning = percentage >= 80 && percentage < 100;

  return (
    <Card className={isOverBudget ? "border-destructive" : isWarning ? "border-warning" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{category}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit?.()}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete?.(id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-medium">{formatCurrency(spent)}</span>
          </div>
          <Progress
            value={percentage}
            className={isOverBudget ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-warning" : ""}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium">{formatCurrency(monthly_limit)}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Remaining</span>
            <span className={isOverBudget ? "text-destructive font-medium" : "font-medium"}>
              {formatCurrency(remaining)}
            </span>
          </div>
          {isWarning && !isOverBudget && (
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span>Approaching budget limit</span>
            </div>
          )}
          {isOverBudget && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Over budget!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
