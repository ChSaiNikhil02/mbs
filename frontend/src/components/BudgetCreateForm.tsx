import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSACTION_CATEGORIES } from "@/lib/constants";

interface BudgetCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBudget?: {
    id: number;
    category: string;
    monthly_limit: number;
    month: number;
    year: number;
  } | null;
  onSuccess: () => void;
  defaultMonth?: number;
  defaultYear?: number;
}

const filteredBudgetCategories = TRANSACTION_CATEGORIES.filter(cat => cat !== "Income");

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function BudgetCreateForm({
  open,
  onOpenChange,
  editingBudget,
  onSuccess,
  defaultMonth,
  defaultYear,
}: BudgetCreateFormProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [month, setMonth] = useState<number>(defaultMonth || new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(defaultYear || new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingBudget) {
      setCategory(editingBudget.category);
      setMonthlyLimit(editingBudget.monthly_limit.toString());
      setMonth(editingBudget.month);
      setYear(editingBudget.year);
    } else {
      setCategory("");
      setMonthlyLimit("");
      setMonth(defaultMonth || new Date().getMonth() + 1);
      setYear(defaultYear || new Date().getFullYear());
    }
  }, [editingBudget, open, defaultMonth, defaultYear]);

  const handleSave = async () => {
    if (!token || !category || !monthlyLimit) return;

    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category,
        monthly_limit: limit,
        month,
        year,
      };

      if (editingBudget) {
        await apiClient(`api/budgets/${editingBudget.id}`, {
          method: "PUT",
          data: payload,
          token,
        });
        toast({
          title: "Budget updated",
          description: "Budget has been updated",
        });
      } else {
        await apiClient("api/budgets", {
          method: "POST",
          data: payload,
          token,
        });
        toast({
          title: "Budget created",
          description: "Budget has been created",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to save budget",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingBudget ? "Edit Budget" : "Create Budget"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredBudgetCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Monthly Limit</label>
            <Input
              type="number"
              placeholder="0.00"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select
                value={month.toString()}
                onValueChange={(v) => setMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={year.toString()}
                onValueChange={(v) => setYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!category || !monthlyLimit || loading}
          >
            {loading ? "Saving..." : editingBudget ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
