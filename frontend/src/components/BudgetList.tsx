import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import BudgetCard from "./BudgetCard";
import BudgetCreateForm from "./BudgetCreateForm";

interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  month: number;
  year: number;
}

interface BudgetListProps {
  month: number;
  year: number;
  onRuleChange?: () => void;
}

export default function BudgetList({ month, year }: BudgetListProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const fetchBudgets = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data: Budget[] = await apiClient(
        `api/budgets?month=${month}&year=${year}`,
        { token }
      );
      setBudgets(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to load budgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, month, year, toast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleDelete = async (budgetId: number) => {
    if (!token) return;
    try {
      await apiClient(`api/budgets/${budgetId}`, {
        method: "DELETE",
        token,
      });
      toast({
        title: "Budget deleted",
        description: "Budget has been deleted",
      });
      fetchBudgets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to delete budget",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleFormSuccess = () => {
    fetchBudgets();
    handleFormClose();
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Monthly Budgets</h2>
            <p className="text-muted-foreground">
              Track your spending by category
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Budget
          </Button>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No budgets set for this month.</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create your first budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                {...budget}
                onEdit={() => handleEdit(budget)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <BudgetCreateForm
          open={showForm}
          onOpenChange={handleFormClose}
          editingBudget={editingBudget}
          onSuccess={handleFormSuccess}
          defaultMonth={month}
          defaultYear={year}
        />
      )}
    </>
  );
}
